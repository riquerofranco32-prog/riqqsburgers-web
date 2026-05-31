import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase";
import { assertTenantAdmin } from "@/lib/authz";

const ALLOWED_FIELDS = [
  "name",
  "tagline",
  "logo_url",
  "banner_url",
  "primary_color",
  "secondary_color",
  "background_color",
  "instagram_handle",
  "address",
  "schedule",
  "whatsapp_number",
  "delivery_cost",
  "is_open",
] as const;

type AllowedField = (typeof ALLOWED_FIELDS)[number];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  try {
    await assertTenantAdmin(slug);
  } catch (res) {
    if (res instanceof NextResponse) return res;
    throw res;
  }

  const body = (await req.json()) as Record<string, unknown>;

  const patch = Object.fromEntries(
    ALLOWED_FIELDS.filter((f: AllowedField) => f in body).map((f) => [
      f,
      body[f],
    ]),
  );

  if (Object.keys(patch).length === 0) {
    return NextResponse.json(
      { error: "Sin campos válidos para actualizar" },
      { status: 400 },
    );
  }

  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("tenants")
    .update(patch)
    .eq("slug", slug)
    .select()
    .maybeSingle();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data)
    return NextResponse.json(
      { error: "Tenant no encontrado" },
      { status: 404 },
    );

  revalidatePath(`/${slug}`, "layout");
  return NextResponse.json({ tenant: data });
}
