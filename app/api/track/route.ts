import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export const runtime = "edge";

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

    const supabase = createServerClient();
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
