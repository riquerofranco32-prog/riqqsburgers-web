import { getRestaurant } from "@/lib/getRestaurant";
import type { MetadataRoute } from "next";

export default async function manifest({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<MetadataRoute.Manifest> {
  const { slug } = await params;
  const restaurant = await getRestaurant(slug);

  const name = restaurant?.name ?? slug;
  const themeColor = restaurant?.primary_color ?? "#FF6B35";

  return {
    name,
    short_name: name,
    description: restaurant?.tagline
      ? restaurant.tagline
      : `Pedí en ${name} por WhatsApp`,
    start_url: `/${slug}`,
    display: "standalone",
    background_color: "#FFFAF7",
    theme_color: themeColor,
    icons: [
      {
        src: restaurant?.logo || "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: restaurant?.logo || "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
