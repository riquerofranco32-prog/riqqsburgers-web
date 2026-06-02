import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase";
import { assertTenantAdmin } from "@/lib/authz";

export async function PATCH(req: NextRequest) {
  const body = (await req.json()) as { slug?: string; order?: string[] };

  if (!body.slug || !Array.isArray(body.order)) {
    return NextResponse.json(
      { error: "Faltan campos requeridos" },
      { status: 400 },
    );
  }

  if (body.order.length > 100) {
    return NextResponse.json(
      { error: "Demasiadas categorías en el reordenamiento" },
      { status: 400 },
    );
  }

  let tenantId: string;
  try {
    const result = await assertTenantAdmin(body.slug);
    tenantId = result.tenantId;
  } catch (res) {
    if (res instanceof NextResponse) return res;
    throw res;
  }

  const supabase = createServerClient();

  // sort_order según la posición en el array. Cada update queda acotado al
  // tenant para evitar escrituras cruzadas entre restaurantes.
  const results = await Promise.all(
    body.order.map((id, index) =>
      supabase
        .from("categories")
        .update({ sort_order: index })
        .eq("id", id)
        .eq("tenant_id", tenantId),
    ),
  );

  const failed = results.find((r) => r.error);
  if (failed?.error) {
    console.error("[categories/order] update error:", failed.error);
    return NextResponse.json(
      { error: "Error al guardar el orden" },
      { status: 500 },
    );
  }

  revalidatePath(`/${body.slug}`, "layout");
  return NextResponse.json({ ok: true });
}
