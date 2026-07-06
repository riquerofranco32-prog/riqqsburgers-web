import { NextRequest, NextResponse } from "next/server";
import { unstable_noStore as noStore } from "next/cache";
import { createServerClient } from "@/lib/supabase";

// ponytail: no hay rate-limit server-side acá — el cliente debe debouncear
// 600ms y exigir mínimo 4 caracteres antes de llamar este endpoint (así se
// implementa en el picker de dirección del checkout/admin).

interface GeocodeResult {
  label: string;
  lat: number;
  lng: number;
}

function normalize(q: string): string {
  return q
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

async function fetchWithTimeout(url: string, init: RequestInit, ms: number) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(t);
  }
}

interface PhotonFeature {
  geometry: { coordinates: [number, number] };
  properties: {
    name?: string;
    street?: string;
    housenumber?: string;
    city?: string;
  };
}

async function searchPhoton(
  q: string,
  lat: number | null,
  lon: number | null,
): Promise<GeocodeResult[]> {
  const params = new URLSearchParams({ q, limit: "4", lang: "es" });
  if (lat !== null && lon !== null) {
    params.set("lat", String(lat));
    params.set("lon", String(lon));
  }
  const res = await fetchWithTimeout(
    `https://photon.komoot.io/api/?${params.toString()}`,
    {},
    3000,
  );
  if (!res.ok) throw new Error(`Photon ${res.status}`);
  const data = (await res.json()) as { features: PhotonFeature[] };
  return data.features.map((f) => {
    const p = f.properties;
    const parts = [
      [p.street, p.housenumber].filter(Boolean).join(" "),
      p.name,
      p.city,
    ].filter(Boolean);
    return {
      label: parts.join(", ") || q,
      lat: f.geometry.coordinates[1],
      lng: f.geometry.coordinates[0],
    };
  });
}

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}

async function searchNominatim(q: string): Promise<GeocodeResult[]> {
  const params = new URLSearchParams({
    q,
    format: "json",
    limit: "4",
    countrycodes: "ar",
  });
  const res = await fetchWithTimeout(
    `https://nominatim.openstreetmap.org/search?${params.toString()}`,
    { headers: { "User-Agent": "Takefyy/1.0 (contacto: takefyy.com)" } },
    3000,
  );
  if (!res.ok) throw new Error(`Nominatim ${res.status}`);
  const data = (await res.json()) as NominatimResult[];
  return data.map((r) => ({
    label: r.display_name.split(",").slice(0, 3).join(","),
    lat: parseFloat(r.lat),
    lng: parseFloat(r.lon),
  }));
}

export async function GET(req: NextRequest) {
  noStore();

  const slug = req.nextUrl.searchParams.get("slug");
  const q = req.nextUrl.searchParams.get("q");

  if (!slug || !q) {
    return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });
  }

  const normalized = normalize(q);
  if (normalized.length < 4) {
    return NextResponse.json({ results: [] });
  }

  const supabase = createServerClient();
  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, delivery_mode, latitude, longitude, delivery_city_hint")
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();

  if (!tenant || tenant.delivery_mode !== "distance") {
    return NextResponse.json({ error: "No disponible" }, { status: 404 });
  }

  const { data: cached } = await supabase
    .from("geocode_cache")
    .select("results")
    .eq("tenant_id", tenant.id)
    .eq("query_normalized", normalized)
    .maybeSingle();

  if (cached) {
    return NextResponse.json({ results: cached.results as GeocodeResult[] });
  }

  const cityHint = tenant.delivery_city_hint?.trim();
  let results: GeocodeResult[] = [];
  try {
    results = await searchPhoton(
      cityHint ? `${q} ${cityHint}` : q,
      tenant.latitude,
      tenant.longitude,
    );
  } catch {
    results = [];
  }

  if (results.length === 0) {
    try {
      results = await searchNominatim(
        cityHint ? `${q}, ${cityHint}, Argentina` : `${q}, Argentina`,
      );
    } catch {
      results = [];
    }
  }

  if (results.length > 0) {
    await supabase
      .from("geocode_cache")
      .upsert(
        { tenant_id: tenant.id, query_normalized: normalized, results },
        { onConflict: "tenant_id,query_normalized" },
      );
  }

  return NextResponse.json({ results });
}
