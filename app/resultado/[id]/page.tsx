import { notFound } from "next/navigation";
import { admin } from "@/lib/supabase-admin";
import Resultado from "./Resultado";
import { Lang, StyleId, ORDER } from "@/lib/content";

export const dynamic = "force-dynamic";

/**
 * El id de la evaluacion es un UUID v4: no es adivinable, asi que el
 * enlace de resultado funciona como enlace permanente para la persona.
 * No expone nombre ni correo, solo los porcentajes.
 */
export default async function ResultadoPage({
  params, searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const { id } = await params;
  const { lang } = await searchParams;

  const { data, error } = await admin()
    .from("evaluaciones")
    .select("idioma, pct_directivo, pct_visionario, pct_afiliativo, pct_democratico, pct_ejemplar, pct_formativo")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) notFound();

  const pcts = {} as Record<StyleId, number>;
  ORDER.forEach(s => { pcts[s] = (data as any)[`pct_${s}`]; });

  const idioma: Lang = lang === "en" || lang === "es" ? lang : (data.idioma as Lang);
  return <Resultado pcts={pcts} idiomaInicial={idioma} />;
}
