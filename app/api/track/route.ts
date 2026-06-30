import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export const runtime = "edge";

// ponytail: in-memory rate limiter — state resets on every cold start and is NOT shared
// across Edge instances (Vercel runs one per PoP). Effective against burst spam within
// a single instance; does NOT guarantee cross-instance limits.
// Swap to Upstash Ratelimit (@upstash/ratelimit + UPSTASH_REDIS_REST_URL/TOKEN) when
// coordinated rate limiting across Edge instances becomes a real need.
const trackHits = new Map<string, { count: number; resetAt: number }>();
const TRACK_LIMIT = 60;
const TRACK_WINDOW_MS = 60_000;

function getIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = trackHits.get(ip);
  if (!entry || now > entry.resetAt) {
    trackHits.set(ip, { count: 1, resetAt: now + TRACK_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > TRACK_LIMIT;
}

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
  if (isRateLimited(getIp(req))) {
    return NextResponse.json({ ok: true }); // silencioso — no revelar rate limit al cliente
  }

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
