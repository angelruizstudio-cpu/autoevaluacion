import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { admin } from "@/lib/supabase-admin";
import { firmarSesion, hashToken, COOKIE, DURACION_SEG } from "@/lib/sesion";
import { permitir } from "@/lib/limite";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Abrir el enlace NO quema el token: solo abre una sesion de 2 horas.
 * El token se consume al enviar las respuestas (/api/enviar), en la
 * misma transaccion que guarda la evaluacion. Asi, si a alguien se le
 * cae la conexion en la pregunta 20, puede volver a entrar; pero una
 * vez enviado, el enlace muere.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const base = process.env.NEXT_PUBLIC_SITE_URL!;

  // Antes de tocar la base: sin esto la ruta es enumerable a fuerza
  // bruta. El 429 habla de la IP, no del token, asi que no filtra si
  // el enlace existe o no.
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "desconocida";
  if (!permitir(ip)) {
    return new NextResponse("Demasiados intentos. Espera unos minutos.", {
      status: 429,
      headers: { "Retry-After": "600" }
    });
  }

  // Nunca distinguir entre "no existe", "ya usado" y "vencido" en la
  // respuesta publica: eso convierte la ruta en un oraculo.
  const invalido = NextResponse.redirect(new URL("/enlace-no-valido", base));

  if (!token || token.length < 20 || token.length > 200) return invalido;

  const hash = await hashToken(token);
  const { data, error } = await admin.rpc("iniciar_invitacion", {
    p_token_hash: hash
  });

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
