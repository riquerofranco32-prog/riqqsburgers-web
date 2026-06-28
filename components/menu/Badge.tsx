import {
  Flame,
  Sparkles,
  Tag,
  XCircle,
  Star,
  type LucideIcon,
} from "lucide-react";

const BADGE_META: Record<string, { color: string; label: string }> = {
  Popular: { color: "#EA580C", label: "Popular" },
  Nuevo: { color: "#2563EB", label: "Nuevo" },
  Promo: { color: "#DC2626", label: "Promo" },
  Agotado: { color: "#6B7280", label: "Agotado" },
  "Más pedido": { color: "#B45309", label: "Más pedido" },
};

const BADGE_ICONS: Record<string, LucideIcon> = {
  Popular: Flame,
  Nuevo: Sparkles,
  Promo: Tag,
  Agotado: XCircle,
  "Más pedido": Star,
};

export default function Badge({ badge }: { badge: string }) {
  const meta = BADGE_META[badge];
  const Icon = BADGE_ICONS[badge];
  if (!meta) return null;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
        fontSize: 10,
        fontWeight: 600,
        padding: "2px 8px",
        borderRadius: 999,
        background: meta.color + "18",
        color: meta.color,
        border: `1px solid ${meta.color}30`,
      }}
    >
      {Icon && <Icon size={9} strokeWidth={2.5} />}
      {meta.label}
    </span>
  );
}
