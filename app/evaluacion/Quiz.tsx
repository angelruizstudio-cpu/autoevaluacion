"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CONTENT, ITEM_STYLE, COLORS, ORDER, Lang } from "@/lib/content";
import Rueda from "@/app/Rueda";

export default function Quiz({ idiomaInicial }: { idiomaInicial: Lang }) {
  const [lang, setLang] = useState<Lang>(idiomaInicial);
  const [vista, setVista] = useState<"intro" | "quiz">("intro");
  const [idx, setIdx] = useState(0);
  const [resp, setResp] = useState<(number | null)[]>(
    () => new Array(ITEM_STYLE.length).fill(null)
  );
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const t = CONTENT[lang];

  async function enviar(final: (number | null)[]) {
    setEnviando(true);
    setError(null);
    try {
      const r = await fetch("/api/enviar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ respuestas: final, idioma: lang })
      });
      const data = await r.json();
      if (!r.ok) {
        setError(
          data.error === "ya_completada"
            ? (lang === "es" ? "Esta evaluación ya fue enviada." : "This assessment was already submitted.")
            : data.error === "sesion_expirada"
            ? (lang === "es" ? "La sesión venció. Abre tu enlace otra vez." : "Your session expired. Open your link again.")
            : (lang === "es" ? "No se pudo guardar. Intenta de nuevo." : "Couldn't save. Please try again.")
        );
        setEnviando(false);
        return;
      }
      router.push(`/resultado/${data.evaluacionId}?lang=${lang}`);
    } catch {
      setError(lang === "es" ? "Sin conexión. Intenta de nuevo." : "No connection. Try again.");
      setEnviando(false);
    }
  }

  function responder(valor: number) {
    const next = [...resp];
    next[idx] = valor;
    setResp(next);
    if (idx < ITEM_STYLE.length - 1) {
      setIdx(idx + 1);
      window.scrollTo({ top: 0 });
    } else {
      enviar(next);
    }
  }

  const barra = (
    <div className="topbar">
      <svg className="mark" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="10.5" fill="none" stroke="#1B3A6B" strokeWidth="1" />
        <path d="M12 12 L12 1.5 A10.5 10.5 0 0 1 21.1 6.75 Z" fill="#1B3A6B" />
        <path d="M12 12 L21.1 17.25 A10.5 10.5 0 0 1 12 22.5 Z" fill="#C08428" />
      </svg>
      <span className="title">{t.barTitle}</span>
      <div className="lang" role="group" aria-label="Idioma / Language">
        <button type="button" aria-pressed={lang === "es"} onClick={() => setLang("es")}>ES</button>
        <button type="button" aria-pressed={lang === "en"} onClick={() => setLang("en")}>EN</button>
      </div>
    </div>
  );

  if (vista === "intro") {
    return (
      <>
        {barra}
        <section className="hero">
          <h1 dangerouslySetInnerHTML={{ __html: t.heroTitle }} />
          <p className="lede">{t.heroLede}</p>
          <div className="wheel-hero"><Rueda lang={lang} /></div>
          <div className="meta">
            {t.meta.map(([n, l]: [string, string]) => (
              <div key={l}><b>{n}</b>{l}</div>
            ))}
          </div>
          <p className="lede" style={{ marginTop: 22, fontSize: ".95rem" }}
             dangerouslySetInnerHTML={{ __html: t.heroNote }} />
          <div className="actions">
            <button className="btn" onClick={() => setVista("quiz")}>{t.start}</button>
          </div>
        </section>
      </>
    );
  }

  const pct = Math.round(idx / ITEM_STYLE.length * 100);

  return (
    <>
      {barra}
      <section>
        <div className="progress">
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <div className="progress-text">
            <span>{t.counter(idx + 1, ITEM_STYLE.length)}</span>
            <span>{lang === "es" ? `${pct} %` : `${pct}%`}</span>
          </div>
        </div>

        <h2 className="q">{t.items[idx]}</h2>
        <p className="scale-note">{t.scaleNote}</p>

        <div className="opts">
          {t.scale.map((label: string, i: number) => (
            <button
              key={i}
              className="opt"
              type="button"
              disabled={enviando}
              aria-pressed={resp[idx] === i + 1}
              onClick={() => responder(i + 1)}
            >
              <span className="num">{i + 1}</span><span>{label}</span>
            </button>
          ))}
        </div>

        {error && (
          <p className="res-sub" style={{ color: "#A4343A", marginTop: 18 }}>{error}</p>
        )}

        <div className="nav">
          {idx > 0 && !enviando && (
            <button className="link" onClick={() => setIdx(idx - 1)}>{t.back}</button>
          )}
          {enviando && (
            <p className="res-sub">{lang === "es" ? "Guardando…" : "Saving…"}</p>
          )}
        </div>
      </section>
    </>
  );
}
