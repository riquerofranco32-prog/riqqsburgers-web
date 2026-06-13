"use client";

import { useState } from "react";
import { Store, Volume2, VolumeX, Wifi, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface OperationControlsProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  slug: string;
}

export function OperationControls({
  isOpen,
  setIsOpen,
  soundEnabled,
  setSoundEnabled,
  slug,
}: OperationControlsProps) {
  const [loading, setLoading] = useState(false);

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
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <p
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: "var(--dash-text)",
              marginBottom: 2,
            }}
          >
            Operación en vivo
          </p>
          <p style={{ fontSize: 12, color: "var(--dash-muted)" }}>
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
            padding: "4px 10px",
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
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#4ade80",
              boxShadow: "0 0 6px #4ade80",
              animation: "pulse-green 1.5s infinite ease-in-out",
            }}
          />
          <span style={{ fontSize: 10, fontWeight: 700, color: "#4ade80", letterSpacing: "0.02em" }}>
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
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          transition: "all 0.3s ease",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: isOpen ? "rgba(34, 197, 94, 0.12)" : "rgba(239, 68, 68, 0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: isOpen ? "1px solid rgba(34, 197, 94, 0.2)" : "1px solid rgba(239, 68, 68, 0.2)",
              color: isOpen ? "#4ade80" : "#f87171",
            }}
          >
            <Store size={20} />
          </div>
          <div>
            <p
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: isOpen ? "#4ade80" : "#f87171",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 2,
              }}
            >
              {isOpen ? "Abierto al público" : "Pausado / Cerrado"}
            </p>
            <p style={{ fontSize: 11, color: "var(--dash-muted)", lineHeight: 1.3 }}>
              {isOpen
                ? "Clientes pueden ver tu carta y enviarte pedidos por WhatsApp."
                : "Se desactivarán los pedidos y el menú mostrará un aviso de cerrado."}
            </p>
          </div>
        </div>

        <button
          onClick={handleToggleStatus}
          disabled={loading}
          style={{
            width: "100%",
            padding: "10px",
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
            border: "none",
            color: "#fff",
            background: isOpen
              ? "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
              : "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
            boxShadow: isOpen
              ? "0 2px 8px rgba(239, 68, 68, 0.2)"
              : "0 2px 8px rgba(34, 197, 94, 0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            transition: "transform 0.15s, box-shadow 0.15s",
          }}
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
            <Loader2 size={14} className="animate-spin" />
          ) : isOpen ? (
            "Pausar servicio"
          ) : (
            "Abrir restaurante"
          )}
        </button>
      </div>

      {/* Sound Chime Toggle */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "var(--dash-surface-2)",
          border: "1px solid var(--dash-border)",
          borderRadius: 12,
          padding: "14px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ color: soundEnabled ? "var(--accent)" : "var(--dash-muted)", display: "flex", alignItems: "center" }}>
            {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--dash-text)" }}>
              Timbre de cocina
            </p>
            <p style={{ fontSize: 11, color: "var(--dash-muted)", marginTop: 1 }}>
              Suena al recibir nuevos pedidos
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setSoundEnabled(!soundEnabled)}
          style={{
            width: 44,
            height: 24,
            borderRadius: 12,
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
              top: 3,
              left: soundEnabled ? 23 : 3,
              width: 18,
              height: 18,
              borderRadius: "50%",
              background: "#fff",
              boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
              transition: "left 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
        </button>
      </div>

      {/* Connection status log */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 11,
          color: "var(--dash-muted)",
          padding: "0 4px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <Wifi size={12} />
          <span>WebSocket activo</span>
        </div>
        <span>Servidor Mendoza-1</span>
      </div>
    </div>
  );
}
