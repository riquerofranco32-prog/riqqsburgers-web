import { NextRequest, NextResponse } from "next/server";
import { unstable_noStore as noStore } from "next/cache";
import { createServerClient } from "@/lib/supabase";
import { resolveZoneByLocation, resolveDistancePrice } from "@/lib/delivery";

interface QuoteBody {
  slug: string;
  lat?: number;
  lng?: number;
}

export async function POST(req: NextRequest) {
  noStore();

  let body: QuoteBody;
  try {
    body = (await req.json()) as QuoteBody;
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  if (!body.slug) {
    return NextResponse.json({ error: "Falta slug" }, { status: 400 });
  }

  const supabase = createServerClient();
  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, delivery_mode, latitude, longitude, delivery_out_of_range_msg")
    .eq("slug", body.slug)
    .eq("active", true)
    .maybeSingle();

  if (!tenant) {
    return NextResponse.json(
      { error: "Restaurante no encontrado" },
      { status: 404 },
    );
  }

  if (tenant.delivery_mode === "zones") {
    if (typeof body.lat !== "number" || typeof body.lng !== "number") {
      return NextResponse.json(
        { error: "Faltan coordenadas" },
        { status: 400 },
      );
    }
    const { data: zones } = await supabase
      .from("delivery_zones")
      .select("id, name, price, lat, lng, radius_km")
      .eq("tenant_id", tenant.id)
      .eq("active", true);

    const result = resolveZoneByLocation(
      zones ?? [],
      body.lat,
      body.lng,
      tenant.delivery_out_of_range_msg,
    );
    return NextResponse.json(result);
  }

  if (tenant.delivery_mode === "distance") {
    if (typeof body.lat !== "number" || typeof body.lng !== "number") {
      return NextResponse.json(
        { error: "Faltan coordenadas" },
        { status: 400 },
      );
    }
    if (tenant.latitude === null || tenant.longitude === null) {
      return NextResponse.json(
        { error: "El restaurante no configuró su ubicación" },
        { status: 400 },
      );
    }
    const { data: ranges } = await supabase
      .from("delivery_ranges")
      .select("max_km, price")
      .eq("tenant_id", tenant.id)
      .eq("active", true);

    const result = resolveDistancePrice(
      ranges ?? [],
      tenant.latitude,
      tenant.longitude,
      body.lat,
      body.lng,
      tenant.delivery_out_of_range_msg,
    );
    return NextResponse.json(result);
  }

  return NextResponse.json(
    { error: "Este restaurante no ofrece delivery" },
    { status: 400 },
  );
}
