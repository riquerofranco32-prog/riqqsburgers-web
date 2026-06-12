/**
 * Webhook de MercadoPago — maneja suscripciones de planes Takefyy.
 *
 * Variables de entorno requeridas:
 *   MP_ACCESS_TOKEN   — access token de la app MP
 *   MP_WEBHOOK_SECRET — secret para verificar la firma HMAC-SHA256
 *
 * Referencia de firma:
 *   Header: x-signature → "ts=<timestamp>,v1=<hash>"
 *   Hash   : HMAC-SHA256(MP_WEBHOOK_SECRET, "id:<event_id>;request-date:<ts>;")
 */

import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

interface MercadoPagoWebhookBody {
  id: string | number;
  type: string;
  date_created?: string;
  action?: string;
  data?: { id?: string | number };
}

interface MPPreapproval {
  id: string;
  status: "authorized" | "paused" | "cancelled" | "pending";
  payer_id: number;
  reason: string;
  external_reference: string | null;
  date_created: string;
  last_modified: string;
  next_payment_date?: string;
  summarized?: { charged_amount?: number };
}

interface MPAuthorizedPayment {
  id: string;
  status: "authorized" | "cancelled";
  preapproval_id: string;
  transaction_amount: number;
  currency_id: string;
  date_created: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
    return false;
  }
}

function mpStatusToPlan(status: MPPreapproval["status"]): string {
  switch (status) {
    case "authorized":
      return "pro";
    case "paused":
    case "cancelled":
      return "free";
    default:
      return "free";
  }
}

function mpStatusToSubscriptionStatus(status: MPPreapproval["status"]): string {
  switch (status) {
    case "authorized":
      return "active";
    case "paused":
      return "paused";
    case "cancelled":
      return "cancelled";
    default:
      return "pending";
  }
}

// ---------------------------------------------------------------------------
// Handlers de eventos
// ---------------------------------------------------------------------------

async function handlePreapproval(resourceId: string): Promise<void> {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) {
    console.error("[mp-webhook] MP_ACCESS_TOKEN no configurado");
    return;
  }

  // Buscar la preaprobación en MP
  const res = await fetch(
    `https://api.mercadopago.com/preapproval/${resourceId}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) {
    console.error(
      `[mp-webhook] Error al obtener preapproval ${resourceId}: ${res.status}`,
    );
    return;
  }
  const preapproval = (await res.json()) as MPPreapproval;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // Buscar la suscripción por mp_preapproval_id
  const { data: existing } = await supabase
    .from("subscriptions")
    .select("id, tenant_id")
    .eq("mp_preapproval_id", resourceId)
    .single();

  const newPlan = mpStatusToPlan(preapproval.status);
  const newStatus = mpStatusToSubscriptionStatus(preapproval.status);
  const periodEnd = preapproval.next_payment_date ?? null;

  if (existing) {
    // Actualizar suscripción existente
    await supabase
      .from("subscriptions")
      .update({
        status: newStatus,
        plan: newPlan,
        current_period_end: periodEnd,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);

    // Actualizar plan del tenant
    await supabase
      .from("tenants")
      .update({ plan: newPlan })
      .eq("id", existing.tenant_id);

    console.log(
      `[mp-webhook] Suscripción ${existing.id} actualizada → status=${newStatus} plan=${newPlan}`,
    );
  } else if (preapproval.external_reference) {
    // external_reference = tenant_id
    const tenantId = preapproval.external_reference;
    await supabase.from("subscriptions").upsert(
      {
        tenant_id: tenantId,
        plan: newPlan,
        status: newStatus,
        current_period_end: periodEnd,
        mp_preapproval_id: resourceId,
        mp_payer_id: String(preapproval.payer_id),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "tenant_id" },
    );

    await supabase.from("tenants").update({ plan: newPlan }).eq("id", tenantId);

    console.log(
      `[mp-webhook] Suscripción creada para tenant ${tenantId} → plan=${newPlan}`,
    );
  } else {
    console.warn(
      `[mp-webhook] Preapproval ${resourceId} sin external_reference — no se puede asociar al tenant`,
    );
  }
}

async function handleAuthorizedPayment(resourceId: string): Promise<void> {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) {
    console.error("[mp-webhook] MP_ACCESS_TOKEN no configurado");
    return;
  }

  const res = await fetch(
    `https://api.mercadopago.com/authorized_payments/${resourceId}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) {
    console.error(
      `[mp-webhook] Error al obtener authorized_payment ${resourceId}: ${res.status}`,
    );
    return;
  }
  const payment = (await res.json()) as MPAuthorizedPayment;

  // Si el pago fue autorizado, asegurarse de que la suscripción esté activa
  if (payment.status === "authorized" && payment.preapproval_id) {
    await handlePreapproval(payment.preapproval_id);
  }

  console.log(
    `[mp-webhook] authorized_payment ${resourceId} procesado — status=${payment.status}`,
  );
}

// ---------------------------------------------------------------------------
// Handler principal
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest): Promise<NextResponse> {
  const signatureHeader = request.headers.get("x-signature");
  const requestId = request.headers.get("x-request-id") ?? "unknown";

  let body: MercadoPagoWebhookBody;
  try {
    body = (await request.json()) as MercadoPagoWebhookBody;
  } catch {
    console.error("[mp-webhook] Body inválido — no es JSON");
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const eventId = String(body.id ?? "");

  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 },
      );
    }
    console.warn(
      "[mp-webhook] MP_WEBHOOK_SECRET no configurado — omitiendo verificación (dev)",
    );
  } else {
    if (!signatureHeader) {
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }
    const parsed = parseSignatureHeader(signatureHeader);
    if (!parsed) {
      return NextResponse.json(
        { error: "Invalid signature format" },
        { status: 401 },
      );
    }
    if (!verifySignature(secret, eventId, parsed.ts, parsed.v1)) {
      console.warn(`[mp-webhook] Firma inválida — requestId=${requestId}`);
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  console.log(
    `[mp-webhook] Evento — type=${body.type} action=${body.action ?? "-"} id=${eventId}`,
  );

  const resourceId = String(body.data?.id ?? "");

  switch (body.type) {
    case "subscription_preapproval":
      if (resourceId) await handlePreapproval(resourceId);
      break;

    case "subscription_authorized_payment":
      if (resourceId) await handleAuthorizedPayment(resourceId);
      break;

    default:
      console.log(`[mp-webhook] Tipo desconocido — type=${body.type}`);
      break;
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
