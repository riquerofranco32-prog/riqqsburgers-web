declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/** Dispara un evento GA4 via window.gtag. Silencioso si GA4 no está cargado. */
export function trackGA4Event(
  eventName: string,
  params?: Record<string, unknown>,
): void {
  try {
    if (typeof window === "undefined" || !window.gtag) return;
    window.gtag("event", eventName, params ?? {});
  } catch {
    // silencioso — nunca romper la UX por analytics
  }
}

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = sessionStorage.getItem("tak_session");
  if (!id) {
    id = Math.random().toString(36).slice(2);
    sessionStorage.setItem("tak_session", id);
  }
  return id;
}

export async function trackEvent(
  tenantId: string,
  event: string,
  data?: {
    product_id?: string;
    category_id?: string;
    metadata?: Record<string, unknown>;
  },
) {
  try {
    await fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenantId,
        event,
        ...(data ?? {}),
        session_id: getSessionId(),
      }),
    });
  } catch {
    // silencioso — nunca romper la UX por analytics
  }
}
