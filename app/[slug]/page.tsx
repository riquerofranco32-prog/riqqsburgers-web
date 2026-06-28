import { Suspense } from "react";
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

  const schemaOrg = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: restaurant.name,
    description:
      restaurant.tagline ||
      `Mirá el menú de ${restaurant.name} y pedí por WhatsApp.`,
    url: `https://takefyy.com/${restaurant.slug}`,
    image: restaurant.banner_url || restaurant.logo || undefined,
    telephone: restaurant.phone || undefined,
    address: restaurant.address
      ? {
          "@type": "PostalAddress",
          streetAddress: restaurant.address,
          addressCountry: "AR",
        }
      : undefined,
    servesCuisine: restaurant.menu.categories
      .map((c) => c.name)
      .slice(0, 5)
      .join(", "),
    hasMenu: {
      "@type": "Menu",
      hasMenuSection: restaurant.menu.categories.map((cat) => ({
        "@type": "MenuSection",
        name: cat.name,
        hasMenuItem: cat.items.slice(0, 10).map((item) => ({
          "@type": "MenuItem",
          name: item.name,
          description: item.description || undefined,
          offers: {
            "@type": "Offer",
            price: item.price,
            priceCurrency: "ARS",
            availability:
              item.badge === "Agotado"
                ? "https://schema.org/OutOfStock"
                : "https://schema.org/InStock",
          },
        })),
      })),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrg) }}
      />
      <Suspense fallback={null}>
        <CatalogClient restaurant={restaurant} />
      </Suspense>
    </>
  );
}
