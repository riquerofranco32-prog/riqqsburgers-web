import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ── Category color utilities — compartidas entre catálogo público y admin ─────

export const CATEGORY_PALETTE = [
  "#f97316",
  "#3b82f6",
  "#22c55e",
  "#a855f7",
  "#eab308",
  "#ec4899",
  "#14b8a6",
  "#f43f5e",
] as const;

/**
 * Devuelve un color determinista de CATEGORY_PALETTE basado en el nombre
 * de la categoría (hash djb2). Mismo resultado para el mismo nombre, siempre.
 */
export function categoryColor(name: string): string {
  if (!name) return "#71717a";
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return CATEGORY_PALETTE[Math.abs(hash) % CATEGORY_PALETTE.length];
}
