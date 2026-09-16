#!/usr/bin/env node
/* =====================================================================
   Genera enlaces de un solo uso.

   Uso:
     node scripts/generar-enlaces.mjs "Liderazgo ICP — Otoño 2026" participantes.csv

   participantes.csv (con encabezado):
     nombre,email,ministerio,idioma
     Jose Rivera,jose@ejemplo.com,Jóvenes,es
     Mary Colon,mary@ejemplo.com,Alabanza,en

   Salida: enlaces-<fecha>.csv con el enlace de cada persona.

   ADVERTENCIA: ese archivo de salida contiene los tokens en claro.
   Es el unico momento en que existen fuera del correo del destinatario
   (la base de datos solo guarda el hash). Envia los enlaces y BORRALO.
   No lo subas a git ni a Drive.
===================================================================== */

import { createClient } from "@supabase/supabase-js";
import { randomBytes, createHash } from "crypto";
import { readFileSync, writeFileSync } from "fs";

const [, , nombreCiclo, archivoCsv] = process.argv;
if (!nombreCiclo || !archivoCsv) {
  console.error('Uso: node scripts/generar-enlaces.mjs "Nombre del ciclo" participantes.csv');
  process.exit(1);
}

for (const v of ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "NEXT_PUBLIC_SITE_URL"]) {
  if (!process.env[v]) { console.error(`Falta la variable ${v}`); process.exit(1); }
}

const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

// --- ciclo -----------------------------------------------------------
const { data: ciclo, error: eCiclo } = await db
  .from("ciclos").insert({ nombre: nombreCiclo }).select("id").single();
if (eCiclo) { console.error("Error creando el ciclo:", eCiclo.message); process.exit(1); }

// --- participantes ---------------------------------------------------
const lineas = readFileSync(archivoCsv, "utf8").trim().split(/\r?\n/);
const cols = lineas[0].split(",").map(s => s.trim().toLowerCase());
const filas = lineas.slice(1).map(l => {
  const v = l.split(",").map(s => s.trim());
  return Object.fromEntries(cols.map((c, i) => [c, v[i] ?? ""]));
});

const registros = [];
const salida = ["nombre,email,ministerio,idioma,enlace"];

for (const f of filas) {
  const token = randomBytes(32).toString("base64url");           // 256 bits
  const hash = createHash("sha256").update(token).digest("hex");
  const idioma = f.idioma === "en" ? "en" : "es";

  registros.push({
    ciclo_id: ciclo.id,
    token_hash: hash,
    nombre: f.nombre || null,
    email: f.email || null,
    ministerio: f.ministerio || null,
    idioma
  });

  const url = `${process.env.NEXT_PUBLIC_SITE_URL}/e/${token}`;
  salida.push(`${f.nombre},${f.email},${f.ministerio},${idioma},${url}`);
}

const { error: eInv } = await db.from("invitaciones").insert(registros);
if (eInv) { console.error("Error insertando invitaciones:", eInv.message); process.exit(1); }

const nombreSalida = `enlaces-${new Date().toISOString().slice(0, 10)}.csv`;
writeFileSync(nombreSalida, salida.join("\n") + "\n", "utf8");

console.log(`Ciclo creado: ${ciclo.id}`);
console.log(`${registros.length} invitaciones generadas`);
console.log(`Enlaces en: ${nombreSalida}`);
console.log(`\nBorra ese archivo despues de enviar los enlaces.`);
