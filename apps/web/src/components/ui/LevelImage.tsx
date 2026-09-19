import { useState } from "react";
import { cn } from "../../lib/utils.ts";

/**
 * Imagem de exemplo de um nível. Prefere o PNG realista (gerado pelo utilizador)
 * em /img/guia/lvlN.png; se não existir (404/onError), cai no SVG de reserva.
 */
export function LevelImage({
  lv,
  className,
  alt,
}: {
  lv: number;
  className?: string;
  alt?: string;
}) {
  const [src, setSrc] = useState(`/img/guia/lvl${lv}.png`);
  return (
    <img
      src={src}
      alt={alt ?? `Exemplo visual do nível ${lv}`}
      loading="lazy"
      className={cn("bg-secondary/40 object-cover object-top", className)}
      onError={() => {
        if (src.endsWith(".png")) setSrc(`/img/guia/lvl${lv}.svg`);
      }}
    />
  );
}
