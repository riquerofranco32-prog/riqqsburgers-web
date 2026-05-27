import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { getAllTenants } from "@/lib/tenants";
import { assertSuperAdmin } from "@/lib/authz";

export async function GET(req: NextRequest) {
  try {
    await assertSuperAdmin();
  } catch (e) {
    return e as NextResponse;
  }
  const tenants = await getAllTenants();
  return NextResponse.json(tenants);
}

export async function POST(req: NextRequest) {
  try {
    await assertSuperAdmin();
  } catch (e) {
    return e as NextResponse;
  }

  const body = (await req.json()) as {
    slug: string;
    name: string;
    tagline?: string;
    whatsapp_number: string;
    instagram?: string;
    logo_url?: string;
    accent_color?: string;
    address?: string;
    schedule?: string;
    is_open?: boolean;
  };

  if (!body.slug || !body.name || !body.whatsapp_number) {
    return NextResponse.json(
      { error: "Faltan campos requeridos" },
      { status: 400 },
    );
  }

  if (!/^[a-z0-9-]+$/.test(body.slug)) {
    return NextResponse.json(
      { error: "Slug inválido (solo letras minúsculas, números y guiones)" },
      { status: 400 },
    );
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("tenants")
    .insert({
      slug: body.slug,
      name: body.name,
      tagline: body.tagline || null,
      whatsapp_number: body.whatsapp_number,
      instagram_handle: body.instagram || null,
      logo_url: body.logo_url || null,
      primary_color: body.accent_color || "#FF6B35",
      secondary_color: "#FFB347",
      background_color: "#FFFAF7",
      delivery_cost: 0,
      address: body.address || null,
      schedule: body.schedule || null,
      is_open: body.is_open ?? true,
      active: true,
    })
    .select("id, slug, name")
    .single();

  if (error) {
    const msg =
      error.code === "23505"
        ? "Ya existe un restaurante con ese slug"
        : error.message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  return NextResponse.json(data, { status: 201 });
}
