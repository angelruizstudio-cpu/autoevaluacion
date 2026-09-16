"use client";

import { CONTENT, COLORS, ORDER, StyleId, Lang } from "@/lib/content";

const CX = 170, CY = 170, R_MIN = 28, R_MAX = 118;

const polar = (r: number, deg: number): [number, number] => {
  const a = (deg - 90) * Math.PI / 180;
  return [CX + r * Math.cos(a), CY + r * Math.sin(a)];
};

function sector(r: number, i: number) {
  const [x0, y0] = polar(r, i * 60 + 1.2);
  const [x1, y1] = polar(r, (i + 1) * 60 - 1.2);
  return `M ${CX} ${CY} L ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r} ${r} 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)} Z`;
}

export default function Rueda(
  { lang, pcts }: { lang: Lang; pcts?: Record<StyleId, number> }
) {
  const S = CONTENT[lang].styles;
  return (
    <svg className="wheel" viewBox="0 0 340 340" role="img"
         aria-label={pcts
           ? (lang === "es" ? "Rueda con tus puntuaciones por estilo" : "Wheel showing your score for each style")
           : (lang === "es" ? "Rueda de los seis estilos de liderazgo" : "Wheel of the six leadership styles")}>
      {[0.25, 0.5, 0.75, 1].map(f => (
        <circle key={f} cx={CX} cy={CY} r={R_MIN + (R_MAX - R_MIN) * f}
                fill="none" stroke={f === 1 ? "#C9CFD9" : "#D8DDE4"} />
      ))}
      {ORDER.map((id, i) => {
        const p = pcts ? pcts[id] : null;
        const r = p === null ? R_MIN + (R_MAX - R_MIN) * 0.12 : R_MIN + (R_MAX - R_MIN) * (p / 100);
        return <path key={id} d={sector(r, i)}
                     fill={p === null ? "#D3D8DF" : COLORS[id]}
                     fillOpacity={p === null ? 1 : 0.88} />;
      })}
      {ORDER.map((id, i) => {
        const mid = i * 60 + 30;
        const [tx, ty] = polar(R_MAX + 24, mid);
        return (
          <text key={id} x={tx.toFixed(1)} y={(ty + 4).toFixed(1)}
                fontFamily="Karla, sans-serif" fontSize="12" fontWeight="500"
                fill={pcts ? COLORS[id] : "#5A6478"}
                textAnchor={mid < 180 ? "start" : "end"}>
            {pcts ? `${S[id].name} ${pcts[id]}%` : S[id].name}
          </text>
        );
      })}
    </svg>
  );
}
