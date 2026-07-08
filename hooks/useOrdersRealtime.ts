"use client";

import { useEffect, useRef, useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase";
import type { Order } from "@/types/supabase";

export type RealtimeStatus = "connecting" | "connected" | "disconnected";

interface OrdersRealtimeHandlers {
  onInsert: (order: Order) => void;
  onUpdate: (order: Order) => void;
  onDelete: (id: string) => void;
}

// Suscripción compartida a cambios de `orders` por tenant, con reconexión
// automática: la conexión websocket de Supabase se cae sola con la laptop en
// suspensión, cambios de wifi, o el tab en segundo plano por un buen rato —
// sin esto, el panel se queda "vivo" en pantalla pero deja de recibir pedidos
// nuevos hasta que alguien recarga la página.
export function useOrdersRealtime(
  tenantId: string,
  handlers: OrdersRealtimeHandlers,
) {
  const [status, setStatus] = useState<RealtimeStatus>("connecting");
  const [reconnectKey, setReconnectKey] = useState(0);
  const statusRef = useRef(status);
  statusRef.current = status;
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    setStatus("connecting");
    const supabase = createSupabaseBrowser();
    const uniqueId = Math.random().toString(36).substring(7);
    const channel = supabase
      .channel(`orders-${tenantId}-${uniqueId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => handlersRef.current.onInsert(payload.new as Order),
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => handlersRef.current.onUpdate(payload.new as Order),
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "orders",
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) =>
          handlersRef.current.onDelete((payload.old as { id: string }).id),
      )
      .subscribe((s) => {
        if (s === "SUBSCRIBED") setStatus("connected");
        else if (s === "CHANNEL_ERROR" || s === "TIMED_OUT" || s === "CLOSED") {
          setStatus("disconnected");
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenantId, reconnectKey]);

  // Reintento automático con backoff fijo mientras esté desconectado.
  useEffect(() => {
    if (status !== "disconnected") return;
    const t = setTimeout(() => setReconnectKey((k) => k + 1), 4000);
    return () => clearTimeout(t);
  }, [status]);

  // Reconectar al volver a la pestaña o al recuperar internet — los dos
  // disparadores más comunes de una desconexión silenciosa de websocket.
  useEffect(() => {
    function reconnectIfDown() {
      if (statusRef.current === "disconnected") {
        setReconnectKey((k) => k + 1);
      }
    }
    function handleVisibility() {
      if (!document.hidden) reconnectIfDown();
    }
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("online", reconnectIfDown);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("online", reconnectIfDown);
    };
  }, []);

  return {
    status,
    forceReconnect: () => setReconnectKey((k) => k + 1),
  };
}
