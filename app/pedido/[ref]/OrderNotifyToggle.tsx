"use client";

import { useEffect, useState } from "react";

interface Props {
  orderId: string;
  accent: string;
}

type State = "unsupported" | "loading" | "denied" | "off" | "on";

export default function OrderNotifyToggle({ orderId, accent }: Props) {
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
      await fetch(`/api/orders/${orderId}/push-subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub.toJSON() }),
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
        await fetch(`/api/orders/${orderId}/push-subscribe`, {
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

  if (state === "unsupported" || state === "denied") return null;

  const isOn = state === "on";
  const isLoading = state === "loading";

  return (
    <button
      onClick={isOn ? disable : enable}
      disabled={isLoading}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        width: "100%",
        padding: "10px 14px",
        marginBottom: 20,
        background: isOn ? `${accent}10` : "#F5F0EC",
        border: `1px solid ${isOn ? accent + "40" : "#EDE8E3"}`,
        borderRadius: 12,
        fontSize: 13,
        fontWeight: 600,
        color: isOn ? accent : "#6B5B4E",
        cursor: isLoading ? "default" : "pointer",
        opacity: isLoading ? 0.6 : 1,
      }}
    >
      {isOn
        ? "🔔 Te avisamos cuando cambie el estado"
        : "🔔 Avisame cuando esté listo"}
    </button>
  );
}
