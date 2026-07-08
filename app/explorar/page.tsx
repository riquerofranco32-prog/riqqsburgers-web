import type { Metadata } from "next";
import { getAllActiveTenantsWithPreview } from "@/lib/tenants";
import ExploreClient from "./ExploreClient";

export const metadata: Metadata = {
  metadataBase: new URL("https://takefyy.com"),
  title: "Explorá restaurantes | Takefyy — Menús digitales y descuentos",
  description:
    "Descubrí restaurantes, hamburgueserías, pizzerías y más. Mirá sus menús digitales, encontrá descuentos y pedí directo por WhatsApp en Takefyy.",
  keywords: [
    "restaurantes cerca",
    "menú digital",
    "descuentos restaurantes",
    "pizzerías",
    "hamburgueserías",
    "pedidos whatsapp",
    "carta digital",
    "Takefyy",
  ],
  openGraph: {
    title: "Explorá restaurantes en Takefyy",
    description:
      "Descubrí negocios gastronómicos, mirá sus menús y aprovechá descuentos exclusivos.",
    url: "https://takefyy.com/explorar",
    siteName: "Takefyy",
    locale: "es_AR",
    type: "website",
    images: [
      {
        url: "/explorar/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Explorá restaurantes en Takefyy",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Explorá restaurantes en Takefyy",
    description:
      "Descubrí negocios, mirá menús y encontrá descuentos. Pedí por WhatsApp.",
    images: ["/explorar/opengraph-image"],
  },
  robots: { index: true, follow: true },
  alternates: { canonical: "https://takefyy.com/explorar" },
};

export const dynamic = "force-dynamic";

export default async function ExplorePage() {
  const tenants = await getAllActiveTenantsWithPreview();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Restaurantes en Takefyy",
    description:
      "Directorio de restaurantes con menú digital y pedidos por WhatsApp",
    url: "https://takefyy.com/explorar",
    numberOfItems: tenants.length,
    itemListElement: tenants.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Restaurant",
        name: t.name,
        url: `https://takefyy.com/${t.slug}`,
        image: t.logo_url || undefined,
        address: t.address
          ? {
              "@type": "PostalAddress",
              streetAddress: t.address,
              addressCountry: "AR",
            }
          : undefined,
        ...(t.rating
          ? {
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: t.rating.avg.toFixed(1),
                reviewCount: t.rating.count,
                bestRating: 5,
              },
            }
          : {}),
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ExploreClient tenants={tenants} />
    </>
  );
}
