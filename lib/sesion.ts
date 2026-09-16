import { SignJWT, jwtVerify } from "jose";

const secret = () => new TextEncoder().encode(process.env.SESSION_SECRET!);

export const COOKIE = "eval_sesion";
export const DURACION_SEG = 2 * 60 * 60; // 2 horas

export async function firmarSesion(invitacionId: string, idioma: string) {
  return new SignJWT({ inv: invitacionId, lang: idioma })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${DURACION_SEG}s`)
    .sign(secret());
}

export async function leerSesion(token: string | undefined) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return { invitacionId: payload.inv as string, idioma: payload.lang as string };
  } catch {
    return null;   // firma invalida o expirada
  }
}

/** SHA-256 en hex. Usa crypto.subtle para correr igual en Node y Edge. */
export async function hashToken(token: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}
