import type { Metadata } from "next";
import Link from "next/link";
import RelatedLinks from "@/app/components/RelatedLinks";

export const metadata: Metadata = {
  metadataBase: new URL("https://takefyy.com"),
  title: "Software para Restaurantes en Argentina | Sin Comisiones — Takefyy",
  description:
    "El software para restaurantes más simple de Argentina. Menú digital, pedidos por WhatsApp, panel de administración, sin comisiones. Precio fijo en pesos. Gratis para empezar.",
  keywords: [
    "software para restaurantes",
    "software restaurantes argentina",
    "software gastronomico argentina",
    "sistema para restaurantes",
    "sistema de pedidos restaurante",
    "software delivery restaurante argentina",
    "programa para restaurantes",
    "software gestion restaurante",
    "plataforma pedidos restaurante",
    "software restaurante gratis argentina",
  ],
  alternates: { canonical: "https://takefyy.com/software-restaurantes" },
  openGraph: {
    title: "Software para Restaurantes en Argentina — Takefyy",
    description:
      "Menú digital, pedidos por WhatsApp y panel de administración para restaurantes argentinos. Sin comisiones, precio en pesos.",
    url: "https://takefyy.com/software-restaurantes",
    siteName: "Takefyy",
    locale: "es_AR",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Software para Restaurantes Argentina — Takefyy",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Software para Restaurantes Argentina — Takefyy",
    description:
      "Menú digital, pedidos WhatsApp, panel admin. Sin comisiones. Precio en pesos.",
    images: ["/opengraph-image"],
  },
  robots: { index: true, follow: true },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      name: "Takefyy",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: "https://takefyy.com/software-restaurantes",
      description:
        "Software completo para restaurantes argentinos. Menú digital, sistema de pedidos por WhatsApp, panel de administración de productos y órdenes. Sin comisiones, precio en pesos.",
      featureList: [
        "Menú digital con URL propia",
        "Pedidos por WhatsApp",
        "Panel admin de productos y categorías",
        "Gestión de pedidos en tiempo real",
        "Código QR para las mesas",
        "Estadísticas de ventas",
        "Personalización de colores y logo",
        "Sistema de cupones y descuentos",
      ],
      offers: [
        { "@type": "Offer", name: "Starter", price: "0", priceCurrency: "ARS" },
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
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Inicio",
          item: "https://takefyy.com",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Software para Restaurantes",
          item: "https://takefyy.com/software-restaurantes",
        },
      ],
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "¿Qué incluye el software para restaurantes de Takefyy?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Menú digital con URL propia, sistema de pedidos por WhatsApp, panel de administración de productos y pedidos, código QR para mesas, cupones y estadísticas de ventas, todo en un mismo lugar.",
          },
        },
        {
          "@type": "Question",
          name: "¿Cuánto cuesta el software para restaurantes?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Tiene un plan Starter gratuito permanente. Los planes Pro ($17.000 ARS/mes) y Growth ($27.000 ARS/mes) suman URL propia, personalización y funciones avanzadas. Precio fijo en pesos, sin comisión por venta.",
          },
        },
        {
          "@type": "Question",
          name: "¿Necesito contratar un técnico para instalar el software?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "No. Es 100% web, sin instalación. Te registrás, cargás tu carta desde el panel y publicás tu menú digital en minutos.",
          },
        },
        {
          "@type": "Question",
          name: "¿El software cobra comisión por cada pedido?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "No. Pagás una suscripción mensual fija en pesos, sin porcentaje por venta. A diferencia de las apps de delivery, el 100% de cada pedido es tuyo.",
          },
        },
        {
          "@type": "Question",
          name: "¿El software sirve para cualquier tipo de restaurante?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Sí. Lo usan hamburgueserías, pizzerías, dark kitchens y restaurantes tradicionales de Argentina, cualquier negocio gastronómico que reciba pedidos por WhatsApp.",
          },
        },
      ],
    },
  ],
};

