export function buildWhatsAppLink(
  phone: string | null | undefined,
  orderRef: string,
  status: string,
  baseUrl?: string,
): string | null {
  if (!phone || !orderRef) return null;
  const normalized = phone.replace(/\D/g, "");
  const intl = normalized.startsWith("549")
    ? normalized
    : normalized.startsWith("54")
      ? normalized
      : `549${normalized}`;
  const trackUrl = baseUrl ? `${baseUrl}/pedido/${orderRef}` : null;
  const messages: Record<string, string> = {
    pending: `👋 Hola! Recibimos tu pedido *#${orderRef}*. En breve te confirmamos.`,
    confirmed: `✅ Hola! Tu pedido *#${orderRef}* fue confirmado. ¡Ya lo estamos preparando!`,
    preparing: `👨‍🍳 Tu pedido *#${orderRef}* está en preparación. Avisamos cuando esté listo.`,
    ready: trackUrl
      ? `🎉 ¡Tu pedido *#${orderRef}* está LISTO! Seguí el estado acá: ${trackUrl}`
      : `🎉 ¡Tu pedido *#${orderRef}* está LISTO! Podés pasar a retirarlo.`,
    delivered: `📦 Tu pedido *#${orderRef}* fue entregado. ¡Gracias!`,
  };
  const text = messages[status];
  if (!text) return null;
  return `https://wa.me/${intl}?text=${encodeURIComponent(text)}`;
}
