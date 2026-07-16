import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { assertTenantAdmin } from "@/lib/authz";
import { safeDbError } from "@/lib/db-error";

const MAX_REPLY = 500;

async function resolveTenantSlug(id: string) {
  const supabase = createServerClient();
  const { data: review } = await supabase
    .from("reviews")
    .select("tenant_id, tenants(slug)")
    .eq("id", id)
    .maybeSingle();
  if (!review) return null;
  const slug = (review.tenants as unknown as { slug: string } | null)?.slug;
  return slug ?? null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await req.json()) as { reply?: string };

  if (!body.reply || !body.reply.trim()) {
    return NextResponse.json(
      { error: "La respuesta no puede estar vacía" },
      { status: 400 },
    );
  }
  if (body.reply.length > MAX_REPLY) {
    return NextResponse.json(
      { error: `Respuesta demasiado larga (máx. ${MAX_REPLY} caracteres)` },
      { status: 400 },
    );
  }

  const slug = await resolveTenantSlug(id);
  if (!slug) {
    return NextResponse.json(
      { error: "Reseña no encontrada" },
      { status: 404 },
    );
  }

  try {
    await assertTenantAdmin(slug);
  } catch (res) {
    if (res instanceof NextResponse) return res;
    throw res;
  }

  const supabase = createServerClient();
  const { error } = await supabase
    .from("reviews")
    .update({ reply: body.reply.trim(), replied_at: new Date().toISOString() })
    .eq("id", id);

  if (error)
    return NextResponse.json({ error: safeDbError(error) }, { status: 500 });

  return NextResponse.json({ ok: true });
}
