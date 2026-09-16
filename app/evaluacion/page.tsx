import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { leerSesion, COOKIE } from "@/lib/sesion";
import Quiz from "./Quiz";

export const dynamic = "force-dynamic";

export default async function EvaluacionPage() {
  const jar = await cookies();
  const sesion = await leerSesion(jar.get(COOKIE)?.value);
  if (!sesion) redirect("/enlace-no-valido");

  // El componente cliente NO recibe el id de invitacion: vive solo en
  // la cookie firmada. El navegador nunca ve a quien pertenece.
  return <Quiz idiomaInicial={sesion.idioma === "en" ? "en" : "es"} />;
}
