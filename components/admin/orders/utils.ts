import { useState, useEffect } from "react";
import type { Order } from "@/types/supabase";

export function fmtARS(n: number) {
  return "$ " + n.toLocaleString("es-AR");
}

export function fmtFecha(iso: string) {
  return new Date(iso).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function vibrate(pattern: number | number[]) {
  if (typeof window !== "undefined" && "vibrate" in navigator)
    navigator.vibrate(pattern);
}

export function getOrderAgeMinutes(createdAt: string): number {
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / 60_000);
}

export function useNowMinute() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isMobile;
}

export const STATUS_META: Record<
  string,
  { label: string; bg: string; color: string; border: string }
> = {
  pending: {
    label: "Pendiente",
    bg: "rgba(245,158,11,0.12)",
    color: "#f59e0b",
    border: "rgba(245,158,11,0.3)",
  },
  nuevo: {
    label: "Nuevo",
    bg: "rgba(245,158,11,0.12)",
    color: "#f59e0b",
    border: "rgba(245,158,11,0.3)",
  },
  confirmed: {
    label: "Confirmado",
    bg: "rgba(59,130,246,0.12)",
    color: "#60a5fa",
    border: "rgba(59,130,246,0.3)",
  },
  preparando: {
    label: "Preparando",
    bg: "rgba(59,130,246,0.12)",
    color: "#60a5fa",
    border: "rgba(59,130,246,0.3)",
  },
  ready: {
    label: "Listo",
    bg: "rgba(34,197,94,0.12)",
    color: "#4ade80",
    border: "rgba(34,197,94,0.3)",
  },
  listo: {
    label: "Listo",
    bg: "rgba(34,197,94,0.12)",
    color: "#4ade80",
    border: "rgba(34,197,94,0.3)",
  },
  delivered: {
    label: "Entregado",
    bg: "rgba(113,113,122,0.12)",
    color: "#a1a1aa",
    border: "rgba(113,113,122,0.3)",
  },
  entregado: {
    label: "Entregado",
    bg: "rgba(113,113,122,0.12)",
    color: "#a1a1aa",
    border: "rgba(113,113,122,0.3)",
  },
  preparing: {
    label: "Preparando",
    bg: "rgba(59,130,246,0.12)",
    color: "#60a5fa",
    border: "rgba(59,130,246,0.3)",
  },
  cancelled: {
    label: "Cancelado",
    bg: "rgba(239,68,68,0.12)",
    color: "#f87171",
    border: "rgba(239,68,68,0.3)",
  },
};

export const STATUS_FLOW = [
  { key: "pending", label: "Pendiente" },
  { key: "confirmed", label: "Confirmado" },
  { key: "preparing", label: "Preparando" },
  { key: "ready", label: "Listo" },
  { key: "delivered", label: "Entregado" },
] as const;

export const FILTER_PILLS = [
  { key: "all", label: "Todos" },
  { key: "pending", label: "Pendientes" },
  { key: "confirmed", label: "Confirmados" },
  { key: "ready", label: "Listos" },
  { key: "delivered", label: "Entregados" },
  { key: "cancelled", label: "Cancelados" },
] as const;

export type FilterKey = (typeof FILTER_PILLS)[number]["key"];

export function getStatusMeta(status: string) {
  return (
    STATUS_META[status] ?? {
      label: status,
      bg: "rgba(113,113,122,0.12)",
      color: "#a1a1aa",
      border: "rgba(113,113,122,0.3)",
    }
  );
}

export function normalizeStatus(status: string): string {
  const aliases: Record<string, string> = {
    nuevo: "pending",
    preparando: "confirmed",
    listo: "ready",
    entregado: "delivered",
  };
  return aliases[status] ?? status;
}

export function getNextStatus(
  status: string,
): (typeof STATUS_FLOW)[number]["key"] | null {
  const normalized = normalizeStatus(status);
  const idx = STATUS_FLOW.findIndex((s) => s.key === normalized);
  if (idx === -1 || idx >= STATUS_FLOW.length - 1) return null;
  return STATUS_FLOW[idx + 1].key;
}

export function paymentLabel(method: string) {
  if (method === "transfer") return "📲 Transfer";
  if (method === "mercadopago") return "📲 MP";
  return "💵 Efectivo";
}

export function deliveryLabel(type: string) {
  return type === "delivery" || type === "domicilio"
    ? "Delivery"
    : "Retiro en local";
}

export function matchesFilter(order: Order, filter: FilterKey): boolean {
  if (filter === "all") return true;
  const s = order.status;
  if (filter === "pending") return s === "pending" || s === "nuevo";
  if (filter === "confirmed") return s === "confirmed" || s === "preparando";
  if (filter === "ready") return s === "ready" || s === "listo";
  if (filter === "delivered") return s === "delivered" || s === "entregado";
  if (filter === "cancelled") return s === "cancelled";
  return false;
}
