"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";
import { toast } from "sonner";
import { createSupabaseBrowser } from "@/lib/supabase";
import { AdminField, adminInputStyle } from "@/components/ui/admin/AdminField";
import { AdminButton } from "@/components/ui/admin/AdminButton";

export function ChangePasswordCard({ userEmail }: { userEmail: string }) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden");
      return;
    }
    setSaving(true);
    setError("");
    const supabase = createSupabaseBrowser();
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });
    setSaving(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    toast.success("Contraseña actualizada");
    setPassword("");
    setConfirm("");
    setOpen(false);
  }

  return (
    <div
      style={{
        background: "var(--dash-surface)",
        border: "1px solid var(--dash-border)",
        borderRadius: 16,
        padding: 16,
      }}
    >
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: "var(--dash-surface-2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <KeyRound
              className="w-4 h-4"
              style={{ color: "var(--dash-muted)" }}
            />
          </div>
          <div>
            <p
              style={{
                fontWeight: 600,
                color: "var(--dash-text)",
                fontSize: 14,
              }}
            >
              Mi contraseña
            </p>
            <p style={{ fontSize: 12, color: "var(--dash-muted)" }}>
              {userEmail}
            </p>
          </div>
        </div>
        {!open && (
          <AdminButton variant="secondary" onClick={() => setOpen(true)}>
            Cambiar contraseña
          </AdminButton>
        )}
      </div>

      {open && (
        <div className="flex flex-col gap-3" style={{ marginTop: 16 }}>
          <AdminField label="Nueva contraseña" error={error}>
            <input
              type="password"
              value={password}
              autoFocus
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              placeholder="Mínimo 8 caracteres"
              style={adminInputStyle}
            />
          </AdminField>
          <AdminField label="Repetir contraseña">
            <input
              type="password"
              value={confirm}
              onChange={(e) => {
                setConfirm(e.target.value);
                setError("");
              }}
              placeholder="Repetí la contraseña"
              style={adminInputStyle}
            />
          </AdminField>
          <div className="flex gap-2">
            <AdminButton onClick={handleSave} disabled={saving}>
              {saving ? "Guardando..." : "Guardar"}
            </AdminButton>
            <AdminButton
              variant="secondary"
              onClick={() => {
                setOpen(false);
                setPassword("");
                setConfirm("");
                setError("");
              }}
            >
              Cancelar
            </AdminButton>
          </div>
        </div>
      )}
    </div>
  );
}
