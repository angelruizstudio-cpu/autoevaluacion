import { ORDER, ITEM_STYLE, StyleId } from "./content";

export type Respuestas = number[]; // 30 valores de 1 a 5

export function validarRespuestas(r: unknown): r is Respuestas {
  return Array.isArray(r)
    && r.length === ITEM_STYLE.length
    && r.every(v => Number.isInteger(v) && v >= 1 && v <= 5);
}

export function puntuar(respuestas: Respuestas) {
  const crudo: Record<string, number> = {};
  const cuenta: Record<string, number> = {};
  ORDER.forEach(id => { crudo[id] = 0; cuenta[id] = 0; });

  ITEM_STYLE.forEach((id, i) => { crudo[id] += respuestas[i]; cuenta[id]++; });

  const pcts = {} as Record<StyleId, number>;
  ORDER.forEach(id => {
    const min = cuenta[id], max = cuenta[id] * 5;
    pcts[id] = Math.round((crudo[id] - min) / (max - min) * 100);
  });

  const ranked = [...ORDER].sort((a, b) => pcts[b] - pcts[a]);
  return {
    pcts,
    dominante: ranked[0],
    segundo: ranked[1],
    masBajo: ranked[ranked.length - 1],
    activos: ORDER.filter(id => pcts[id] >= 60).length
  };
}
