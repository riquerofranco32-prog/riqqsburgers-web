import type { Metadata } from "next";
import { createServerClient } from "@/lib/supabase";
import HomeClient from "./components/HomeClient";

export const metadata: Metadata = {
  metadataBase: new URL("https://takefyy.com"),
  title: "Takefyy — Menú digital para restaurantes | Pedidos por WhatsApp",
  description:
    "Creá el menú digital de tu restaurante en minutos y recibí pedidos directo por WhatsApp. Sin comisiones, sin apps, sin costos en dólares. Gratis para empezar. Hecho en Argentina.",
  keywords: [
    "menú digital restaurante Argentina",
    "carta digital restaurante gratis",
    "pedidos por whatsapp restaurante",
    "sistema de pedidos whatsapp",
    "carta online hamburguesería",
    "menú digital pizzería argentina",
    "carta digital gratis argentina",
    "menú online sin comisiones",
    "carta digital dark kitchen",
    "sistema pedidos gastronómico argentina",
    "menú whatsapp sin app",
    "carta digital para restaurantes",
  ],
  openGraph: {
    title: "Takefyy — Tu carta digital online en minutos",
    description:
      "Menú digital para restaurantes argentinos. Pedidos directo a tu WhatsApp. Sin comisiones, sin apps, sin costos en dólares. Empezá gratis.",
    url: "https://takefyy.com",
    siteName: "Takefyy",
    locale: "es_AR",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Takefyy — Menú digital para restaurantes con pedidos por WhatsApp",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Takefyy — Tu carta digital online en minutos",
    description:
      "Menú digital para restaurantes. Pedidos por WhatsApp. Sin comisiones, sin apps. Gratis para empezar.",
    images: ["/opengraph-image"],
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
      logo: "https://takefyy.com/opengraph-image",
      description:
        "Plataforma argentina de menús digitales para restaurantes. Pedidos directo por WhatsApp, sin comisiones ni apps intermediarias.",
      foundingLocation: { "@type": "Place", name: "Argentina" },
      areaServed: { "@type": "Country", name: "Argentina" },
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer service",
        availableLanguage: "Spanish",
        areaServed: "AR",
      },
      sameAs: ["https://www.instagram.com/takefyy"],
    },
    {
      "@type": "SoftwareApplication",
      name: "Takefyy",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: "https://takefyy.com",
      description:
        "Menú digital para restaurantes argentinos. Pedidos directo a WhatsApp, panel admin incluido, URL propia, sin comisiones por pedido.",
      offers: [
        {
          "@type": "Offer",
          name: "Starter",
          description: "Menú digital completo gratis para siempre",
          price: "0",
          priceCurrency: "ARS",
          billingDuration: "P1M",
        },
        {
          "@type": "Offer",
          name: "Pro",
          description: "URL propia, colores personalizados, estadísticas",
          price: "17000",
          priceCurrency: "ARS",
          billingDuration: "P1M",
        },
        {
          "@type": "Offer",
          name: "Growth",
          description: "Reportes avanzados, múltiples administradores",
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
            text: "No. El panel es tan intuitivo que cualquier persona puede armarlo en minutos. Solo cargás tus productos, ponés los precios y listo.",
          },
        },
        {
          "@type": "Question",
          name: "¿Cómo llegan los pedidos?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Directo a tu WhatsApp. El cliente arma su pedido, hace click en 'Hacer pedido' y te manda un mensaje con todos los detalles: nombre, dirección y qué pidió.",
          },
        },
        {
          "@type": "Question",
          name: "¿Hay comisión por pedido en Takefyy?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "No. Pagás la suscripción mensual y listo. Sin sorpresas, sin porcentajes por cada venta. El dinero de tus clientes es tuyo.",
          },
        },
        {
          "@type": "Question",
          name: "¿Puedo personalizar los colores y logo de mi menú digital?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Sí, en los planes Pro y Growth. Podés cargar tu logo, elegir tus colores y tu menú va a tener tu identidad. En el plan Starter el menú funciona con la estética estándar de Takefyy.",
          },
        },
        {
          "@type": "Question",
          name: "¿Qué pasa cuando termina el período de prueba gratuito?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Te avisamos antes de que expire. Si querés continuar, elegís un plan. Si no, no te cobramos nada.",
          },
        },
        {
          "@type": "Question",
          name: "¿Puedo cancelar el plan cuando quiero?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Sí. Sin permanencia, sin letras chicas. Si no te convence, cancelás en un click y no pasa nada.",
          },
        },
        {
          "@type": "Question",
          name: "¿En qué se diferencia Takefyy de otras plataformas de pedidos online?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Takefyy está hecho exclusivamente para gastronomía argentina. Precio fijo en pesos, todo incluido desde el primer día, sin módulos extra ni costos en dólares. El pedido llega directo a tu WhatsApp, sin bots ni apps intermediarias.",
          },
        },
        {
          "@type": "Question",
          name: "¿Takefyy funciona para cualquier tipo de local gastronómico?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Sí. Hamburgueserías, pizzerías, dark kitchens, rotiserías, sushi, heladerías, bares, food trucks — cualquier negocio gastronómico que venda o haga delivery. Si vendés comida, Takefyy funciona para vos.",
          },
        },
      ],
    },
  ],
};

export default async function HomePage() {
  const supabase = createServerClient();
  const { count } = await supabase
    .from("tenants")
    .select("*", { count: "exact", head: true })
    .eq("active", true);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomeClient restaurantCount={Math.floor((count ?? 0) / 5) * 5} />
    </>
  );
}
