import { useState, useEffect } from "react";
import type { Order } from "@/types/supabase";

export function fmtARS(n: number) {
  return "$ " + n.toLocaleString("es-AR");
}

export function fmtFecha(iso: string) {
  // TZ fija: el server (UTC) y el browser deben producir el mismo texto o
  // explota la hidratación (#425)
  return new Date(iso).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Argentina/Buenos_Aires",
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

const WARNING = {
  bg: "var(--dash-warning-bg)",
  color: "var(--dash-warning)",
  border: "var(--dash-warning-border)",
};
const INFO = {
  bg: "var(--dash-info-bg)",
  color: "var(--dash-info)",
  border: "var(--dash-info-border)",
};
const SUCCESS = {
  bg: "var(--dash-success-bg)",
  color: "var(--dash-success)",
  border: "var(--dash-success-border)",
};
const NEUTRAL = {
  bg: "var(--dash-neutral-bg)",
  color: "var(--dash-neutral)",
  border: "var(--dash-neutral-border)",
};
const DANGER = {
  bg: "var(--dash-danger-bg)",
  color: "var(--dash-danger)",
  border: "var(--dash-danger-border)",
};

export const STATUS_META: Record<
  string,
  { label: string; bg: string; color: string; border: string }
> = {
  pending: { label: "Pendiente", ...WARNING },
  nuevo: { label: "Nuevo", ...WARNING },
  confirmed: { label: "Confirmado", ...INFO },
  preparando: { label: "Preparando", ...INFO },
  preparing: { label: "Preparando", ...INFO },
  ready: { label: "Listo", ...SUCCESS },
  listo: { label: "Listo", ...SUCCESS },
  delivered: { label: "Entregado", ...NEUTRAL },
  entregado: { label: "Entregado", ...NEUTRAL },
  cancelled: { label: "Cancelado", ...DANGER },
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
  return STATUS_META[status] ?? { label: status, ...NEUTRAL };
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

function csvCell(value: string): string {
  // Comilla doble + separador por punto y coma: Excel AR abre bien con ; y
  // reconoce campos entre comillas con comas/saltos de línea adentro.
  return `"${value.replace(/"/g, '""')}"`;
}

/** Arma y descarga un CSV — usado por pedidos y clientes, mismo formato. */
export function downloadCsv(
  filenamePrefix: string,
  header: string[],
  rows: string[][],
) {
  const csv = [header, ...rows]
    .map((row) => row.map(csvCell).join(";"))
    .join("\r\n");

  // BOM para que Excel abra los acentos bien en UTF-8
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filenamePrefix}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportOrdersToCsv(orders: Order[]) {
  const header = ["Fecha", "Cliente", "Teléfono", "Items", "Total", "Estado"];
  const rows = orders.map((o) => [
    fmtFecha(o.created_at),
    o.customer_name ?? "",
    o.customer_phone ?? "",
    (o.items ?? []).map((it) => `${it.quantity}x ${it.name}`).join(", "),
    String(o.total ?? 0),
    getStatusMeta(o.status).label,
  ]);
  downloadCsv("pedidos", header, rows);
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

export function summarizeItems(order: Order, maxChars = 60): string {
  const items = order.items ?? [];
  if (items.length === 0) return "Sin items";
  const full = items.map((it) => `${it.quantity}x ${it.name}`).join(", ");
  if (full.length <= maxChars) return full;
  return full.slice(0, maxChars - 1).trimEnd() + "…";
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
