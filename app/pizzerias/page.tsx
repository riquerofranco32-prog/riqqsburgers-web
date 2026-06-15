import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  metadataBase: new URL("https://takefyy.com"),
  title:
    "Menú Digital para Pizzerías | Pedidos por WhatsApp sin Rappi — Takefyy",
  description:
    "Creá el menú digital de tu pizzería en minutos. Recibí pedidos directo a tu WhatsApp sin comisiones. Sin Rappi, sin PedidosYa. Precios en pesos. Gratis para empezar.",
  keywords: [
    "menú digital pizzería argentina",
    "carta digital pizzería gratis",
    "pizzería pedidos whatsapp",
    "sistema pedidos pizzería argentina",
    "carta online pizzería sin rappi",
    "menú pizzería sin comisiones",
    "pedidos whatsapp pizzería argentina",
    "menú digital para pizzerías",
    "carta digital pizzería sin pedidosya",
  ],
  alternates: { canonical: "https://takefyy.com/pizzerias" },
  openGraph: {
    title: "Menú Digital para Pizzerías — Takefyy",
    description:
      "Menú digital para tu pizzería. Pedidos directo a tu WhatsApp, sin comisiones. Pizzas, combos, bebidas — todo incluido.",
    url: "https://takefyy.com/pizzerias",
    siteName: "Takefyy",
    locale: "es_AR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Menú Digital para Pizzerías — Takefyy",
    description:
      "Pedidos directo a WhatsApp. Sin comisiones. Gratis para empezar.",
  },
  robots: { index: true, follow: true },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      name: "Takefyy para Pizzerías",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: "https://takefyy.com/pizzerias",
      description:
        "Menú digital especializado para pizzerías argentinas. Pedidos directo a WhatsApp, sin comisiones, con fotos, combos y medias pizzas.",
      offers: [
        {
          "@type": "Offer",
          name: "Gratis",
          price: "0",
          priceCurrency: "ARS",
        },
      ],
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "¿Cómo funciona el menú digital para pizzerías?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Tu cliente entra al link de tu pizzería, elige sus pizzas, combos y bebidas, y te manda el pedido directo por WhatsApp. Sin apps, sin intermediarios, sin comisiones por pedido.",
          },
        },
        {
          "@type": "Question",
          name: "¿Puedo mostrar fotos de mis pizzas?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Sí. Subís fotos de cada pizza directamente desde el celular. Las imágenes se muestran en el menú y aumentan el ticket promedio.",
          },
        },
        {
          "@type": "Question",
          name: "¿Cuánto cobra Takefyy por cada pedido de mi pizzería?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Cero. Takefyy cobra una suscripción mensual fija en pesos. Sin comisión por pedido. El 100% de tu venta es tuyo.",
          },
        },
        {
          "@type": "Question",
          name: "¿Puedo armar combos de pizza + bebida en Takefyy?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Sí. Podés crear categorías de combos con precio propio. Pizza + bebida + postre en un solo producto, para subir el ticket promedio sin complicaciones.",
          },
        },
      ],
    },
  ],
};

const features = [
  {
    icon: "🍕",
    title: "Pizzas con fotos que venden",
    desc: "Subí fotos de cada pizza desde el celular. El queso dorado y el relleno generoso cierran el pedido.",
  },
  {
    icon: "🔀",
    title: "Medias pizzas y combos",
    desc: "Organizá por categorías: clásicas, especiales, medias masas y combos con bebida.",
  },
  {
    icon: "📱",
    title: "Pedidos a WhatsApp",
    desc: "El cliente elige, vos confirmás. El pedido llega con nombre, dirección y detalle completo.",
  },
  {
    icon: "🔥",
    title: "Badge 'Popular'",
    desc: "Marcá tus pizzas estrella y activá el efecto de prueba social para subir el ticket.",
  },
  {
    icon: "0%",
    title: "Sin comisiones",
    desc: "Sin Rappi, sin PedidosYa. El 100% de cada venta queda en tu caja.",
  },
  {
    icon: "⚡",
    title: "Listo en minutos",
    desc: "Cargás tu carta, compartís el link y empezás a tomar pedidos el mismo día.",
  },
];

