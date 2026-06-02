import { getRestaurant } from "@/lib/getRestaurant";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import CatalogClient from "./CatalogClient";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const restaurant = await getRestaurant(slug);
  if (!restaurant) return { title: "No encontrado — Takefyy" };

  const title = `${restaurant.name} — Takefyy`;
  const description =
    restaurant.tagline ||
    `Mirá el menú de ${restaurant.name} y pedí por WhatsApp.`;
  const image = restaurant.banner_url || restaurant.logo || undefined;
  const url = `https://takefyy.com/${restaurant.slug}`;

  return {
    metadataBase: new URL("https://takefyy.com"),
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: "Takefyy",
      locale: "es_AR",
      type: "website",
      images: image ? [{ url: image, alt: restaurant.name }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function RestaurantPage({ params }: Props) {
  const { slug } = await params;
  const restaurant = await getRestaurant(slug);
  if (!restaurant) notFound();
  return <CatalogClient restaurant={restaurant} />;
}
