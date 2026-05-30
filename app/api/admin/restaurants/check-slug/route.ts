import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { assertSuperAdmin } from "@/lib/authz";

export const dynamic = "force-dynamic";

// GET /api/admin/restaurants/check-slug?slug=mi-local
// Devuelve { available: boolean } para validación en tiempo real del form.
export async function GET(req: NextRequest) {
  try {
    await assertSuperAdmin();
  } catch (e) {
    return e as NextResponse;
  }

  const slug = req.nextUrl.searchParams.get("slug")?.trim().toLowerCase() ?? "";

  if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json({ available: false, valid: false });
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("tenants")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ available: !data, valid: true });
}
