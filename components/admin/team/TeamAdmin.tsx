"use client";

import { useState } from "react";
import { Plus, Trash2, UserCog } from "lucide-react";
import { Toast } from "@/components/admin/Toast";

interface TeamMember {
  id: string;
  email: string | null;
  role: string;
}

const ROLE_LABEL: Record<string, string> = {
  admin: "Administrador",
  staff: "Cocina / Mozo",
};

function InviteModal({
  onSave,
  onClose,
}: {
  onSave: (email: string, password: string, role: string) => Promise<void>;
  onClose: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-zinc-950 w-full max-w-md rounded-t-3xl md:rounded-3xl flex flex-col max-h-[92dvh] shadow-2xl border border-zinc-800">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 flex-shrink-0">
          <h2 className="font-bold font-[family-name:var(--font-syne)]">
            Agregar miembro del equipo
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide block mb-1.5">
              Email *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              placeholder="cocina@ejemplo.com"
              style={{ fontSize: 16 }}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 outline-none focus:border-yellow-400 transition-colors"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide block mb-1.5">
              Contraseña inicial *
            </label>
            <input
              type="text"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              placeholder="Mínimo 8 caracteres"
              style={{ fontSize: 16 }}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 outline-none focus:border-yellow-400 transition-colors"
            />
            <p className="text-xs text-zinc-600 mt-1.5">
              Se la pasás vos directamente a la persona. Puede cambiarla luego
              desde &quot;Olvidé mi contraseña&quot; en el login.
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide block mb-1.5">
              Rol
            </label>
            <div className="flex gap-2">
              {(["staff", "admin"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`flex-1 py-3 rounded-xl text-sm font-semibold border transition-colors ${
                    role === r
                      ? "bg-yellow-400 text-black border-yellow-400"
                      : "bg-zinc-900 text-zinc-400 border-zinc-700"
                  }`}
                >
                  {ROLE_LABEL[r]}
                </button>
              ))}
            </div>
            <p className="text-xs text-zinc-600 mt-1.5">
              {role === "staff"
                ? "Solo ve y gestiona la sección de Pedidos."
                : "Acceso total: productos, precios, config y facturación."}
            </p>
          </div>

          {error && <p className="text-red-400 text-xs">{error}</p>}
        </div>

        <div className="px-5 py-4 border-t border-zinc-800 flex-shrink-0">
          <button
            onClick={doSave}
            disabled={saving}
            className="w-full bg-yellow-400 text-black font-bold py-3.5 rounded-2xl hover:bg-amber-400 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {saving ? "Agregando..." : "Agregar"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function TeamAdmin({
  slug,
  initialMembers,
}: {
  slug: string;
  initialMembers: TeamMember[];
}) {
  const [members, setMembers] = useState(initialMembers);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
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
        setToast("Miembro agregado");
        setShowModal(false);
      } else {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        setToast(data.error ?? "Error al agregar el miembro");
      }
    } catch {
      setToast("Error al agregar el miembro");
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
        setToast(data.error ?? "Error al quitar el acceso");
        return;
      }
      setMembers((prev) => prev.filter((m) => m.id !== member.id));
      setToast("Acceso eliminado");
    } catch {
      setToast("Error al quitar el acceso");
    }
  }

  return (
    <div className="flex flex-col gap-5 w-full">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700 font-medium">
          {members.length} miembro{members.length !== 1 ? "s" : ""}
        </span>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 bg-yellow-400 text-black text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-amber-400 transition-colors min-h-[44px]"
        >
          <Plus className="w-4 h-4" /> Agregar miembro
        </button>
      </div>

      {members.length === 0 ? (
        <div className="text-center py-14 text-zinc-500">
          <UserCog className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Todavía no agregaste a nadie del equipo.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {members.map((m) => (
            <div
              key={m.id}
              className="bg-zinc-900 rounded-2xl border border-zinc-800 flex items-center gap-3 p-4 flex-wrap"
            >
              <div className="flex-1 min-w-[180px]">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-white text-sm">
                    {m.email ?? "—"}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${
                      m.role === "admin"
                        ? "bg-yellow-400/10 text-yellow-400 border-yellow-400/30"
                        : "bg-blue-400/10 text-blue-400 border-blue-400/30"
                    }`}
                  >
                    {ROLE_LABEL[m.role] ?? m.role}
                  </span>
                </div>
              </div>

              {confirmDeleteId === m.id ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500">¿Quitar?</span>
                  <button
                    onClick={() => handleDelete(m)}
                    className="text-xs font-semibold text-red-400 px-2.5 py-1.5 rounded-lg bg-red-400/10 border border-red-400/30"
                  >
                    Confirmar
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(null)}
                    className="text-xs text-zinc-500 px-2.5 py-1.5"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDeleteId(m.id)}
                  className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-500 hover:text-red-400 transition-colors flex-shrink-0"
                  title="Quitar acceso"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <InviteModal onSave={handleSave} onClose={() => setShowModal(false)} />
      )}
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}
