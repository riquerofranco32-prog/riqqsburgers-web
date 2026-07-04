import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { SLUG_RE } from "@/lib/validation";

export const dynamic = "force-dynamic";

// GET /api/signup/check-slug?slug=mi-local — público, sin auth.
// Solo devuelve un booleano; no expone datos del tenant.
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug")?.trim().toLowerCase() ?? "";

  if (!slug || !SLUG_RE.test(slug)) {
    return NextResponse.json({ available: false, valid: false });
  }

  const db = createServerClient();
  const { data, error } = await db
    .from("tenants")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ available: false, valid: true });
  }

  return NextResponse.json({ available: !data, valid: true });
}
