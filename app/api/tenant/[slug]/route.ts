import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase";
import { assertTenantAdmin } from "@/lib/authz";
import { safeDbError } from "@/lib/db-error";
import { isValidBusinessHours } from "@/lib/businessHours";

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
  "hero_video_url",
  "min_order_amount",
  "business_hours",
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

  const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;
  for (const colorField of [
    "primary_color",
    "secondary_color",
    "background_color",
  ] as const) {
    if (colorField in patch && !HEX_COLOR.test(patch[colorField] as string)) {
      return NextResponse.json(
        { error: `Color inválido: ${colorField}` },
        { status: 400 },
      );
    }
  }

  // Validate URL fields — must be https:// pointing to allowed hosts or empty
  const ALLOWED_URL_HOSTS = [
    /^https:\/\/[a-zA-Z0-9-]+\.supabase\.co\//,
    /^https:\/\/[a-zA-Z0-9.-]+\.supabase\.in\//,
  ];
  const URL_FIELDS = ["logo_url", "banner_url", "hero_video_url"] as const;
  for (const urlField of URL_FIELDS) {
    if (
      urlField in patch &&
      patch[urlField] !== null &&
      patch[urlField] !== ""
    ) {
      const val = patch[urlField] as string;
      if (typeof val !== "string" || val.length > 2048) {
        return NextResponse.json(
          { error: `URL inválida: ${urlField}` },
          { status: 400 },
        );
      }
      const isAllowed = ALLOWED_URL_HOSTS.some((re) => re.test(val));
      if (!isAllowed) {
        return NextResponse.json(
          {
            error: `URL no permitida: ${urlField} debe apuntar al storage de Supabase`,
          },
          { status: 400 },
        );
      }
    }
  }

  // Validate string length fields
  const STRING_LIMITS: Partial<Record<AllowedField, number>> = {
    name: 200,
    tagline: 300,
    address: 300,
    schedule: 500,
    instagram_handle: 100,
    whatsapp_number: 30,
  };
  for (const [field, maxLen] of Object.entries(STRING_LIMITS) as [
    AllowedField,
    number,
  ][]) {
    if (field in patch && patch[field] !== null && patch[field] !== undefined) {
      const val = patch[field] as string;
      if (typeof val !== "string" || val.length > maxLen) {
        return NextResponse.json(
          { error: `${field} inválido (máx. ${maxLen} caracteres)` },
          { status: 400 },
        );
      }
    }
  }

  // Validate min_order_amount — must be null or a non-negative integer
  if ("min_order_amount" in patch) {
    const val = patch["min_order_amount"];
    if (
      val !== null &&
      (typeof val !== "number" || !Number.isFinite(val) || val < 0)
    ) {
      return NextResponse.json(
        {
          error:
            "min_order_amount inválido: debe ser un número positivo o vacío",
        },
        { status: 400 },
      );
    }
  }

  if (
    "business_hours" in patch &&
    patch.business_hours !== null &&
    !isValidBusinessHours(patch.business_hours)
  ) {
    return NextResponse.json({ error: "Horario inválido" }, { status: 400 });
  }

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
    return NextResponse.json({ error: safeDbError(error) }, { status: 500 });
  if (!data)
    return NextResponse.json(
      { error: "Tenant no encontrado" },
      { status: 404 },
    );

  revalidatePath(`/${slug}`, "layout");
  return NextResponse.json({ tenant: data });
}
