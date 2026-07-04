"use client";

import { getStatusMeta, getOrderAgeMinutes, useNowMinute } from "./utils";

export function StatusBadge({ status }: { status: string }) {
  const meta = getStatusMeta(status);
  return (
    <span
      style={{
        display: "inline-block",
        padding: "4px 12px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
        background: meta.bg,
        color: meta.color,
        border: `1px solid ${meta.border}`,
        whiteSpace: "nowrap",
        letterSpacing: "0.01em",
      }}
    >
      {meta.label}
    </span>
  );
}

const ACTIVE_STATUSES = [
  "pending",
  "nuevo",
  "confirmed",
  "preparando",
  "preparing",
];

export function OrderAgeBadge({
  createdAt,
  status,
}: {
  createdAt: string;
  status: string;
}) {
  useNowMinute();
  if (!ACTIVE_STATUSES.includes(status)) return null;
  const mins = getOrderAgeMinutes(createdAt);
  if (mins < 2) return null;
  const color =
    mins >= 30 ? "#f87171" : mins >= 15 ? "#fb923c" : "var(--dash-muted)";
  return (
    <span style={{ fontSize: 11, color, fontWeight: mins >= 15 ? 700 : 400 }}>
      hace {mins}m
    </span>
  );
}
