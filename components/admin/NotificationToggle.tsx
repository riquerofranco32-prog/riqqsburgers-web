"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, BellRing } from "lucide-react";

interface Props {
  tenantId: string;
  collapsed?: boolean;
}

type State = "unsupported" | "loading" | "denied" | "off" | "on";

export default function NotificationToggle({ tenantId, collapsed }: Props) {
  const [state, setState] = useState<State>("loading");

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window)
    ) {
      setState("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setState("denied");
      return;
    }
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setState(sub ? "on" : "off"))
      .catch(() => setState("off"));
  }, []);

  async function enable() {
    setState("loading");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState("denied");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
      });
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: sub.toJSON(),
          tenant_id: tenantId,
        }),
      });
      setState("on");
    } catch {
      setState("off");
    }
  }

  async function disable() {
    setState("loading");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setState("off");
    } catch {
      setState("off");
    }
  }

  if (state === "unsupported") return null;

  const isOn = state === "on";
  const isDenied = state === "denied";
  const isLoading = state === "loading";

  const title = isDenied
    ? "Notificaciones bloqueadas en el browser"
    : isOn
      ? "Notificaciones activas — click para desactivar"
      : "Activar notificaciones de pedidos";

  return (
    <button
      onClick={isOn ? disable : enable}
      disabled={isLoading || isDenied}
      title={title}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: collapsed ? "10px 0" : "10px 12px",
        justifyContent: collapsed ? "center" : "flex-start",
        width: "100%",
        background: "none",
        border: "none",
        borderRadius: 8,
        fontSize: 13,
        color: isOn
          ? "#4ade80"
          : isDenied
            ? "var(--dash-muted)"
            : "var(--dash-muted)",
        cursor: isLoading || isDenied ? "default" : "pointer",
        whiteSpace: "nowrap",
        transition: "color 0.15s",
        WebkitTapHighlightColor: "transparent",
        userSelect: "none",
        opacity: isDenied || isLoading ? 0.5 : 1,
      }}
      onMouseEnter={(e) => {
        if (!isLoading && !isDenied)
          e.currentTarget.style.color = isOn ? "#f87171" : "#4ade80";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = isOn ? "#4ade80" : "var(--dash-muted)";
      }}
    >
      {isOn ? (
        <BellRing size={14} strokeWidth={1.8} />
      ) : isDenied ? (
        <BellOff size={14} strokeWidth={1.8} />
      ) : (
        <Bell size={14} strokeWidth={1.8} />
      )}
      {!collapsed && (
        <span>
          {isLoading
            ? "..."
            : isOn
              ? "Notif. activas"
              : isDenied
                ? "Notif. bloqueadas"
                : "Activar notif."}
        </span>
      )}
    </button>
  );
}