const features = [
  {
    icon: "🍽️",
    title: "Menú digital completo",
    desc: "Categorías, productos, fotos, extras, combos, variantes. Todo desde el panel.",
  },
  {
    icon: "💬",
    title: "Sistema de pedidos por WhatsApp",
    desc: "El pedido llega directo a tu WhatsApp. Sin bots, sin apps, sin intermediarios.",
  },
  {
    icon: "📊",
    title: "Panel de administración",
    desc: "Gestioná tu carta, tus pedidos y tus estadísticas desde cualquier dispositivo.",
  },
  {
    icon: "📲",
    title: "Menú QR para las mesas",
    desc: "Generá el código QR de tu menú e imprimilo para las mesas o la entrada.",
  },
  {
    icon: "🎨",
    title: "Tu marca, tus colores",
    desc: "Personalizá tu menú con tu logo y la paleta de colores de tu negocio.",
  },
  {
    icon: "🏷️",
    title: "Cupones y descuentos",
    desc: "Creá promociones y cupones para fidelizar a tus clientes habituales.",
  },
  {
    icon: "⚡",
    title: "Rápido y liviano",
    desc: "Menú ultra-veloz que carga en menos de 1 segundo en cualquier celular.",
  },
  {
    icon: "0%",
    title: "Sin comisiones",
    desc: "Precio fijo en pesos. Sin porcentaje por pedido, sin costos en dólares.",
  },
];

const ACCENT = "var(--accent, #FF6B35)";

