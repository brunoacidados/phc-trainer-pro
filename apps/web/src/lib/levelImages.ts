/** Ilustrações de exemplo (SVG) por nível — "o que vai fazer" visualmente. */
export const LEVEL_IMG: Record<number, string> = Object.fromEntries(
  Array.from({ length: 13 }, (_, i) => [i, `/img/guia/lvl${i}.svg`]),
);
export function levelImage(lv: number): string {
  return LEVEL_IMG[lv] ?? LEVEL_IMG[0];
}
