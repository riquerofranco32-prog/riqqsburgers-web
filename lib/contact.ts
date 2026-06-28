export const WHATSAPP_NUMBER = "542994247985";
export const WHATSAPP_BASE = `https://wa.me/${WHATSAPP_NUMBER}`;
export const WHATSAPP_URL = (msg: string) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;

export function trackLandingEvent(
  event: string,
  props?: Record<string, unknown>,
): void {
  if (typeof window === "undefined") return;
  // eslint-disable-next-line no-console
  console.log("[takefyy:landing]", event, props ?? {});
  // TODO: connect GA4 or PostHog via NEXT_PUBLIC_GA_MEASUREMENT_ID
}
