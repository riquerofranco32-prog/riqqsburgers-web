"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Trash2, UserCog, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { AdminModal } from "@/components/ui/admin/AdminModal";
import { AdminField, adminInputStyle } from "@/components/ui/admin/AdminField";
import { AdminButton } from "@/components/ui/admin/AdminButton";
import { InlineConfirm } from "@/components/ui/admin/InlineConfirm";
import { Badge } from "@/components/ui/admin/Badge";

interface TeamMember {
  id: string;
  email: string | null;
  role: string;
  display_name?: string | null;
}

const ROLE_LABEL: Record<string, string> = {
  admin: "Administrador",
  staff: "Cocina / Mozo",
};

const RTF = new Intl.RelativeTimeFormat("es-AR", { numeric: "auto" });

/** "hace 2 días" / "hace 3 horas" — usa Intl nativo, sin librería aparte. */
function timeAgo(iso: string): string {
  const diffMs = new Date(iso).getTime() - Date.now();
  const diffMin = Math.round(diffMs / 60_000);
  if (Math.abs(diffMin) < 60) return RTF.format(diffMin, "minute");
  const diffHours = Math.round(diffMin / 60);
  if (Math.abs(diffHours) < 24) return RTF.format(diffHours, "hour");
  const diffDays = Math.round(diffHours / 24);
  if (Math.abs(diffDays) < 30) return RTF.format(diffDays, "day");
  const diffMonths = Math.round(diffDays / 30);
  return RTF.format(diffMonths, "month");
}

