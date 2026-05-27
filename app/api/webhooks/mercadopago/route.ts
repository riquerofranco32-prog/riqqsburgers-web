/**
 * Webhook stub de MercadoPago — Fase 6
 *
 * Variables de entorno requeridas:
 *   MP_ACCESS_TOKEN   — access token de la app MP (para llamadas salientes, no usado aquí)
 *   MP_WEBHOOK_SECRET — secret para verificar la firma HMAC-SHA256 del webhook
 *
 * Referencia de firma:
 *   Header: x-signature → "ts=<timestamp>,v1=<hash>"
 *   Hash   : HMAC-SHA256(MP_WEBHOOK_SECRET, "id:<event_id>;request-date:<ts>;")
 */

import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

interface MercadoPagoWebhookBody {
  id: string | number;
  type: string;
  date_created?: string;
  action?: string;
  data?: unknown;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Parsea el header x-signature y devuelve { ts, v1 }.
 * Formato esperado: "ts=<timestamp>,v1=<hash>"
 */
function parseSignatureHeader(
  header: string,
): { ts: string; v1: string } | null {
  const parts = Object.fromEntries(
    header.split(",").map((part) => {
      const idx = part.indexOf("=");
      return [part.slice(0, idx).trim(), part.slice(idx + 1).trim()];
    }),
  );

  if (typeof parts["ts"] !== "string" || typeof parts["v1"] !== "string") {
    return null;
  }

  return { ts: parts["ts"], v1: parts["v1"] };
}

/**
 * Verifica la firma HMAC-SHA256 contra el secret.
 * Usa timingSafeEqual para evitar timing attacks.
 */
function verifySignature(
  secret: string,
  eventId: string,
  ts: string,
  receivedHash: string,
): boolean {
  const payload = `id:${eventId};request-date:${ts};`;
  const expected = createHmac("sha256", secret).update(payload).digest("hex");

  try {
    return timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(receivedHash, "hex"),
    );
  } catch {
    // timingSafeEqual lanza si los buffers tienen distinto tamaño
    return false;
  }
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest): Promise<NextResponse> {
  // 1. Leer headers
  const signatureHeader = request.headers.get("x-signature");
  const requestId = request.headers.get("x-request-id") ?? "unknown";

  // 2. Parsear body
  let body: MercadoPagoWebhookBody;
  try {
    body = (await request.json()) as MercadoPagoWebhookBody;
  } catch {
    console.error("[mp-webhook] Body inválido — no es JSON");
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const eventId = String(body.id ?? "");

  // 3. Verificar firma
  const secret = process.env.MP_WEBHOOK_SECRET;

  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 },
      );
    }
    console.warn(
      "[mp-webhook] MP_WEBHOOK_SECRET no configurado — omitiendo verificación de firma (dev mode)",
    );
  } else {
    if (!signatureHeader) {
      console.warn(
        `[mp-webhook] Header x-signature ausente — requestId=${requestId}`,
      );
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }

    const parsed = parseSignatureHeader(signatureHeader);
    if (!parsed) {
      console.warn(
        `[mp-webhook] Header x-signature con formato inválido — requestId=${requestId}`,
      );
      return NextResponse.json(
        { error: "Invalid signature format" },
        { status: 401 },
      );
    }

    const valid = verifySignature(secret, eventId, parsed.ts, parsed.v1);
    if (!valid) {
      console.warn(
        `[mp-webhook] Firma inválida — eventId=${eventId} requestId=${requestId}`,
      );
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  // 4. Loguear evento recibido
  console.log(
    `[mp-webhook] Evento recibido — type=${body.type} id=${eventId} action=${body.action ?? "-"} requestId=${requestId} date=${body.date_created ?? "-"}`,
  );

  // 5. Dispatch por tipo de evento
  switch (body.type) {
    case "subscription_authorized_payment":
      // TODO Fase 7: actualizar estado de pago de suscripción en Supabase
      console.log(
        `[mp-webhook] subscription_authorized_payment — id=${eventId} (pendiente implementación)`,
      );
      break;

    case "subscription_preapproval":
      // TODO Fase 7: activar o cancelar plan del tenant en Supabase
      console.log(
        `[mp-webhook] subscription_preapproval — id=${eventId} (pendiente implementación)`,
      );
      break;

    default:
      console.log(
        `[mp-webhook] Tipo de evento desconocido — type=${body.type} id=${eventId}`,
      );
      break;
  }

  // 6. Responder 200 para que MP no reintente
  return NextResponse.json({ received: true }, { status: 200 });
}
