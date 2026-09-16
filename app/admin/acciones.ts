"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { admin } from "@/lib/supabase-admin";
import { firmarAdmin, leerAdmin, hashToken, COOKIE_ADMIN, DURACION_ADMIN_SEG } from "@/lib/sesion";
import { permitir } from "@/lib/limite";
import { enviarInvitaciones as mandarCorreos } from "@/lib/correo";

const ir = (q: Record<string, string>): never => redirect("/admin?" + new URLSearchParams(q));

async function ip() {
  return (await headers()).get("x-forwarded-for")?.split(",")[0].trim() || "desconocida";
}

export async function esAdmin() {
  return leerAdmin((await cookies()).get(COOKIE_ADMIN)?.value);
}

/* --- entrar / salir --------------------------------------------------- */

export async function entrar(form: FormData) {
  // 5 intentos por 15 minutos: una contrasena sola no aguanta fuerza bruta
  if (!permitir("login:" + await ip(), 5, 15 * 60_000)) ir({ error: "Demasiados intentos. Espera 15 minutos." });

  const dada = String(form.get("password") ?? "");
  const real = process.env.ADMIN_PASSWORD ?? "";
  // comparar hashes: mismo largo siempre, tiempo constante
  const a = createHash("sha256").update(dada).digest();
  const b = createHash("sha256").update(real).digest();
  if (!real || !timingSafeEqual(a, b)) ir({ error: "Contraseña incorrecta." });

  (await cookies()).set(COOKIE_ADMIN, await firmarAdmin(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    maxAge: DURACION_ADMIN_SEG
  });
  redirect("/admin");
}

export async function salir() {
  (await cookies()).set(COOKIE_ADMIN, "", { path: "/admin", maxAge: 0 });
  redirect("/admin");
}

/* --- enviar invitaciones --------------------------------------------- */

type Fila = { nombre: string | null; email: string; ministerio: string | null; idioma: "es" | "en" };

/**
 * Una persona por linea: nombre, correo, ministerio, idioma.
 * Separador: tabulador (pegado desde Excel), coma o punto y coma.
 * ponytail: un nombre con coma ("Rivera, Jose") se parte mal; pega
 * con tabuladores o usa punto y coma si eso pasa.
 */
function parsear(texto: string) {
  const filas: Fila[] = [];
  const errores: string[] = [];
  const vistos = new Set<string>();

  texto.split(/\r?\n/).forEach((linea, i) => {
    const t = linea.trim();
    if (!t) return;
    const sep = t.includes("\t") ? "\t" : t.includes(";") ? ";" : ",";
    const [nombre = "", email = "", ministerio = "", idioma = ""] = t.split(sep).map(s => s.trim());
    const correo = email.toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      if (i === 0 && /email|correo/i.test(t)) return;   // encabezado pegado
      errores.push(`Línea ${i + 1}: correo inválido (${email || "vacío"})`);
      return;
    }
    if (vistos.has(correo)) { errores.push(`Línea ${i + 1}: ${correo} está repetido`); return; }
    vistos.add(correo);

    filas.push({
      nombre: nombre || null,
      email: correo,
      ministerio: ministerio || null,
      idioma: idioma.toLowerCase() === "en" ? "en" : "es"
    });
  });
  return { filas, errores };
}

