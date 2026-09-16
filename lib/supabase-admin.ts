import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente con service_role: ignora RLS.
 * SOLO puede importarse desde codigo de servidor (route handlers,
 * server components, scripts). Si este modulo llega a un componente
 * con "use client", la llave termina en el navegador.
 *
 * Se crea en la primera llamada, no al cargar el modulo: `next build`
 * importa las rutas para recolectar datos de pagina y en ese momento
 * las variables de entorno pueden no estar (Vercel no las expone en
 * esa fase). Crear el cliente ahi tumbaba el build.
 */
if (typeof window !== "undefined") {
  throw new Error("supabase-admin no puede usarse en el cliente");
}

let cliente: SupabaseClient | undefined;

export function admin(): SupabaseClient {
  return (cliente ??= createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  ));
}
