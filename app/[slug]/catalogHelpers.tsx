import {
  Beef,
  Pizza,
  Coffee,
  Cake,
  Sandwich,
  Salad,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";

export interface PublicCoupon {
  code: string;
  discount_type: "percent" | "fixed";
  discount_value: number;
  min_order_amount: number | null;
}

export function fmt(n: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n);
}

export function vibrate(ms = 40) {
  if (typeof window !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(ms);
  }
}

export function normalize(str: string) {
  // eslint-disable-next-line no-misleading-character-class
  return str.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export function highlightText(
  text: string,
  query: string,
  accent: string,
): React.ReactNode {
  if (!query) return text;
  const q = normalize(query);
  if (!q) return text;
  const lowerText = normalize(text);
  const parts: React.ReactNode[] = [];
  let last = 0;
  let start = lowerText.indexOf(q);
  while (start !== -1) {
    if (start > last) parts.push(text.slice(last, start));
    parts.push(
      <span
        key={start}
        style={{
          background: accent + "30",
          color: accent,
          borderRadius: 3,
          padding: "0 1px",
        }}
      >
        {text.slice(start, start + q.length)}
      </span>,
    );
    last = start + q.length;
    start = lowerText.indexOf(q, last);
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}

export function hexToLuma(hex: string) {
  const c = hex.replace("#", "").padEnd(6, "0");
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

// Devuelve el color de texto con mejor contraste sobre el fondo dado
export function contrastText(
  bgHex: string,
  darkColor = "#111111",
  lightColor = "#ffffff",
): string {
  return hexToLuma(bgHex) > 140 ? darkColor : lightColor;
}

export function hexToRgba(hex: string, alpha: number) {
  const c = hex.replace("#", "").padEnd(6, "0");
  const r = parseInt(c.slice(0, 2), 16) || 0;
  const g = parseInt(c.slice(2, 4), 16) || 0;
  const b = parseInt(c.slice(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function getCategoryIcon(name: string): LucideIcon {
  const n = name.toLowerCase();
  if (n.includes("burger") || n.includes("hambur")) return Beef;
  if (n.includes("pizza")) return Pizza;
  if (
    n.includes("bebida") ||
    n.includes("café") ||
    n.includes("cafe") ||
    n.includes("tomar")
  )
    return Coffee;
  if (
    n.includes("postre") ||
    n.includes("torta") ||
    n.includes("dulce") ||
    n.includes("helado")
  )
    return Cake;
  if (
    n.includes("sandwich") ||
    n.includes("sándwich") ||
    n.includes("pancho") ||
    n.includes("wrap")
  )
    return Sandwich;
  if (n.includes("ensalada") || n.includes("vegano") || n.includes("verde"))
    return Salad;
  return UtensilsCrossed;
}