export async function enviar(form: FormData) {
  if (!(await esAdmin())) redirect("/admin");
  if (!process.env.RESEND_API_KEY || !process.env.CORREO_DESDE) {
    ir({ error: "Faltan RESEND_API_KEY o CORREO_DESDE en las variables de entorno." });
  }

  const nombreCiclo = String(form.get("ciclo") ?? "").trim();
  const { filas, errores } = parsear(String(form.get("participantes") ?? ""));
  if (!nombreCiclo) errores.unshift("Ponle nombre a la ronda.");
  if (filas.length === 0) errores.push("No hay participantes.");
  if (errores.length) ir({ error: errores.slice(0, 5).join(" · ") });

  const h = await headers();
  const base = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;

  const db = admin();
  const { data: ciclo, error: eCiclo } = await db
    .from("ciclos").insert({ nombre: nombreCiclo }).select("id").single();
  if (eCiclo) ir({ error: "No se pudo crear la ronda: " + eCiclo.message });

  // token en claro solo existe aqui y en el correo; la base guarda el hash
  const tokens = await Promise.all(filas.map(async f => {
    const token = randomBytes(32).toString("base64url");
    return { ...f, token, hash: await hashToken(token) };
  }));

  const { data: invs, error: eInv } = await db.from("invitaciones").insert(
    tokens.map(t => ({
      ciclo_id: ciclo!.id, token_hash: t.hash,
      nombre: t.nombre, email: t.email, ministerio: t.ministerio, idioma: t.idioma
    }))
  ).select("id, token_hash, expira_en");
  if (eInv || !invs) {
    await db.from("ciclos").delete().eq("id", ciclo!.id);
    ir({ error: "No se pudieron guardar las invitaciones: " + (eInv?.message ?? "") });
  }

  const vence = new Map(invs!.map(i => [i.token_hash, new Date(i.expira_en)]));
  const fallidos = await mandarCorreos(
    tokens.map(t => ({
      email: t.email, nombre: t.nombre, idioma: t.idioma,
      enlace: `${base}/e/${t.token}`,
      vence: vence.get(t.hash)!
    })),
    nombreCiclo
  );

  // Sin correo no hay enlace (el token no se puede reconstruir):
  // se borran esas invitaciones para poder volver a intentarlo.
  if (fallidos.length === filas.length) {
    await db.from("ciclos").delete().eq("id", ciclo!.id);   // cascada borra las invitaciones
    ir({ error: "No se pudo enviar ningún correo. Revisa RESEND_API_KEY y que el dominio de CORREO_DESDE esté verificado en Resend." });
  }
  if (fallidos.length) {
    await db.from("invitaciones").delete().eq("ciclo_id", ciclo!.id).in("email", fallidos);
  }

  ir({
    ciclo: ciclo!.id,
    enviados: String(filas.length - fallidos.length),
    ...(fallidos.length ? { fallidos: fallidos.join(", ") } : {})
  });
}

/* --- enlace abierto --------------------------------------------------- */

/** Ronda sin invitaciones personales: solo el enlace compartible. */
export async function crearRondaAbierta(form: FormData) {
  if (!(await esAdmin())) redirect("/admin");
  const nombre = String(form.get("ciclo") ?? "").trim();
  if (!nombre) ir({ error: "Ponle nombre a la ronda." });

  const { data, error } = await admin().from("ciclos")
    .insert({ nombre, enlace_publico: nuevoTokenPublico(), enlace_activo: true })
    .select("id").single();
  if (error) ir({ error: "No se pudo crear la ronda: " + error.message });
  ir({ ciclo: data!.id });
}

/** Activa o desactiva el enlace abierto de una ronda; lo crea si no existe. */
export async function enlaceAbierto(form: FormData) {
  if (!(await esAdmin())) redirect("/admin");
  const cicloId = String(form.get("ciclo") ?? "");
  const activar = form.get("accion") === "activar";

  const db = admin();
  const { data: c } = await db.from("ciclos").select("enlace_publico").eq("id", cicloId).maybeSingle();
  if (!c) ir({ error: "Esa ronda no existe." });

  const { error } = await db.from("ciclos").update({
    enlace_activo: activar,
    ...(activar && !c!.enlace_publico ? { enlace_publico: nuevoTokenPublico() } : {})
  }).eq("id", cicloId);
  if (error) ir({ error: "No se pudo cambiar el enlace: " + error.message });
  ir({ ciclo: cicloId });
}

// 192 bits, base64url: mas corto que el personal para que quepa en un
// mensaje sin partirse; igual de inadivinable.
const nuevoTokenPublico = () => randomBytes(24).toString("base64url");
