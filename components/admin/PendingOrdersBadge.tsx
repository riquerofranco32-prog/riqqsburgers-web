"use client";

import { useState, useEffect } from "react";
import { createSupabaseBrowser } from "@/lib/supabase";

interface PendingOrdersBadgeProps {
  tenantId: string;
}

const PENDING_STATUSES = ["pending", "nuevo", "confirmed", "preparando"];

export default function PendingOrdersBadge({
  tenantId,
}: PendingOrdersBadgeProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const supabase = createSupabaseBrowser();

    async function fetchCount() {
      const { count: c } = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .in("status", PENDING_STATUSES);
      setCount(c ?? 0);
    }

    void fetchCount();

    const channel = supabase
      .channel(`pending-orders-${tenantId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
          filter: `tenant_id=eq.${tenantId}`,
        },
        () => {
          void fetchCount();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `tenant_id=eq.${tenantId}`,
        },
        () => {
          void fetchCount();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [tenantId]);

  if (count === 0) return null;

  return (
    <>
      <style>{`
        @keyframes pulse-badge {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
      <span
        style={{
          background: "var(--accent)",
          color: "#fff",
          fontSize: 11,
          fontWeight: 700,
          padding: "1px 6px",
          borderRadius: 999,
          minWidth: 18,
          textAlign: "center",
          display: "inline-block",
          lineHeight: "16px",
          animation: "pulse-badge 2s ease-in-out infinite",
          flexShrink: 0,
        }}
      >
        {count > 99 ? "99+" : count}
      </span>
    </>
  );
}
