"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

export function AdminModal({
  title,
  onClose,
  children,
  footer,
  maxWidth = 420,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: number;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Focus trap + Escape + restore focus on close
  useEffect(() => {
    const previouslyFocused = document.activeElement;

    function getFocusable(): HTMLElement[] {
      return Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      ).filter((el) => !el.hasAttribute("disabled"));
    }

    getFocusable()[0]?.focus();

    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab") return;
      const focusable = getFocusable();
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    window.addEventListener("keydown", handleKey);

    return () => {
      window.removeEventListener("keydown", handleKey);
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)",
        padding: 16,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{
          width: "100%",
          maxWidth,
          maxHeight: "92dvh",
          background: "var(--dash-surface)",
          border: "1px solid var(--dash-border)",
          borderRadius: 18,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid var(--dash-border)",
            flexShrink: 0,
          }}
        >
          <h2
            style={{ fontSize: 16, fontWeight: 700, color: "var(--dash-text)" }}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "var(--dash-surface-2)",
              border: "none",
              color: "var(--dash-muted)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={16} />
          </button>
        </div>

        <div
          style={{
            padding: 20,
            display: "flex",
            flexDirection: "column",
            gap: 18,
            overflowY: "auto",
          }}
        >
          {children}
        </div>

        {footer && (
          <div
            style={{
              padding: "16px 20px",
              borderTop: "1px solid var(--dash-border)",
              flexShrink: 0,
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
