import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { admin } from "@/lib/supabase-admin";
import { leerSesion, COOKIE } from "@/lib/sesion";
import { validarRespuestas, puntuar } from "@/lib/puntuacion";
import { ITEM_STYLE } from "@/lib/content";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const jar = await cookies();
  const sesion = await leerSesion(jar.get(COOKIE)?.value);
  if (!sesion) {
    return NextResponse.json({ error: "sesion_expirada" }, { status: 401 });
  }

  let body: any;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "json_invalido" }, { status: 400 }); }

  // El cliente manda SOLO las respuestas crudas. Los porcentajes se
  // calculan aqui: si confiaramos en los del navegador, cualquiera
  // podria inyectar el perfil que quisiera.
  if (!validarRespuestas(body?.respuestas)) {
    return NextResponse.json({ error: "respuestas_invalidas" }, { status: 400 });
  }
  const idioma = body?.idioma === "en" ? "en" : "es";
  const { pcts, dominante, activos } = puntuar(body.respuestas);

  const detalle = body.respuestas.map((v: number, i: number) => ({
    n: i + 1, estilo: ITEM_STYLE[i], v
  }));

  const { data, error } = await admin().rpc("consumir_invitacion", {
    p_invitacion_id: sesion.invitacionId,
    p_idioma: idioma,
    p_pcts: pcts,
    p_dominante: dominante,
    p_activos: activos,
    p_respuestas: detalle
  });

  if (error) {
    // 'invitacion_no_valida' = alguien reenvio el formulario o corrio
    // dos pestanas a la vez. El UPDATE atomico ya lo bloqueo.
    const ya = error.message?.includes("invitacion_no_valida");
    return NextResponse.json(
      { error: ya ? "ya_completada" : "error_servidor" },
      { status: ya ? 409 : 500 }
    );
  }

  // La sesion se quema junto con el token
  const res = NextResponse.json({ ok: true, evaluacionId: data });
  res.cookies.set(COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
