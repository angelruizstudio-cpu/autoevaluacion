import { createClient } from "@supabase/supabase-js";

/**
 * Cliente con service_role: ignora RLS.
 * SOLO puede importarse desde codigo de servidor (route handlers,
 * server components, scripts). Si este modulo llega a un componente
 * con "use client", la llave termina en el navegador.
 */
if (typeof window !== "undefined") {
  throw new Error("supabase-admin no puede usarse en el cliente");
}

export const admin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);
