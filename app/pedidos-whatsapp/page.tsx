import type { Metadata } from "next";
import Link from "next/link";
import RelatedLinks from "@/app/components/RelatedLinks";

export const metadata: Metadata = {
  metadataBase: new URL("https://takefyy.com"),
  title: "Pedidos por WhatsApp para Restaurantes — Takefyy",
  description:
    "Recibí pedidos directo a tu WhatsApp desde tu menú digital. Sin apps ni comisiones. El cliente elige, pedís y listo. Gratis.",
  keywords: [
    "pedidos por whatsapp restaurante",
    "recibir pedidos whatsapp",
    "sistema pedidos whatsapp",
    "pedidos online whatsapp argentina",
    "menú digital whatsapp",
    "carta digital whatsapp",
    "pedidos whatsapp sin comision",
    "pedidos whatsapp hamburguesería",
    "pedidos whatsapp pizzería",
    "sistema de pedidos whatsapp para restaurantes",
  ],
  alternates: { canonical: "https://takefyy.com/pedidos-whatsapp" },
  openGraph: {
    title: "Pedidos por WhatsApp para Restaurantes — Takefyy",
    description:
      "Tu menú digital que envía pedidos directo a tu WhatsApp. Sin intermediarios, sin comisiones. Gratis para empezar.",
    url: "https://takefyy.com/pedidos-whatsapp",
    siteName: "Takefyy",
    locale: "es_AR",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Pedidos por WhatsApp — Takefyy",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pedidos por WhatsApp para Restaurantes — Takefyy",
    description: "Recibí pedidos directo a tu WhatsApp, sin comisiones.",
    images: ["/opengraph-image"],
  },
  robots: { index: true, follow: true },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      name: "Takefyy — Pedidos por WhatsApp",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: "https://takefyy.com/pedidos-whatsapp",
      description:
        "Sistema de pedidos por WhatsApp para restaurantes. Tu cliente elige en el menú digital y te manda el pedido completo por WhatsApp, sin apps ni intermediarios.",
      offers: [{ "@type": "Offer", price: "0", priceCurrency: "ARS" }],
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
          name: "Pedidos por WhatsApp",
          item: "https://takefyy.com/pedidos-whatsapp",
        },
      ],
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "¿Cómo funciona el sistema de pedidos por WhatsApp?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Tu cliente entra al menú digital de tu restaurante, elige los productos, hace click en 'Hacer pedido' y se abre WhatsApp con el pedido completo listo para enviar. Vos lo recibís directo en tu WhatsApp sin ninguna intermediación.",
          },
        },
        {
          "@type": "Question",
          name: "¿Hay alguna comisión por los pedidos que llegan por WhatsApp?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "No. Con Takefyy el 100% de cada venta es tuyo. Pagás una suscripción mensual fija en pesos argentinos y no hay porcentaje por pedido, sin importar cuánto vendas.",
          },
        },
        {
          "@type": "Question",
          name: "¿El cliente necesita tener una app especial para hacer el pedido?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "No. El cliente solo necesita WhatsApp (que ya tiene instalado) y un navegador. El menú digital es una página web que funciona en cualquier celular sin descargar nada.",
          },
        },
        {
          "@type": "Question",
          name: "¿Qué información trae el pedido que llega por WhatsApp?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "El pedido de WhatsApp incluye: nombre del cliente, dirección de entrega (si eligió delivery), productos con cantidades y extras seleccionados, forma de pago elegida y total del pedido. Todo formateado para que sea fácil de leer.",
          },
        },
      ],
    },
  ],
};

const benefits = [
  {
    icon: "💬",
    title: "Pedidos instantáneos",
    desc: "Cada pedido llega en tiempo real a tu WhatsApp, listo para confirmar.",
  },
  {
    icon: "0%",
    title: "Cero comisiones",
    desc: "El 100% de cada venta es tuyo. Sin porcentajes, sin sorpresas al final del mes.",
  },
  {
    icon: "📋",
    title: "Detalle completo",
    desc: "Nombre, dirección, productos, extras, pago y total. Todo en un mensaje.",
  },
  {
    icon: "⚡",
    title: "Sin apps de tu parte",
    desc: "Solo necesitás WhatsApp. No hay que instalar nada en tu celular ni tablet.",
  },
  {
    icon: "🎯",
    title: "Clientes directos",
    desc: "Construís tu base de clientes propia, sin depender de plataformas de terceros.",
  },
  {
    icon: "📱",
    title: "Confirma en segundos",
    desc: "Recibís el pedido, lo confirmás con un mensaje y empezás a prepararlo.",
  },
];

const ACCENT = "var(--accent, #FF6B35)";

export default function PedidosWhatsappPage() {
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
        {/* Hero */}
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
              Pedidos por WhatsApp
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
            <span style={{ fontSize: 16 }}>💬</span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: ACCENT,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Pedidos por WhatsApp
            </span>
          </div>

          <h1
            style={{
              fontFamily: "var(--font-anton)",
              fontSize: "clamp(2.4rem, 6vw, 4rem)",
              color: "#fff",
              lineHeight: 1.05,
              marginBottom: 20,
              maxWidth: 660,
              margin: "0 auto 20px",
            }}
          >
            Recibí pedidos directo en tu WhatsApp
          </h1>

          <p
            style={{
              fontSize: "clamp(1rem, 2vw, 1.2rem)",
              color: "rgba(255,255,255,0.6)",
              maxWidth: 520,
              margin: "0 auto 36px",
              lineHeight: 1.65,
            }}
          >
            Tu cliente elige en el menú digital, hace click y te manda el pedido
            completo por WhatsApp. Sin apps, sin intermediarios, sin comisiones.
            100% de la venta es tuya.
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
            Empezar gratis →
          </a>

          <p
            style={{
              fontSize: 12,
              color: "rgba(255,255,255,0.3)",
              marginTop: 16,
            }}
          >
            Sin tarjeta de crédito · 14 días gratis
          </p>
        </div>

        {/* Benefits */}
        <div style={{ maxWidth: 920, margin: "0 auto", padding: "72px 20px" }}>
          <h2
            style={{
              fontFamily: "var(--font-anton)",
              fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)",
              textAlign: "center",
              marginBottom: 48,
              color: "#0E1116",
            }}
          >
            Por qué los restaurantes eligen recibir pedidos por WhatsApp
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 20,
            }}
          >
            {benefits.map((b) => (
              <div
                key={b.title}
                style={{
                  background: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 14,
                  padding: "22px 20px",
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 10 }}>{b.icon}</div>
                <h3
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    marginBottom: 6,
                    color: "#0E1116",
                  }}
                >
                  {b.title}
                </h3>
                <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.6 }}>
                  {b.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Internal links */}
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
              También te puede interesar
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
                { href: "/menu-digital", label: "🍽️ Menú Digital" },
                { href: "/menu-qr", label: "📲 Menú con QR" },
                { href: "/hamburgueserias", label: "🍔 Para Hamburguerías" },
                { href: "/pizzerias", label: "🍕 Para Pizzerías" },
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

        {/* CTA final */}
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
            Empezá a recibir pedidos por WhatsApp hoy
          </h2>
          <p
            style={{
              color: "rgba(255,255,255,0.5)",
              fontSize: 15,
              marginBottom: 28,
            }}
          >
            Gratis para siempre en el plan básico. Sin contratos.
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
            Crear mi menú gratis →
          </a>
        </div>

        <RelatedLinks exclude="/pedidos-whatsapp" />
      </div>
    </>
  );
}