export default function PizzeriasPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div
        style={{
          minHeight: "100vh",
          background: "var(--brand-cream)",
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
          <Link
            href="/"
            style={{
              display: "inline-block",
              marginBottom: 32,
              color: "rgba(255,255,255,0.4)",
              fontSize: 13,
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            ← Volver a Takefyy
          </Link>

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
            <span style={{ fontSize: 14 }}>🍕</span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "var(--accent)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Para pizzerías
            </span>
          </div>

          <h1
            style={{
              fontFamily: "var(--font-anton)",
              fontSize: "clamp(2.4rem, 6vw, 4.2rem)",
              color: "#fff",
              letterSpacing: "0.01em",
              lineHeight: 1.05,
              marginBottom: 20,
              maxWidth: 700,
              margin: "0 auto 20px",
              textWrap: "balance",
            }}
          >
            Menú digital para tu{" "}
            <span style={{ color: "var(--accent)" }}>pizzería</span>
          </h1>

          <p
            style={{
              fontSize: 17,
              color: "rgba(255,255,255,0.55)",
              maxWidth: 540,
              margin: "0 auto 36px",
              lineHeight: 1.7,
            }}
          >
            Tus clientes eligen pizzas, combos y bebidas desde el celular y te
            mandan el pedido{" "}
            <strong style={{ color: "rgba(255,255,255,0.8)" }}>
              directo a tu WhatsApp
            </strong>
            . Sin comisiones. Sin Rappi.
          </p>

          <div
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <a
              href="https://wa.me/542994247985?text=Hola!%20Quiero%20crear%20el%20men%C3%BA%20digital%20de%20mi%20pizzer%C3%ADa%20%F0%9F%8D%95"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "14px 28px",
                borderRadius: 99,
                background: "var(--accent)",
                color: "#fff",
                fontWeight: 700,
                fontSize: 15,
                textDecoration: "none",
              }}
            >
              Empezar gratis →
            </a>
            <Link
              href="/blog/menu-digital-pizzeria-argentina-2026"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "14px 28px",
                borderRadius: 99,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.75)",
                fontWeight: 600,
                fontSize: 15,
                textDecoration: "none",
              }}
            >
              Ver guía completa
            </Link>
          </div>
        </div>

        {/* Features */}
        <div
          style={{
            maxWidth: 900,
            margin: "0 auto",
            padding: "72px 20px",
          }}
        >
          <p
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "var(--accent)",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              textAlign: "center",
              marginBottom: 12,
            }}
          >
            Todo lo que necesita tu pizzería
          </p>
          <h2
            style={{
              fontFamily: "var(--font-anton)",
              fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
              color: "var(--text-primary)",
              textAlign: "center",
              marginBottom: 48,
              letterSpacing: "0.01em",
              textWrap: "balance",
            }}
          >
            Funciones pensadas para el rubro
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 20,
            }}
          >
            {features.map((f) => (
              <div
                key={f.title}
                style={{
                  background: "#fff",
                  border: "1px solid var(--border)",
                  borderRadius: 16,
                  padding: "24px 24px",
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 12 }}>{f.icon}</div>
                <h3
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    marginBottom: 8,
                  }}
                >
                  {f.title}
                </h3>
                <p
                  style={{
                    fontSize: 14,
                    color: "var(--text-secondary)",
                    lineHeight: 1.6,
                  }}
                >
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* vs Rappi */}
        <div style={{ background: "#0E1116", padding: "64px 20px" }}>
          <div style={{ maxWidth: 640, margin: "0 auto", textAlign: "center" }}>
            <h2
              style={{
                fontFamily: "var(--font-anton)",
                fontSize: "clamp(1.6rem, 4vw, 2.4rem)",
                color: "#fff",
                marginBottom: 16,
                letterSpacing: "0.01em",
                textWrap: "balance",
              }}
            >
              ¿Cuánto perdés por mes con Rappi?
            </h2>
            <p
              style={{
                fontSize: 15,
                color: "rgba(255,255,255,0.55)",
                lineHeight: 1.7,
                marginBottom: 32,
              }}
            >
              Rappi y PedidosYa cobran hasta el{" "}
              <strong style={{ color: "var(--accent)" }}>35% por pedido</strong>
              . Una pizzería que vende $500.000 ARS mensuales pierde{" "}
              <strong style={{ color: "var(--accent)" }}>$175.000 ARS</strong>{" "}
              en comisiones — más que el costo anual de Takefyy.
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
                maxWidth: 480,
                margin: "0 auto 32px",
              }}
            >
              {[
                {
                  label: "Rappi / PedidosYa",
                  value: "−35% por pedido",
                  bad: true,
                },
                { label: "Takefyy", value: "0% de comisión", bad: false },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    padding: "20px 16px",
                    borderRadius: 12,
                    border: item.bad
                      ? "1px solid rgba(239,68,68,0.2)"
                      : "1px solid rgba(34,197,94,0.2)",
                    background: item.bad
                      ? "rgba(239,68,68,0.06)"
                      : "rgba(34,197,94,0.06)",
                    textAlign: "center",
                  }}
                >
                  <p
                    style={{
                      fontSize: 12,
                      color: "rgba(255,255,255,0.4)",
                      marginBottom: 8,
                    }}
                  >
                    {item.label}
                  </p>
                  <p
                    style={{
                      fontSize: 20,
                      fontWeight: 700,
                      color: item.bad ? "#ef4444" : "#22c55e",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
            <a
              href="https://wa.me/542994247985?text=Hola!%20Quiero%20crear%20el%20men%C3%BA%20digital%20de%20mi%20pizzer%C3%ADa%20%F0%9F%8D%95"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "14px 32px",
                borderRadius: 99,
                background: "var(--accent)",
                color: "#fff",
                fontWeight: 700,
                fontSize: 15,
                textDecoration: "none",
              }}
            >
              Empezar gratis hoy →
            </a>
          </div>
        </div>

        {/* FAQ */}
        <div
          style={{
            maxWidth: 680,
            margin: "0 auto",
            padding: "72px 20px 80px",
          }}
        >
          <h2
            style={{
              fontFamily: "var(--font-anton)",
              fontSize: "clamp(1.6rem, 3vw, 2.2rem)",
              color: "var(--text-primary)",
              marginBottom: 36,
              textAlign: "center",
              letterSpacing: "0.01em",
            }}
          >
            Preguntas frecuentes
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              {
                q: "¿Cómo funciona el menú digital para pizzerías?",
                a: "Tu cliente entra al link de tu pizzería, elige sus pizzas, combos y bebidas, y te manda el pedido directo por WhatsApp. Sin apps, sin intermediarios.",
              },
              {
                q: "¿Puedo mostrar fotos de mis pizzas?",
                a: "Sí. Subís fotos de cada pizza directamente desde el celular. Las imágenes se muestran en el menú y aumentan el ticket promedio.",
              },
              {
                q: "¿Puedo armar combos de pizza + bebida?",
                a: "Sí. Podés crear categorías de combos con precio propio. Pizza + bebida + postre en un solo producto para subir el ticket sin complicaciones.",
              },
              {
                q: "¿Cuánto cobra Takefyy por cada pedido?",
                a: "Cero. Takefyy cobra una suscripción mensual fija en pesos. Sin comisión por pedido. El 100% de tu venta es tuyo.",
              },
            ].map((item) => (
              <div
                key={item.q}
                style={{
                  background: "#fff",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  padding: "20px 24px",
                }}
              >
                <p
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    marginBottom: 8,
                    textWrap: "balance",
                  }}
                >
                  {item.q}
                </p>
                <p
                  style={{
                    fontSize: 14,
                    color: "var(--text-secondary)",
                    lineHeight: 1.6,
                  }}
                >
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Related */}
        <div
          style={{
            background: "#F5F0EA",
            borderTop: "1px solid var(--border)",
            padding: "48px 20px",
          }}
        >
          <div style={{ maxWidth: 680, margin: "0 auto", textAlign: "center" }}>
            <p
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "var(--text-muted)",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                marginBottom: 20,
              }}
            >
              También te puede interesar
            </p>
            <div
              style={{
                display: "flex",
                gap: 12,
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <Link
                href="/blog/menu-digital-pizzeria-argentina-2026"
                style={{
                  padding: "10px 20px",
                  borderRadius: 99,
                  background: "#fff",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                  fontSize: 14,
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                Guía: Menú para pizzerías 2026 →
              </Link>
              <Link
                href="/hamburgueserias"
                style={{
                  padding: "10px 20px",
                  borderRadius: 99,
                  background: "#fff",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                  fontSize: 14,
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                Menú para hamburguerías →
              </Link>
              <Link
                href="/blog/pedidos-whatsapp-restaurante-vs-rappi-pedidosya"
                style={{
                  padding: "10px 20px",
                  borderRadius: 99,
                  background: "#fff",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                  fontSize: 14,
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                WhatsApp vs Rappi →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
