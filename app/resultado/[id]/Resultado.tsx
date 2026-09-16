"use client";

import { useState } from "react";
import { CONTENT, COLORS, ORDER, StyleId, Lang } from "@/lib/content";
import Rueda from "@/app/Rueda";

export default function Resultado({
  pcts, idiomaInicial
}: { pcts: Record<StyleId, number>; idiomaInicial: Lang }) {
  const [lang, setLang] = useState<Lang>(idiomaInicial);
  const t = CONTENT[lang];
  const S = t.styles;

  const ranked = [...ORDER].sort((a, b) => pcts[b] - pcts[a]);
  const [top, segundo] = ranked;
  const bajo = ranked[ranked.length - 1];
  const activos = ORDER.filter(id => pcts[id] >= 60).length;
  const pc = (p: number) => lang === "es" ? `${p} %` : `${p}%`;

  const repertorio =
    activos >= 4 ? t.repMany(activos) :
    activos >= 2 ? t.repSome(activos) : t.repOne;

  return (
    <>
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

      <section>
        <h1 className="res-head">{t.resHead(S[top].name)}</h1>
        <p className="res-sub">{t.resSub(S[top].motto, S[segundo].name)}</p>

        <div className="wheel-hero"><Rueda lang={lang} pcts={pcts} /></div>

        <div className="verdict">
          <p dangerouslySetInnerHTML={{ __html: repertorio }} />
          <p dangerouslySetInnerHTML={{ __html: t.lowest(S[bajo].name, pcts[bajo], S[bajo].when) }} />
          <p>{t.watch(S[top].risk)}</p>
        </div>

        <h2 className="sec">{t.secBars}</h2>
        <p className="sec-note">{t.secBarsNote}</p>
        <div className="bars">
          {ranked.map(id => (
            <div className="bar-row" key={id}>
              <div className="bar-top">
                <span className="bar-name">{S[id].name}</span>
                <span className="bar-pct">{pc(pcts[id])}</span>
              </div>
              <div className="bar-track">
                <div className="bar-fill"
                     style={{ width: `${pcts[id]}%`, background: COLORS[id] }} />
              </div>
              <div className="bar-motto">{S[id].motto}</div>
            </div>
          ))}
        </div>

        <h2 className="sec">{t.secCards}</h2>
        <p className="sec-note">{t.secCardsNote}</p>
        {ranked.map((id, i) => (
          <details className="card" key={id} open={i === 0}
                   style={{ borderTopColor: COLORS[id] }}>
            <summary>
              <span className="disc-name">{S[id].name}</span>
              <span className="disc-pct">{pc(pcts[id])}</span>
            </summary>
            <div className="card-body">
              <h4>{t.lblWhat}</h4><p>{S[id].what}</p>
              <h4>{t.lblWhen}</h4><p>{S[id].when}</p>
              <h4>{t.lblRisk}</h4><p>{S[id].risk}</p>
              <div className="scripture">{S[id].scripture}</div>
            </div>
          </details>
        ))}

        <div className="actions">
          <button className="btn" onClick={() => window.print()}>{t.print}</button>
        </div>
      </section>
    </>
  );
}
