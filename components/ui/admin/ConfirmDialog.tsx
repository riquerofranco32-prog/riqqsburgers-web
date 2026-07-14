"use client";

import { AdminModal } from "./AdminModal";

/** Confirmación bloqueante genérica (reemplaza al window.confirm nativo) para
 * casos que no encajan en el patrón trigger/confirm inline de InlineConfirm,
 * como descartar cambios sin guardar al cerrar un modal. */
export function ConfirmDialog({
  title,
  message,
  confirmLabel = "Descartar",
  cancelLabel = "Seguir editando",
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <AdminModal
      title={title}
      onClose={onCancel}
      maxWidth={360}
      footer={
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: "10px 16px",
              borderRadius: 10,
              background: "var(--dash-surface-2)",
              color: "var(--dash-text)",
              border: "1px solid var(--dash-border)",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: "10px 16px",
              borderRadius: 10,
              background: "#ef4444",
              color: "#fff",
              border: "none",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            {confirmLabel}
          </button>
        </div>
      }
    >
      <p style={{ fontSize: 14, color: "var(--dash-muted)", margin: 0 }}>
        {message}
      </p>
    </AdminModal>
  );
}
