import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { admin } from "@/lib/supabase-admin";
import { firmarSesion, COOKIE, DURACION_SEG } from "@/lib/sesion";
import { permitir } from "@/lib/limite";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Enlace abierto de una ronda: no identifica a nadie. Cada visita crea
 * una invitacion anonima y abre la misma sesion de 2 horas que un
 * enlace personal; de ahi en adelante el flujo es identico. El admin
 * lo activa y desactiva desde el panel.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const base = req.url;

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "desconocida";
  if (!permitir(ip)) {
    return new NextResponse("Demasiados intentos. Espera unos minutos.", {
      status: 429,
      headers: { "Retry-After": "600" }
    });
  }

  const invalido = NextResponse.redirect(new URL("/enlace-no-valido", base));
  if (!token || token.length < 20 || token.length > 200) return invalido;

  const { data, error } = await admin().rpc("abrir_enlace_publico", { p_token: token });
  if (error || !data || data.length === 0) return invalido;

  const inv = data[0];
  const jwt = await firmarSesion(inv.invitacion_id, inv.idioma);

  const res = NextResponse.redirect(new URL("/evaluacion", base));
  (await cookies()).set(COOKIE, jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DURACION_SEG
  });
  return res;
}
