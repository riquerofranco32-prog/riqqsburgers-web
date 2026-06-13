import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export const runtime = "edge";

// Whitelist of analytics events the public catalog is allowed to emit.
// Any other event string is silently ignored to prevent data pollution.
const ALLOWED_EVENTS = new Set([
  "page_view",
  "product_view",
  "category_view",
  "add_to_cart",
  "order_started",
  "order_completed",
]);

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      tenantId?: string;
      event?: string;
      product_id?: string;
      category_id?: string;
      metadata?: Record<string, unknown>;
      session_id?: string;
    };

    if (!body.tenantId || !body.event) {
      return NextResponse.json({ error: "missing fields" }, { status: 400 });
    }

    // Validate tenantId is a valid UUID to prevent arbitrary string injection
    const UUID_RE =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID_RE.test(body.tenantId)) {
      return NextResponse.json({ error: "invalid tenantId" }, { status: 400 });
    }

    // Only allow whitelisted events
    if (!ALLOWED_EVENTS.has(body.event)) {
      // Silently discard unknown events — return ok so client doesn't retry
      return NextResponse.json({ ok: true });
    }

    const supabase = createServerClient();

    // Verify tenant exists before inserting (prevents orphan analytics rows
    // and data pollution across tenants with fabricated IDs)
    const { data: tenant } = await supabase
      .from("tenants")
      .select("id")
      .eq("id", body.tenantId)
      .eq("active", true)
      .maybeSingle();

    if (!tenant) {
      // Return ok to avoid leaking tenant existence info to public clients
      return NextResponse.json({ ok: true });
    }

    await supabase.from("analytics_events").insert({
      tenant_id: body.tenantId,
      event: body.event,
      product_id: body.product_id ?? null,
      category_id: body.category_id ?? null,
      metadata: body.metadata ?? {},
      session_id: body.session_id ?? null,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