export default function SoftwareRestaurantesPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div
        style={{
          minHeight: "100vh",
          background: "var(--brand-cream, #FFF8F0)",
          fontFamily: "var(--font-sans)",
        }}
      >
        <div
          style={{
            background: "#0E1116",
            padding: "80px 20px 72px",
            textAlign: "center",
          }}
        >
          <nav
            aria-label="Breadcrumb"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              marginBottom: 32,
              fontSize: 12,
            }}
          >
            <Link
              href="/"
              style={{
                color: "rgba(255,255,255,0.35)",
                textDecoration: "none",
              }}
            >
              Takefyy
            </Link>
            <span style={{ color: "rgba(255,255,255,0.2)" }}>›</span>
            <span style={{ color: "rgba(255,255,255,0.55)" }}>
              Software para Restaurantes
            </span>
          </nav>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(255,107,53,0.1)",
              border: "1px solid rgba(255,107,53,0.25)",
              borderRadius: 99,
              padding: "6px 16px",
              marginBottom: 28,
            }}
          >
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: ACCENT,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Software para restaurantes · Argentina
            </span>
          </div>

          <h1
            style={{
              fontFamily: "var(--font-anton)",
              fontSize: "clamp(2.2rem, 5.5vw, 3.8rem)",
              color: "#fff",
              lineHeight: 1.05,
              marginBottom: 20,
              maxWidth: 680,
              margin: "0 auto 20px",
            }}
          >
            El software para restaurantes más simple de Argentina
          </h1>
          <p
            style={{
              fontSize: "clamp(1rem, 2vw, 1.15rem)",
              color: "rgba(255,255,255,0.6)",
              maxWidth: 520,
              margin: "0 auto 36px",
              lineHeight: 1.65,
            }}
          >
            Menú digital, pedidos por WhatsApp y panel de administración
            completo. Precio fijo en pesos, sin comisiones, sin costos en
            dólares. Gratis para empezar.
          </p>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              justifyContent: "center",
            }}
          >
            <a
              href="/signup"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "15px 36px",
                borderRadius: 99,
                background: ACCENT,
                color: "#fff",
                fontWeight: 700,
                fontSize: 16,
                textDecoration: "none",
              }}
            >
              Empezar gratis →
            </a>
            <a
              href="/belmont"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "15px 28px",
                borderRadius: 99,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.8)",
                fontWeight: 600,
                fontSize: 15,
                textDecoration: "none",
              }}
            >
              Ver demo
            </a>
          </div>
          <p
            style={{
              fontSize: 12,
              color: "rgba(255,255,255,0.3)",
              marginTop: 16,
            }}
          >
            14 días gratis · Sin tarjeta · Sin contrato
          </p>
        </div>

        <div style={{ maxWidth: 960, margin: "0 auto", padding: "72px 20px" }}>
          <h2
            style={{
              fontFamily: "var(--font-anton)",
              fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)",
              textAlign: "center",
              marginBottom: 48,
              color: "#0E1116",
            }}
          >
            Todo lo que incluye el software
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: 20,
            }}
          >
            {features.map((f) => (
              <div
                key={f.title}
                style={{
                  background: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 14,
                  padding: "20px 18px",
                }}
              >
                <div style={{ fontSize: 26, marginBottom: 10 }}>{f.icon}</div>
                <h3
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    marginBottom: 6,
                    color: "#0E1116",
                  }}
                >
                  {f.title}
                </h3>
                <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.6 }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ borderTop: "1px solid #e5e7eb", padding: "40px 20px" }}>
          <div style={{ maxWidth: 720, margin: "0 auto", textAlign: "center" }}>
            <p
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#9ca3af",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: 16,
              }}
            >
              Comparativas
            </p>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 10,
                justifyContent: "center",
              }}
            >
              {[
                { href: "/vs/olaclick", label: "Takefyy vs OlaClick" },
                { href: "/vs/pedix", label: "Takefyy vs Pedix" },
                { href: "/vs/fudo", label: "Takefyy vs Fudo" },
                { href: "/menu-digital", label: "🍽️ Menú Digital" },
              ].map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 99,
                    background: "#fff",
                    border: "1px solid #e5e7eb",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#374151",
                    textDecoration: "none",
                  }}
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "72px 20px" }}>
          <h2
            style={{
              fontFamily: "var(--font-anton)",
              fontSize: "clamp(1.6rem, 3.5vw, 2.2rem)",
              textAlign: "center",
              marginBottom: 40,
              color: "#0E1116",
            }}
          >
            Preguntas frecuentes sobre el software para restaurantes
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {(
              jsonLd["@graph"][2] as {
                mainEntity: Array<{
                  name: string;
                  acceptedAnswer: { text: string };
                }>;
              }
            ).mainEntity.map((q) => (
              <details
                key={q.name}
                style={{
                  background: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 12,
                  padding: "18px 20px",
                }}
              >
                <summary
                  style={{
                    fontWeight: 600,
                    fontSize: 15,
                    cursor: "pointer",
                    color: "#0E1116",
                    listStyle: "none",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  {q.name}
                  <span style={{ flexShrink: 0, fontSize: 18, color: ACCENT }}>
                    +
                  </span>
                </summary>
                <p
                  style={{
                    marginTop: 12,
                    fontSize: 14,
                    color: "#6b7280",
                    lineHeight: 1.7,
                  }}
                >
                  {q.acceptedAnswer.text}
                </p>
              </details>
            ))}
          </div>
        </div>

        <div
          style={{
            background: "#0E1116",
            padding: "64px 20px",
            textAlign: "center",
          }}
        >
          <h2
            style={{
              fontFamily: "var(--font-anton)",
              fontSize: "clamp(1.8rem, 4vw, 2.6rem)",
              color: "#fff",
              marginBottom: 16,
            }}
          >
            Probá el software gratis
          </h2>
          <p
            style={{
              color: "rgba(255,255,255,0.5)",
              fontSize: 15,
              marginBottom: 28,
            }}
          >
            14 días sin costo. Sin tarjeta. Sin contrato.
          </p>
          <a
            href="/signup"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "15px 36px",
              borderRadius: 99,
              background: ACCENT,
              color: "#fff",
              fontWeight: 700,
              fontSize: 16,
              textDecoration: "none",
            }}
          >
            Crear cuenta gratis →
          </a>
        </div>

        <RelatedLinks exclude="/software-restaurantes" />
      </div>
    </>
  );
}
