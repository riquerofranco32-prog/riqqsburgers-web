"use client";

import { useState } from "react";
import { Building2, ShieldCheck, Pencil } from "lucide-react";
import { toast } from "sonner";
import { adminInputStyle } from "@/components/ui/admin/AdminField";
import { AdminButton } from "@/components/ui/admin/AdminButton";

const ROLE_LABEL: Record<string, { label: string; desc: string }> = {
  superadmin: {
    label: "Superadmin",
    desc: "Acceso total a todos los negocios de Takefyy.",
  },
  admin: {
    label: "Administrador",
    desc: "Acceso total a este negocio: productos, precios, config y facturación.",
  },
  staff: {
    label: "Cocina / Mozo",
    desc: "Solo puede ver y gestionar la sección de Pedidos.",
  },
};

export function AccountInfoCard({
  email,
  role,
  tenantName,
  tenantSlug,
  displayName,
  canEditName,
}: {
  email: string;
  role: string;
  tenantName: string;
  tenantSlug: string;
  /** Nombre visible guardado en tenant_users para este negocio, si hay */
  displayName?: string | null;
  /** false para un superadmin sin fila propia en este tenant */
  canEditName?: boolean;
}) {
  const roleInfo = ROLE_LABEL[role] ?? { label: role, desc: "" };
  const isSuperAdmin = role === "superadmin";

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(displayName ?? "");
  const [saving, setSaving] = useState(false);

  async function saveName() {
    setSaving(true);
    try {
      const res = await fetch(`/api/tenant/${tenantSlug}/me`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ display_name: name.trim() }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(data.error ?? "No se pudo guardar el nombre");
      }
      toast.success("Nombre actualizado");
      setEditing(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "No se pudo guardar el nombre",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        background: "var(--dash-surface)",
        border: "1px solid var(--dash-border)",
        borderRadius: 16,
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <div>
        {canEditName && editing ? (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              value={name}
              autoFocus
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void saveName();
                if (e.key === "Escape") setEditing(false);
              }}
              placeholder="Tu nombre"
              maxLength={60}
              style={{ ...adminInputStyle, fontSize: 15 }}
            />
            <AdminButton onClick={() => void saveName()} disabled={saving}>
              {saving ? "..." : "Guardar"}
            </AdminButton>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <p
              style={{
                fontWeight: 700,
                color: "var(--dash-text)",
                fontSize: 16,
              }}
            >
              {displayName || email}
            </p>
            {canEditName && (
              <button
                onClick={() => setEditing(true)}
                title="Editar nombre visible"
                aria-label="Editar nombre visible"
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--dash-muted)",
                  cursor: "pointer",
                  display: "flex",
                  padding: 4,
                }}
              >
                <Pencil size={13} />
              </button>
            )}
          </div>
        )}
        {displayName && (
          <p style={{ fontSize: 12, color: "var(--dash-muted)", marginTop: 2 }}>
            {email}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: "rgba(255,107,53,0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <ShieldCheck className="w-4 h-4" style={{ color: "var(--accent)" }} />
        </div>
        <div>
          <p
            style={{
              fontSize: 11,
              color: "var(--dash-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              fontWeight: 700,
            }}
          >
            Rol
          </p>
          <p
            style={{ fontSize: 14, fontWeight: 600, color: "var(--dash-text)" }}
          >
            {roleInfo.label}
          </p>
          {roleInfo.desc && (
            <p
              style={{ fontSize: 12, color: "var(--dash-muted)", marginTop: 2 }}
            >
              {roleInfo.desc}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: "var(--dash-surface-2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Building2
            className="w-4 h-4"
            style={{ color: "var(--dash-muted)" }}
          />
        </div>
        <div>
          <p
            style={{
              fontSize: 11,
              color: "var(--dash-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              fontWeight: 700,
            }}
          >
            Negocio
          </p>
          <p
            style={{ fontSize: 14, fontWeight: 600, color: "var(--dash-text)" }}
          >
            {isSuperAdmin ? "Todos los negocios" : tenantName}
          </p>
          {!isSuperAdmin && (
            <p
              style={{
                fontSize: 12,
                color: "var(--dash-muted)",
                fontFamily: "var(--font-mono)",
                marginTop: 2,
              }}
            >
              /{tenantSlug}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
