import type { Metadata } from "next";
import { getAllTenants } from "@/lib/tenants";
import HomeClient from "./components/HomeClient";

export const metadata: Metadata = {
  metadataBase: new URL("https://takefyy.com"),
  title: "Takefyy — Menú digital para restaurantes | Pedidos por WhatsApp",
  description:
    "Creá el menú digital de tu restaurante y empezá a recibir pedidos por WhatsApp sin apps, sin comisiones. Panel admin incluido. Empezá gratis.",
  keywords: [
    "menú digital restaurante",
    "carta online argentina",
    "pedidos whatsapp",
    "sistema pedidos restaurante",
    "menu digital gratis",
    "carta digital whatsapp",
  ],
  openGraph: {
    title: "Takefyy — Tu carta, online en minutos",
    description:
      "Menú digital para restaurantes. Pedidos por WhatsApp. Sin apps, sin comisiones. Empezá gratis.",
    url: "https://takefyy.com",
    siteName: "Takefyy",
    locale: "es_AR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Takefyy — Tu carta, online en minutos",
    description:
      "Menú digital para restaurantes. Pedidos por WhatsApp. Sin apps, sin comisiones.",
  },
  robots: { index: true, follow: true },
  alternates: { canonical: "https://takefyy.com" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://takefyy.com/#organization",
      name: "Takefyy",
      url: "https://takefyy.com",
      description:
        "Plataforma de menús digitales para restaurantes con pedidos por WhatsApp.",
      foundingLocation: { "@type": "Place", name: "Argentina" },
      contactPoint: {
        "@type": "ContactPoint",
        email: "hola@takefyy.com",
        contactType: "customer service",
        availableLanguage: "Spanish",
      },
    },
    {
      "@type": "SoftwareApplication",
      name: "Takefyy",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description:
        "Menú digital para restaurantes con pedidos por WhatsApp, panel admin y URL propia.",
      offers: [
        {
          "@type": "Offer",
          name: "Starter",
          price: "0",
          priceCurrency: "ARS",
          billingDuration: "P1M",
        },
        {
          "@type": "Offer",
          name: "Pro",
          price: "17000",
          priceCurrency: "ARS",
          billingDuration: "P1M",
        },
        {
          "@type": "Offer",
          name: "Growth",
          price: "27000",
          priceCurrency: "ARS",
          billingDuration: "P1M",
        },
      ],
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "¿Necesito saber programar para usar Takefyy?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "No. El panel es intuitivo y cualquier persona puede armarlo en minutos.",
          },
        },
        {
          "@type": "Question",
          name: "¿Cómo llegan los pedidos?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Directo a tu WhatsApp. El cliente arma su pedido y te manda un mensaje con todos los detalles.",
          },
        },
        {
          "@type": "Question",
          name: "¿Hay comisión por pedido?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "No. Pagás la suscripción mensual y listo. Sin sorpresas, sin porcentajes por cada venta.",
          },
        },
      ],
    },
  ],
};

export default async function HomePage() {
  const tenants = await getAllTenants();
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomeClient restaurantCount={tenants.length} />
    </>
  );
}
