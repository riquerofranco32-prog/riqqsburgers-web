import { Suspense } from "react";
import { getRestaurant } from "@/lib/getRestaurant";
import { createServerClient } from "@/lib/supabase";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import CatalogClient, { type PublicCoupon } from "./CatalogClient";
import type { BusinessHours } from "@/lib/businessHours";

const MAX_MENU_COUPONS = 3;
const MAX_SCHEMA_REVIEWS = 5;

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

// Convierte business_hours (array de 7 días, dom=0..sáb=6) al formato
// openingHoursSpecification de schema.org. Ignora slot2 por simplicidad
// (ponytail: cubre el caso común de un solo turno; sumar slot2 si algún
// tenant con dos franjas necesita el dato reflejado en el schema).
function toOpeningHoursSpecification(hours: BusinessHours | null) {
  if (!hours) return undefined;
  const specs = hours
    .map((day, i) =>
      !day.closed && day.open && day.close
        ? {
            "@type": "OpeningHoursSpecification",
            dayOfWeek: `https://schema.org/${DAY_NAMES[i]}`,
            opens: day.open,
            closes: day.close,
          }
        : null,
    )
    .filter((s): s is NonNullable<typeof s> => s !== null);
  return specs.length > 0 ? specs : undefined;
}

async function getSchemaReviews(tenantId: string) {
  try {
    const db = createServerClient();
    const { data } = await db
      .from("reviews")
      .select("rating, comment, customer_name, created_at")
      .eq("tenant_id", tenantId)
      .not("comment", "is", null)
      .order("rating", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(MAX_SCHEMA_REVIEWS);
    return data ?? [];
  } catch {
    return [];
  }
}

async function getPublicCoupons(tenantId: string): Promise<PublicCoupon[]> {
  try {
    const db = createServerClient();
    const { data } = await db
      .from("coupons")
      .select(
        "code, discount_type, discount_value, min_order_amount, max_uses, uses, expires_at",
      )
      .eq("tenant_id", tenantId)
      .eq("active", true)
      .eq("show_in_menu", true)
      .order("created_at", { ascending: false });
    return (data ?? [])
      .filter(
        (c) =>
          (c.max_uses === null || c.uses < c.max_uses) &&
          (!c.expires_at || new Date(c.expires_at) > new Date()),
      )
      .slice(0, MAX_MENU_COUPONS)
      .map((c) => ({
        code: c.code,
        discount_type: c.discount_type,
        discount_value: c.discount_value,
        min_order_amount: c.min_order_amount,
      }));
  } catch {
    return [];
  }
}

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
  const image = restaurant.logo || restaurant.banner_url || undefined;
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

  const [coupons, schemaReviews] = await Promise.all([
    getPublicCoupons(restaurant.id),
    getSchemaReviews(restaurant.id),
  ]);

  const schemaOrg = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: restaurant.name,
    description:
      restaurant.tagline ||
      `Mirá el menú de ${restaurant.name} y pedí por WhatsApp.`,
    url: `https://takefyy.com/${restaurant.slug}`,
    image: restaurant.logo || restaurant.banner_url || undefined,
    telephone: restaurant.phone || undefined,
    address: restaurant.address
      ? {
          "@type": "PostalAddress",
          streetAddress: restaurant.address,
          addressCountry: "AR",
        }
      : undefined,
    geo:
      restaurant.latitude != null && restaurant.longitude != null
        ? {
            "@type": "GeoCoordinates",
            latitude: restaurant.latitude,
            longitude: restaurant.longitude,
          }
        : undefined,
    openingHoursSpecification: toOpeningHoursSpecification(
      restaurant.business_hours,
    ),
    aggregateRating: restaurant.rating
      ? {
          "@type": "AggregateRating",
          ratingValue: restaurant.rating.avg,
          reviewCount: restaurant.rating.count,
        }
      : undefined,
    review:
      schemaReviews.length > 0
        ? schemaReviews.map((r) => ({
            "@type": "Review",
            author: { "@type": "Person", name: r.customer_name || "Cliente" },
            datePublished: r.created_at,
            reviewBody: r.comment,
            reviewRating: {
              "@type": "Rating",
              ratingValue: r.rating,
              bestRating: 5,
              worstRating: 1,
            },
          }))
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
        <CatalogClient restaurant={restaurant} coupons={coupons} />
      </Suspense>
    </>
  );
}
