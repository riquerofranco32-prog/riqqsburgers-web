"use client";

import { useState, useEffect, useRef } from "react";
import { createSupabaseBrowser } from "@/lib/supabase";

interface PendingOrdersBadgeProps {
  tenantId: string;
  collapsed?: boolean;
}

const PENDING_STATUSES = ["pending", "nuevo", "confirmed", "preparando"];

export default function PendingOrdersBadge({
  tenantId,
  collapsed = false,
}: PendingOrdersBadgeProps) {
  const [count, setCount] = useState(0);
  const [animate, setAnimate] = useState(false);
  const prevCountRef = useRef(0);

  useEffect(() => {
    const supabase = createSupabaseBrowser();

    async function fetchCount() {
      const { count: c } = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .in("status", PENDING_STATUSES);
      
      const newCount = c ?? 0;
      setCount((prev) => {
        prevCountRef.current = prev;
        return newCount;
      });
    }

    void fetchCount();

    const uniqueId = Math.random().toString(36).substring(7);
    const channel = supabase
      .channel(`pending-orders-${tenantId}-${uniqueId}`)
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

  // Trigger bounce and glow animation when count increases
  useEffect(() => {
    if (count > prevCountRef.current) {
      setAnimate(true);
      const timer = setTimeout(() => setAnimate(false), 600);
      return () => clearTimeout(timer);
    }
    prevCountRef.current = count;
  }, [count]);

  if (count === 0) return null;

  const displayCount = count > 99 ? "99+" : count;

  if (collapsed) {
    return (
      <>
        <style>{`
          @keyframes pop-badge-collapsed {
            0% { transform: scale(0.6); }
            50% { transform: scale(1.5); }
            100% { transform: scale(1); }
          }
          @keyframes glow-pulse-collapsed {
            0% { box-shadow: 0 0 0 0px rgba(255, 107, 53, 0.8); }
            100% { box-shadow: 0 0 0 8px rgba(255, 107, 53, 0); }
          }
        `}</style>
        <span
          style={{
            position: "absolute",
            top: 4,
            right: 4,
            background: "var(--accent)",
            color: "#fff",
            fontSize: 9,
            fontWeight: 800,
            minWidth: 15,
            height: 15,
            borderRadius: 999,
            padding: count > 9 ? "0 3px" : "0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            lineHeight: 1,
            boxShadow: "0 0 0 2px var(--dash-surface-2), 0 2px 4px rgba(0,0,0,0.3)",
            animation: animate 
              ? "pop-badge-collapsed 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards, glow-pulse-collapsed 0.6s ease-out forwards" 
              : "none",
            pointerEvents: "none",
            userSelect: "none",
          }}
        >
          {displayCount}
        </span>
      </>
    );
  }

  return (
    <>
      <style>{`
        @keyframes pop-badge-expanded {
          0% { transform: scale(0.8); }
          50% { transform: scale(1.3); }
          100% { transform: scale(1); }
        }
        @keyframes pulse-badge-subtle {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.75; }
        }
        @keyframes glow-pulse-expanded {
          0% { box-shadow: 0 0 0 0px rgba(255, 107, 53, 0.6); }
          100% { box-shadow: 0 0 0 6px rgba(255, 107, 53, 0); }
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
          flexShrink: 0,
          boxShadow: animate ? "none" : "0 1px 2px rgba(255,107,53,0.2)",
          animation: animate
            ? "pop-badge-expanded 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards, glow-pulse-expanded 0.6s ease-out forwards"
            : "pulse-badge-subtle 2s ease-in-out infinite",
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        {displayCount}
      </span>
    </>
  );
}
