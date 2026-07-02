import { createServerClient } from "@/lib/supabase";

const GRAPH_BASE = "https://graph.instagram.com/v21.0";
const CAROUSEL_BUCKET = "instagram-carousels";

function envOrThrow(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Falta ${name} en .env.local`);
  return value;
}

async function graphPost(path: string, params: Record<string, string>) {
  const url = new URL(`${GRAPH_BASE}/${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), { method: "POST" });
  const json = await res.json();
  if (!res.ok || json.error) {
    throw new Error(json.error?.message ?? `Graph API error (${res.status})`);
  }
  return json;
}

async function waitUntilReady(creationId: string, accessToken: string) {
  // ponytail: fixed poll loop (10 tries / 3s), upgrade to webhooks if publish volume grows
  for (let i = 0; i < 10; i++) {
    const status = await graphPost(
      `${creationId}?fields=status_code&access_token=${accessToken}`,
      {},
    );
    if (status.status_code === "FINISHED") return;
    if (status.status_code === "ERROR")
      throw new Error("Instagram falló al procesar el contenedor");
    await new Promise((r) => setTimeout(r, 3000));
  }
  throw new Error("Timeout esperando que Instagram procese las imágenes");
}

// Sube imágenes locales al bucket público de Supabase y devuelve sus URLs
// públicas, listas para pasarle a publishCarousel (Instagram solo acepta URLs).
export async function uploadCarouselImages(files: File[]): Promise<string[]> {
  const supabase = createServerClient();
  const stamp = Date.now();

  return Promise.all(
    files.map(async (file, i) => {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
      const path = `${stamp}/slide-${i + 1}.${ext}`;
      const buffer = Buffer.from(await file.arrayBuffer());

      const { error } = await supabase.storage
        .from(CAROUSEL_BUCKET)
        .upload(path, buffer, { contentType: file.type, upsert: true });
      if (error)
        throw new Error(`Error al subir ${file.name}: ${error.message}`);

      const {
        data: { publicUrl },
      } = supabase.storage.from(CAROUSEL_BUCKET).getPublicUrl(path);
      return publicUrl;
    }),
  );
}

export async function publishStory(imageUrl: string) {
  const igId = envOrThrow("IG_BUSINESS_ID");
  const accessToken = envOrThrow("IG_ACCESS_TOKEN");

  const container = await graphPost(`${igId}/media`, {
    image_url: imageUrl,
    media_type: "STORIES",
    access_token: accessToken,
  });

  await waitUntilReady(container.id, accessToken);

  const published = await graphPost(`${igId}/media_publish`, {
    creation_id: container.id,
    access_token: accessToken,
  });

  return published.id as string;
}

export async function publishCarousel(imageUrls: string[], caption: string) {
  if (imageUrls.length < 2 || imageUrls.length > 10) {
    throw new Error("Un carrusel necesita entre 2 y 10 imágenes");
  }

  const igId = envOrThrow("IG_BUSINESS_ID");
  const accessToken = envOrThrow("IG_ACCESS_TOKEN");

  const childIds = await Promise.all(
    imageUrls.map(async (image_url) => {
      const item = await graphPost(`${igId}/media`, {
        image_url,
        is_carousel_item: "true",
        access_token: accessToken,
      });
      return item.id as string;
    }),
  );

  const container = await graphPost(`${igId}/media`, {
    media_type: "CAROUSEL",
    children: childIds.join(","),
    caption,
    access_token: accessToken,
  });

  await waitUntilReady(container.id, accessToken);

  const published = await graphPost(`${igId}/media_publish`, {
    creation_id: container.id,
    access_token: accessToken,
  });

  return published.id as string;
}
