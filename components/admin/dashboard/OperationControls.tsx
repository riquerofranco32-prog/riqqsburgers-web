"use client";

import { useState } from "react";
import {
  Store,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  Loader2,
  Play,
} from "lucide-react";
import { toast } from "sonner";
import {
  SOUND_OPTIONS,
  getSavedSound,
  saveSound,
  playSound,
  type SoundType,
} from "@/lib/sounds";
import type { RealtimeStatus } from "@/hooks/useOrdersRealtime";

interface OperationControlsProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  slug: string;
  realtimeStatus: RealtimeStatus;
}

export function OperationControls({
  isOpen,
  setIsOpen,
  soundEnabled,
  setSoundEnabled,
  slug,
  realtimeStatus,
}: OperationControlsProps) {
  const [loading, setLoading] = useState(false);
  const [selectedSound, setSelectedSound] = useState<SoundType>(() =>
    getSavedSound(),
  );

  async function handleToggleStatus() {
    setLoading(true);
    const nextState = !isOpen;
    try {
      const res = await fetch(`/api/tenant/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_open: nextState }),
      });

      if (res.ok) {
        setIsOpen(nextState);
        toast.success(
          nextState
            ? "¡Tienda abierta! Recibiendo pedidos."
            : "Tienda pausada. Clientes verán el menú cerrado.",
        );
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Error al actualizar el estado");
      }
    } catch {
      toast.error("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        background:
          "linear-gradient(145deg, var(--dash-surface) 0%, rgba(28,33,40,0.95) 100%)",
        border: "1px solid var(--dash-border)",
        borderRadius: 16,
        padding: "16px 20px",
      }}
      className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 w-full"
    >
      {/* Header & Live Indicator */}
      <div className="flex justify-between items-center lg:justify-start lg:gap-4 flex-shrink-0">
        <div>
          <p
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "var(--dash-text)",
              marginBottom: 1,
            }}
          >
            Operación en vivo
          </p>
          <p style={{ fontSize: 11, color: "var(--dash-muted)" }}>
            Control rápido de la tienda
          </p>
        </div>

        {/* Live Indicator */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "rgba(34, 197, 94, 0.08)",
            border: "1px solid rgba(34, 197, 94, 0.2)",
            borderRadius: 999,
            padding: "3px 8px",
          }}
        >
          <style>{`
            @keyframes pulse-green {
              0%, 100% { transform: scale(1); opacity: 1; }
              50% { transform: scale(1.3); opacity: 0.6; }
            }
          `}</style>
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: "var(--dash-success)",
              boxShadow: "0 0 5px var(--dash-success)",
              animation: "pulse-green 1.5s infinite ease-in-out",
            }}
          />
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: "var(--dash-success)",
              letterSpacing: "0.02em",
            }}
          >
            LIVE
          </span>
        </div>
      </div>

      {/* Store Status Card */}
      <div
        style={{
          background: isOpen
            ? "rgba(34, 197, 94, 0.04)"
            : "rgba(239, 68, 68, 0.04)",
          border: isOpen
            ? "1px solid rgba(34, 197, 94, 0.15)"
            : "1px solid rgba(239, 68, 68, 0.15)",
          borderRadius: 12,
          padding: "10px 14px",
          transition: "all 0.3s ease",
        }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-grow max-w-xl"
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: isOpen
                ? "rgba(34, 197, 94, 0.12)"
                : "rgba(239, 68, 68, 0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: isOpen
                ? "1px solid rgba(34, 197, 94, 0.2)"
                : "1px solid rgba(239, 68, 68, 0.2)",
              color: isOpen ? "var(--dash-success)" : "var(--dash-danger)",
              flexShrink: 0,
            }}
          >
            <Store size={16} />
          </div>
          <div>
            <p
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: isOpen ? "var(--dash-success)" : "var(--dash-danger)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 1,
              }}
            >
              {isOpen ? "Abierto" : "Cerrado"}
            </p>
            <p
              style={{
                fontSize: 10,
                color: "var(--dash-muted)",
                lineHeight: 1.2,
              }}
            >
              {isOpen
                ? "Carta abierta y recibiendo pedidos."
                : "Pedidos desactivados por ahora."}
            </p>
          </div>
        </div>

        <button
          onClick={handleToggleStatus}
          disabled={loading}
          style={{
            padding: "8px 14px",
            borderRadius: 8,
            fontSize: 11,
            fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
            border: "none",
            color: "#fff",
            background: isOpen
              ? "linear-gradient(135deg, var(--dash-danger) 0%, #dc2626 100%)"
              : "linear-gradient(135deg, var(--dash-success) 0%, #16a34a 100%)",
            boxShadow: isOpen
              ? "0 2px 8px rgba(239, 68, 68, 0.2)"
              : "0 2px 8px rgba(34, 197, 94, 0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
            transition: "transform 0.15s, box-shadow 0.15s",
          }}
          className="w-full sm:w-auto sm:min-w-[130px] flex-shrink-0"
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = isOpen
                ? "0 4px 12px rgba(239, 68, 68, 0.35)"
                : "0 4px 12px rgba(34, 197, 94, 0.35)";
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = isOpen
                ? "0 2px 8px rgba(239, 68, 68, 0.2)"
                : "0 2px 8px rgba(34, 197, 94, 0.2)";
            }
          }}
        >
          {loading ? (
            <Loader2 size={12} className="animate-spin" />
          ) : isOpen ? (
            "Pausar servicio"
          ) : (
            "Abrir restaurante"
          )}
        </button>
      </div>

      {/* Sound Chime Toggle + Sound Type Selector */}
      <div
        style={{
          background: "var(--dash-surface-2)",
          border: "1px solid var(--dash-border)",
          borderRadius: 12,
          padding: "10px 14px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
        className="flex-shrink-0 w-full sm:w-auto sm:min-w-[240px]"
      >
        {/* Toggle row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                color: soundEnabled ? "var(--accent)" : "var(--dash-muted)",
                display: "flex",
                alignItems: "center",
              }}
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </div>
            <div>
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--dash-text)",
                }}
              >
                Timbre de cocina
              </p>
              <p style={{ fontSize: 10, color: "var(--dash-muted)" }}>
                Suena en nuevos pedidos
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            style={{
              width: 40,
              height: 20,
              borderRadius: 10,
              background: soundEnabled ? "var(--accent)" : "var(--dash-border)",
              border: "none",
              cursor: "pointer",
              position: "relative",
              transition: "background 0.2s",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                position: "absolute",
                top: 2,
                left: soundEnabled ? 22 : 2,
                width: 16,
                height: 16,
                borderRadius: "50%",
                background: "#fff",
                boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                transition: "left 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            />
          </button>
        </div>

        {/* Sound type selector — only visible when sound is enabled */}
        {soundEnabled && (
          <div
            style={{
              display: "flex",
              gap: 4,
              flexWrap: "wrap",
            }}
          >
            {SOUND_OPTIONS.map((opt) => {
              const isActive = selectedSound === opt.key;
              return (
                <button
                  key={opt.key}
                  onClick={() => {
                    setSelectedSound(opt.key);
                    saveSound(opt.key);
                    playSound(opt.key);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "4px 10px",
                    borderRadius: 8,
                    fontSize: 11,
                    fontWeight: isActive ? 700 : 500,
                    border: isActive
                      ? "1px solid rgba(255,107,53,0.4)"
                      : "1px solid var(--dash-border)",
                    background: isActive
                      ? "rgba(255,107,53,0.1)"
                      : "transparent",
                    color: isActive ? "var(--accent)" : "var(--dash-muted)",
                    cursor: "pointer",
                    transition: "all 0.15s",
                    WebkitTapHighlightColor: "transparent",
                  }}
                >
                  <span style={{ fontSize: 13 }}>{opt.emoji}</span>
                  {opt.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Connection status log */}
      <div
        style={{
          display: "flex",
          fontSize: 10,
          color: "var(--dash-muted)",
          padding: "0 4px",
        }}
        className="flex-row justify-between items-center lg:flex-col lg:items-end lg:justify-center lg:gap-1.5 flex-shrink-0 w-full lg:w-auto"
      >
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {realtimeStatus === "connected" ? (
            <Wifi size={11} className="text-emerald-400" />
          ) : realtimeStatus === "connecting" ? (
            <Loader2 size={11} className="animate-spin text-amber-400" />
          ) : (
            <WifiOff size={11} className="text-red-400" />
          )}
          <span style={{ fontWeight: 600, color: "var(--dash-text)" }}>
            {realtimeStatus === "connected"
              ? "WebSocket activo"
              : realtimeStatus === "connecting"
                ? "Conectando..."
                : "Desconectado"}
          </span>
        </div>
        <span>
          {realtimeStatus === "connected"
            ? "Tiempo real activo"
            : realtimeStatus === "connecting"
              ? "Estableciendo conexión"
              : "Reconectando automáticamente..."}
        </span>
      </div>
    </div>
  );
}
