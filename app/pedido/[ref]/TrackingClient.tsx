"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const STATUS_STEPS = [
  { key: "pending", label: "Recibido", sub: "Tu pedido fue recibido" },
  {
    key: "preparing",
    label: "En preparación",
    sub: "Estamos preparando tu pedido",
  },
  { key: "ready", label: "Listo", sub: "Tu pedido está listo para entregar" },
  { key: "delivered", label: "Entregado", sub: "¡Que lo disfrutes!" },
] as const;

type StatusKey = (typeof STATUS_STEPS)[number]["key"];

const STATUS_INDEX: Record<string, number> = {
  pending: 0,
  nuevo: 0,
  preparing: 1,
  preparando: 1,
  ready: 2,
  listo: 2,
  delivered: 3,
  entregado: 3,
};

interface Props {
  orderId: string;
  initialStatus: string;
  accent: string;
  createdAt: string;
  etaMinutes: number;
}

export default function TrackingClient({
  orderId,
  initialStatus,
  accent,
  createdAt,
  etaMinutes,
}: Props) {
  const [status, setStatus] = useState(initialStatus);
  const [prevStatus, setPrevStatus] = useState(initialStatus);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    const channel = supabase
      .channel(`order-tracking-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          const newStatus = (payload.new as { status: string }).status;
          if (newStatus !== status) {
            setPrevStatus(status);
            setStatus(newStatus);
            setFlash(true);
            setTimeout(() => setFlash(false), 1200);
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const currentIdx = STATUS_INDEX[status] ?? 0;
  const isCancelled = status === "cancelled";
  const estimatedReadyAt = new Date(
    new Date(createdAt).getTime() + etaMinutes * 60_000,
  ).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });

  return (
    <div style={{ marginBottom: 24 }}>
      {/* Live indicator */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 20,
          fontSize: 11,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "#A8998C",
        }}
      >
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: "#22c55e",
            display: "inline-block",
            animation: "pulse-live 2s ease-in-out infinite",
            boxShadow: "0 0 0 0 rgba(34,197,94,0.4)",
          }}
        />
        Seguimiento en vivo
      </div>

      {/* Progress stepper */}
      <div style={{ position: "relative" }}>
        {/* Track line */}
        <div
          style={{
            position: "absolute",
            top: 16,
            left: 16,
            right: 16,
            height: 3,
            background: "#EDE8E3",
            borderRadius: 99,
            zIndex: 0,
          }}
        />
        {/* Filled track */}
        <div
          style={{
            position: "absolute",
            top: 16,
            left: 16,
            width:
              currentIdx === 0
                ? 0
                : `calc(${(currentIdx / 3) * 100}% - 32px * ${currentIdx / 3})`,
            height: 3,
            background: accent,
            borderRadius: 99,
            zIndex: 1,
            overflow: "hidden",
            transition: "width 0.6s cubic-bezier(0.22,1,0.36,1)",
          }}
        >
          {currentIdx > 0 && currentIdx < 3 && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)",
                width: "50%",
                animation: "trackShimmer 1.6s ease-in-out infinite",
              }}
            />
          )}
        </div>

        {/* Steps */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            position: "relative",
            zIndex: 2,
          }}
        >
          {STATUS_STEPS.map((step, idx) => {
            const done = idx < currentIdx;
            const active = idx === currentIdx;
            return (
              <div
                key={step.key}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                {/* Dot */}
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: done || active ? accent : "#EDE8E3",
                    border: active
                      ? `3px solid ${accent}`
                      : "3px solid transparent",
                    boxShadow:
                      active && flash
                        ? `0 0 0 6px ${accent}30`
                        : active
                          ? `0 0 0 4px ${accent}20`
                          : "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.4s ease",
                    transform: active && flash ? "scale(1.2)" : "scale(1)",
                  }}
                >
                  {done ? (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path
                        d="M2.5 7l3 3 6-6"
                        stroke="#fff"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: active ? "#fff" : "#C8BDB5",
                      }}
                    />
                  )}
                </div>

                {/* Label */}
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: active ? 700 : 500,
                    color: active ? "#1A1208" : done ? "#6B5B4E" : "#C8BDB5",
                    textAlign: "center",
                    lineHeight: 1.3,
                    transition: "color 0.3s",
                  }}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Current status message */}
      <div
        style={{
          marginTop: 20,
          padding: "12px 16px",
          background: `${accent}10`,
          border: `1px solid ${accent}25`,
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          gap: 10,
          transition: "all 0.3s ease",
          transform: flash ? "scale(1.02)" : "scale(1)",
        }}
      >
        <span style={{ fontSize: 18 }}>
          {currentIdx === 0
            ? "📋"
            : currentIdx === 1
              ? "👨‍🍳"
              : currentIdx === 2
                ? "✅"
                : "🎉"}
        </span>
        <div>
          <p
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "#1A1208",
              margin: 0,
            }}
          >
            {STATUS_STEPS[currentIdx]?.label ?? status}
          </p>
          <p
            style={{ fontSize: 12, color: "#6B5B4E", margin: 0, marginTop: 2 }}
          >
            {STATUS_STEPS[currentIdx]?.sub}
          </p>
        </div>
      </div>

      {!isCancelled && currentIdx < 3 && (
        <p
          style={{
            marginTop: 10,
            fontSize: 12,
            color: "#6B5B4E",
            textAlign: "center",
          }}
        >
          ⏱️ Estimado para las {estimatedReadyAt}
        </p>
      )}

      <style>{`
        @keyframes pulse-live {
          0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.4); }
          50% { box-shadow: 0 0 0 5px rgba(34,197,94,0); }
        }
        @keyframes trackShimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
}
