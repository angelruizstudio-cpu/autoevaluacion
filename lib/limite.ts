/* =====================================================================
   Limite de intentos por IP para /e/[token].

   Sin esto la ruta es enumerable: un atacante puede probar tokens en
   serie hasta dar con uno vivo. Adivinar 256 bits no es viable, pero
   el martilleo si castiga la base de datos y el presupuesto.

   ponytail: la cuenta vive en la memoria del proceso. En Vercel cada
   instancia lleva la suya y un reinicio la borra, asi que esto frena
   el martilleo desde una IP pero NO es la defensa final. El techo real
   es Vercel > Firewall (limite por IP) o Upstash Redis si lo quieres
   controlar en codigo. Esto es el piso, no el techo.
===================================================================== */

const golpes = new Map<string, number[]>();

export const MAX = 10;
export const VENTANA_MS = 10 * 60_000; // 10 minutos

/**
 * Devuelve false cuando la IP ya gasto sus intentos en la ventana.
 * `ahora` se inyecta para poder probar sin relojes falsos.
 */
export function permitir(
  ip: string,
  max = MAX,
  ventanaMs = VENTANA_MS,
  ahora = Date.now()
): boolean {
  const recientes = (golpes.get(ip) ?? []).filter(t => ahora - t < ventanaMs);

  if (recientes.length >= max) {
    golpes.set(ip, recientes); // no crece: los bloqueados no suman mas
    return false;
  }

  recientes.push(ahora);
  golpes.set(ip, recientes);

  // El mapa solo se purga cuando ya pesa. Barrerlo en cada peticion
  // seria O(n) por visita para no ganar nada.
  if (golpes.size > 10_000) purgar(ventanaMs, ahora);
  return true;
}

function purgar(ventanaMs: number, ahora: number) {
  for (const [ip, ts] of golpes) {
    if (ts.length === 0 || ahora - ts[ts.length - 1] >= ventanaMs) golpes.delete(ip);
  }
}

/** Solo para las pruebas. */
export function reiniciar() {
  golpes.clear();
}
