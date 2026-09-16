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
    // la cookie de admin lleva la misma firma: no vale como participante
    if (typeof payload.inv !== "string") return null;
    return { invitacionId: payload.inv, idioma: payload.lang as string };
  } catch {
    return null;   // firma invalida o expirada
  }
}

/* --- sesion de administrador ----------------------------------------- */

export const COOKIE_ADMIN = "admin_sesion";
export const DURACION_ADMIN_SEG = 12 * 60 * 60; // 12 horas

export async function firmarAdmin() {
  return new SignJWT({ adm: true })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${DURACION_ADMIN_SEG}s`)
    .sign(secret());
}

export async function leerAdmin(token: string | undefined) {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload.adm === true;
  } catch {
    return false;
  }
}

/** SHA-256 en hex. Usa crypto.subtle para correr igual en Node y Edge. */
export async function hashToken(token: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}
