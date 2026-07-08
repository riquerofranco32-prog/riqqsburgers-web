import type { Metadata } from "next";
import { getAllPublicOffers } from "@/lib/coupons";
import OffersClient from "./OffersClient";

export const metadata: Metadata = {
  metadataBase: new URL("https://takefyy.com"),
  title: "Ofertas y descuentos en restaurantes | Takefyy",
  description:
    "Encontrá cupones, descuentos y promociones exclusivas en restaurantes, pizzerías y hamburgueserías. Pedí por WhatsApp y ahorrá con Takefyy.",
  keywords: [
    "descuentos restaurantes",
    "cupones restaurantes",
    "ofertas comida",
    "promociones delivery",
    "descuentos pizzería",
    "cupones hamburguesería",
    "Takefyy ofertas",
  ],
  openGraph: {
    title: "Ofertas y descuentos | Takefyy",
    description:
      "Cupones y promociones exclusivas en restaurantes. Ahorrá en tu próximo pedido.",
    url: "https://takefyy.com/ofertas",
    siteName: "Takefyy",
    locale: "es_AR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ofertas y descuentos | Takefyy",
    description:
      "Cupones y promociones exclusivas en restaurantes.",
  },
  robots: { index: true, follow: true },
  alternates: { canonical: "https://takefyy.com/ofertas" },
};

export const dynamic = "force-dynamic";

export default async function OffersPage() {
  const offers = await getAllPublicOffers();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "OfferCatalog",
    name: "Ofertas en Takefyy",
    description: "Cupones y descuentos activos en restaurantes de Takefyy",
    url: "https://takefyy.com/ofertas",
    numberOfItems: offers.length,
    itemListElement: offers.map((o) => ({
      "@type": "Offer",
      name: `${o.discount_type === "percent" ? `${o.discount_value}% OFF` : `$${o.discount_value} OFF`} en ${o.business.name}`,
      description: `Usá el código ${o.code} para obtener descuento en ${o.business.name}`,
      url: `https://takefyy.com/${o.business.slug}`,
      ...(o.discount_type === "fixed"
        ? {
            price: o.discount_value,
            priceCurrency: "ARS",
          }
        : {}),
      eligibleQuantity: {
        "@type": "QuantitativeValue",
        value: 1,
      },
      seller: {
        "@type": "Restaurant",
        name: o.business.name,
        url: `https://takefyy.com/${o.business.slug}`,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <OffersClient offers={offers} />
    </>
  );
}
