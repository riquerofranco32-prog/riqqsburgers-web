export const WHATSAPP_NUMBER = "542994247985";
export const WHATSAPP_BASE = `https://wa.me/${WHATSAPP_NUMBER}`;
export const WHATSAPP_URL = (msg: string) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;

export function trackLandingEvent(
  event: string,
  props?: Record<string, unknown>,
): void {
  if (typeof window === "undefined") return;
  const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void })
    .gtag;
  if (gtag) {
    gtag("event", event, props ?? {});
  }
}
