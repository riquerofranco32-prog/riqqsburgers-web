"use client";

import { useState } from "react";
import Link from "next/link";
import { Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { AdminButton } from "@/components/ui/admin/AdminButton";
import { InlineConfirm } from "@/components/ui/admin/InlineConfirm";
import { Badge } from "@/components/ui/admin/Badge";

interface TeamMember {
  id: string;
  email: string | null;
  role: string;
  display_name: string | null;
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
}

const ROLE_LABEL: Record<string, string> = {
  admin: "Administrador",
  staff: "Cocina / Mozo",
};

function groupByTenant(members: TeamMember[]) {
  const groups = new Map<string, TeamMember[]>();
  for (const m of members) {
    const arr = groups.get(m.tenantName) ?? [];
    arr.push(m);
    groups.set(m.tenantName, arr);
  }
  return Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]));
}

export function GlobalTeamAdmin({
  initialMembers,
}: {
  initialMembers: TeamMember[];
}) {
  const [members, setMembers] = useState(initialMembers);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  async function handleDelete(member: TeamMember) {
    setConfirmDeleteId(null);
    try {
      const res = await fetch(
        `/api/tenant/${member.tenantSlug}/team/${member.id}`,
        { method: "DELETE" },
      );
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

  if (members.length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "56px 0",
          color: "var(--dash-muted)",
        }}
      >
        <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p style={{ fontSize: 14 }}>Todavía no hay miembros de equipo.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {groupByTenant(members).map(([tenantName, group]) => (
        <div key={tenantName}>
          <div className="flex items-center gap-2 mb-2.5">
            <Link
              href={`/${group[0].tenantSlug}/admin/equipo`}
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "var(--dash-text)",
                textDecoration: "none",
              }}
            >
              {tenantName}
            </Link>
            <Badge>{group.length}</Badge>
          </div>

          <div className="flex flex-col gap-2">
            {group.map((m) => (
              <div
                key={m.id}
                style={{
                  background: "var(--dash-surface)",
                  border: "1px solid var(--dash-border)",
                  borderRadius: 14,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 16px",
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
                    <Badge tone={m.role === "admin" ? "accent" : "neutral"}>
                      {ROLE_LABEL[m.role] ?? m.role}
                    </Badge>
                  </div>
                  {m.display_name && m.email && (
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
                        width: 38,
                        height: 38,
                        borderRadius: 10,
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
        </div>
      ))}
    </div>
  );
}