function InviteModal({
  onSave,
  onClose,
}: {
  onSave: (email: string, password: string, role: string) => Promise<void>;
  onClose: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("staff");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function doSave() {
    if (!email.trim() || !email.includes("@")) {
      setError("Ingresá un email válido");
      return;
    }
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    setSaving(true);
    await onSave(email.trim(), password, role);
    setSaving(false);
  }

  return (
    <AdminModal
      title="Agregar miembro del equipo"
      onClose={onClose}
      footer={
        <AdminButton onClick={doSave} disabled={saving} fullWidth>
          {saving ? "Agregando..." : "Agregar"}
        </AdminButton>
      }
    >
      <AdminField label="Email *" error={error}>
        <input
          type="email"
          value={email}
          autoFocus
          onChange={(e) => {
            setEmail(e.target.value);
            setError("");
          }}
          placeholder="cocina@ejemplo.com"
          style={adminInputStyle}
        />
      </AdminField>

      <AdminField label="Contraseña inicial *">
        <div style={{ position: "relative" }}>
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
            placeholder="Mínimo 8 caracteres"
            style={{ ...adminInputStyle, paddingRight: 40 }}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={
              showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
            }
            style={{
              position: "absolute",
              right: 10,
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              color: "var(--dash-muted)",
              cursor: "pointer",
              display: "flex",
              padding: 4,
            }}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <p style={{ fontSize: 12, color: "var(--dash-muted)", marginTop: 6 }}>
          Se la pasás vos directamente a la persona. Puede cambiarla luego desde
          &quot;Mi cuenta&quot; en su propio panel.
        </p>
      </AdminField>

      <AdminField label="Rol">
        <div style={{ display: "flex", gap: 8 }}>
          {(["staff", "admin"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              style={{
                flex: 1,
                padding: "12px",
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                background:
                  role === r ? "var(--accent)" : "var(--dash-surface-2)",
                color: role === r ? "#fff" : "var(--dash-muted)",
                border: `1px solid ${role === r ? "var(--accent)" : "var(--dash-border)"}`,
              }}
            >
              {ROLE_LABEL[r]}
            </button>
          ))}
        </div>
        <p style={{ fontSize: 12, color: "var(--dash-muted)", marginTop: 6 }}>
          {role === "staff"
            ? "Solo ve y gestiona la sección de Pedidos."
            : "Acceso total: productos, precios, config y facturación."}
        </p>
      </AdminField>
    </AdminModal>
  );
}

export function TeamAdmin({
  slug,
  initialMembers,
  lastActivityByEmail = {},
  canAddMore = true,
  teamLimit = null,
}: {
  slug: string;
  initialMembers: TeamMember[];
  lastActivityByEmail?: Record<string, string>;
  canAddMore?: boolean;
  teamLimit?: number | null;
}) {
  const [members, setMembers] = useState(initialMembers);
  const [showModal, setShowModal] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  async function handleSave(email: string, password: string, role: string) {
    try {
      const res = await fetch(`/api/tenant/${slug}/team`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }),
      });
      if (res.ok) {
        const data: TeamMember = await res.json();
        setMembers((prev) => [...prev, data]);
        toast.success("Miembro agregado");
        setShowModal(false);
      } else {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        toast.error(data.error ?? "Error al agregar el miembro");
      }
    } catch {
      toast.error("Error al agregar el miembro");
    }
  }

  async function handleRoleChange(member: TeamMember, role: string) {
    if (role === member.role) return;
    const prevRole = member.role;
    setMembers((prev) =>
      prev.map((m) => (m.id === member.id ? { ...m, role } : m)),
    );
    try {
      const res = await fetch(`/api/tenant/${slug}/team/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(data.error ?? "Error al cambiar el rol");
      }
      toast.success("Rol actualizado");
    } catch (err) {
      setMembers((prev) =>
        prev.map((m) => (m.id === member.id ? { ...m, role: prevRole } : m)),
      );
      toast.error(
        err instanceof Error ? err.message : "Error al cambiar el rol",
      );
    }
  }

  async function handleDelete(member: TeamMember) {
    setConfirmDeleteId(null);
    try {
      const res = await fetch(`/api/tenant/${slug}/team/${member.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        toast.error(data.error ?? "Error al quitar el acceso");
        return;
      }
      setMembers((prev) => prev.filter((m) => m.id !== member.id));
      toast.success("Acceso eliminado");
    } catch {
      toast.error("Error al quitar el acceso");
    }
  }

  return (
    <div className="flex flex-col gap-5 w-full">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge tone={!canAddMore ? "warning" : "neutral"}>
            {members.length}
            {teamLimit !== null ? `/${teamLimit}` : ""} miembro
            {members.length !== 1 ? "s" : ""}
          </Badge>
          {!canAddMore && (
            <Link
              href={`/${slug}/admin/plan`}
              style={{ fontSize: 12, color: "var(--accent)", fontWeight: 600 }}
            >
              Límite del plan alcanzado → mejorar
            </Link>
          )}
        </div>
        <AdminButton onClick={() => setShowModal(true)} disabled={!canAddMore}>
          <Plus className="w-4 h-4" /> Agregar miembro
        </AdminButton>
      </div>

      {members.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "56px 0",
            color: "var(--dash-muted)",
          }}
        >
          <UserCog className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p style={{ fontSize: 14 }}>
            Todavía no agregaste a nadie del equipo.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {members.map((m) => (
            <div
              key={m.id}
              style={{
                background: "var(--dash-surface)",
                border: "1px solid var(--dash-border)",
                borderRadius: 16,
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: 16,
                flexWrap: "wrap",
              }}
            >
              <div style={{ flex: 1, minWidth: 180 }}>
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    style={{
                      fontWeight: 600,
                      color: "var(--dash-text)",
                      fontSize: 14,
                    }}
                  >
                    {m.display_name || m.email || "—"}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      void handleRoleChange(
                        m,
                        m.role === "admin" ? "staff" : "admin",
                      )
                    }
                    title="Click para cambiar de rol"
                    style={{
                      fontSize: 12,
                      padding: "2px 8px",
                      borderRadius: 999,
                      fontWeight: 600,
                      cursor: "pointer",
                      background:
                        m.role === "admin"
                          ? "rgba(255,107,53,0.1)"
                          : "rgba(96,165,250,0.1)",
                      color: m.role === "admin" ? "var(--accent)" : "#60a5fa",
                      border: `1px solid ${
                        m.role === "admin"
                          ? "rgba(255,107,53,0.3)"
                          : "rgba(96,165,250,0.3)"
                      }`,
                    }}
                  >
                    {ROLE_LABEL[m.role] ?? m.role} ⇄
                  </button>
                </div>
                {m.display_name && (
                  <p
                    style={{
                      fontSize: 12,
                      color: "var(--dash-muted)",
                      marginTop: 2,
                    }}
                  >
                    {m.email}
                  </p>
                )}
                <p
                  style={{
                    fontSize: 12,
                    color: "var(--dash-muted)",
                    marginTop: 2,
                  }}
                >
                  {m.email && lastActivityByEmail[m.email]
                    ? `Última actividad: ${timeAgo(lastActivityByEmail[m.email])}`
                    : "Sin actividad registrada"}
                </p>
              </div>

              <InlineConfirm
                active={confirmDeleteId === m.id}
                itemKey={m.id}
                confirm={
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    <AdminButton
                      variant="danger"
                      onClick={() => handleDelete(m)}
                    >
                      Confirmar
                    </AdminButton>
                    <AdminButton
                      variant="secondary"
                      onClick={() => setConfirmDeleteId(null)}
                    >
                      Cancelar
                    </AdminButton>
                  </div>
                }
                trigger={
                  <button
                    onClick={() => setConfirmDeleteId(m.id)}
                    aria-label="Quitar acceso"
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: "var(--dash-surface-2)",
                      border: "none",
                      color: "var(--dash-muted)",
                      cursor: "pointer",
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                }
              />
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <InviteModal onSave={handleSave} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}
