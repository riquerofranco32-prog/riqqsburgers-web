import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  metadataBase: new URL("https://takefyy.com"),
  title: "Menú Digital para Dark Kitchens | Pedidos por WhatsApp — Takefyy",
  description:
    "El menú digital ideal para dark kitchens y cocinas fantasma. Recibí pedidos por WhatsApp sin comisiones, gestioná múltiples marcas y cocinas desde un solo panel.",
  keywords: [
    "menú digital dark kitchen",
    "dark kitchen argentina menú digital",
    "cocina fantasma pedidos whatsapp",
    "software dark kitchen argentina",
    "menu digital cocina fantasma",
    "dark kitchen plataforma pedidos",
    "menú digital cocina oculta",
  ],
  alternates: { canonical: "https://takefyy.com/dark-kitchens" },
  openGraph: {
    title: "Menú Digital para Dark Kitchens — Takefyy",
    description: "Menú digital para dark kitchens y cocinas fantasma. Pedidos por WhatsApp, sin comisiones.",
    url: "https://takefyy.com/dark-kitchens",
    siteName: "Takefyy",
    locale: "es_AR",
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Menú Digital para Dark Kitchens — Takefyy" }],
  },
  twitter: { card: "summary_large_image", title: "Menú Digital para Dark Kitchens — Takefyy", description: "Menú digital para dark kitchens. Pedidos por WhatsApp. Sin comisiones.", images: ["/opengraph-image"] },
  robots: { index: true, follow: true },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      name: "Takefyy para Dark Kitchens",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: "https://takefyy.com/dark-kitchens",
      description: "Menú digital para dark kitchens y cocinas fantasma. Sistema de pedidos por WhatsApp sin comisiones.",
      offers: [{ "@type": "Offer", price: "0", priceCurrency: "ARS" }],
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inicio", item: "https://takefyy.com" },
        { "@type": "ListItem", position: 2, name: "Dark Kitchens", item: "https://takefyy.com/dark-kitchens" },
      ],
    },
  ],
};

const ACCENT = "var(--accent, #FF6B35)";

const features = [
  { icon: "🌒", title: "Sin local físico, sin problema", desc: "Tu menú digital funciona 100% online. Sin mesas, sin salón, sin limitaciones de espacio." },
  { icon: "📱", title: "Link directo para Instagram y WhatsApp", desc: "Compartí el link de tu menú en bio, stories y grupos. Tus clientes ordenan sin salir de WhatsApp." },
  { icon: "⚡", title: "Cero comisiones por pedido", desc: "Sin Rappi, sin PedidosYa. La dark kitchen más rentable es la que no paga el 30% de cada venta." },
  { icon: "🔄", title: "Actualizaciones en tiempo real", desc: "Cambiá el menú en segundos. Agotaste algo — lo marcás y listo. Sin imprimir, sin llamadas." },
  { icon: "🎨", title: "Múltiples marcas, un solo panel", desc: "Gestioná marcas distintas desde el mismo panel. Cada una con su propio link y menú." },
  { icon: "📊", title: "Estadísticas de ventas", desc: "Qué se vende más, a qué hora, cuánto en promedio. Datos para optimizar tu cocina." },
];

export default function DarkKitchensPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div style={{ minHeight: "100vh", background: "var(--brand-cream, #FFF8F0)", fontFamily: "var(--font-sans)" }}>
        <div style={{ background: "#0E1116", padding: "80px 20px 72px", textAlign: "center" }}>
          <nav aria-label="Breadcrumb" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 32, fontSize: 12 }}>
            <Link href="/" style={{ color: "rgba(255,255,255,0.35)", textDecoration: "none" }}>Takefyy</Link>
            <span style={{ color: "rgba(255,255,255,0.2)" }}>›</span>
            <span style={{ color: "rgba(255,255,255,0.55)" }}>Dark Kitchens</span>
          </nav>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,107,53,0.1)", border: "1px solid rgba(255,107,53,0.25)", borderRadius: 99, padding: "6px 16px", marginBottom: 28 }}>
            <span style={{ fontSize: 16 }}>🌒</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: ACCENT, letterSpacing: "0.08em", textTransform: "uppercase" }}>Para dark kitchens</span>
          </div>
          <h1 style={{ fontFamily: "var(--font-anton)", fontSize: "clamp(2.2rem, 5.5vw, 3.8rem)", color: "#fff", lineHeight: 1.05, marginBottom: 20, maxWidth: 660, margin: "0 auto 20px" }}>
            Menú digital para dark kitchens y cocinas fantasma
          </h1>
          <p style={{ fontSize: "clamp(1rem, 2vw, 1.15rem)", color: "rgba(255,255,255,0.6)", maxWidth: 520, margin: "0 auto 36px", lineHeight: 1.65 }}>
            Recibí pedidos por WhatsApp sin pagar el 30% de Rappi. Tu dark kitchen más rentable empieza con un menú digital propio.
          </p>
          <a href="/signup" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "15px 36px", borderRadius: 99, background: ACCENT, color: "#fff", fontWeight: 700, fontSize: 16, textDecoration: "none" }}>
            Empezar gratis →
          </a>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 16 }}>Sin tarjeta · 14 días gratis</p>
        </div>

        <div style={{ maxWidth: 920, margin: "0 auto", padding: "72px 20px" }}>
          <h2 style={{ fontFamily: "var(--font-anton)", fontSize: "clamp(1.6rem, 3.5vw, 2.3rem)", textAlign: "center", marginBottom: 48, color: "#0E1116" }}>
            Por qué las dark kitchens eligen Takefyy
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
            {features.map((f) => (
              <div key={f.title} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "22px 20px" }}>
                <div style={{ fontSize: 26, marginBottom: 10 }}>{f.icon}</div>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6, color: "#0E1116" }}>{f.title}</h3>
                <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ borderTop: "1px solid #e5e7eb", padding: "40px 20px" }}>
          <div style={{ maxWidth: 720, margin: "0 auto", textAlign: "center" }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>También te puede interesar</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
              {[
                { href: "/menu-digital", label: "🍽️ Menú Digital" },
                { href: "/pedidos-whatsapp", label: "💬 Pedidos por WhatsApp" },
                { href: "/software-restaurantes", label: "💻 Software para Restaurantes" },
                { href: "/hamburgueserias", label: "🍔 Para Hamburguerías" },
              ].map((l) => (
                <Link key={l.href} href={l.href} style={{ padding: "8px 16px", borderRadius: 99, background: "#fff", border: "1px solid #e5e7eb", fontSize: 13, fontWeight: 600, color: "#374151", textDecoration: "none" }}>
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div style={{ background: "#0E1116", padding: "64px 20px", textAlign: "center" }}>
          <h2 style={{ fontFamily: "var(--font-anton)", fontSize: "clamp(1.8rem, 4vw, 2.6rem)", color: "#fff", marginBottom: 16 }}>Tu dark kitchen, lista para recibir pedidos</h2>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 15, marginBottom: 28 }}>Gratis para siempre. Sin contrato.</p>
          <a href="/signup" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "15px 36px", borderRadius: 99, background: ACCENT, color: "#fff", fontWeight: 700, fontSize: 16, textDecoration: "none" }}>
            Crear mi menú gratis →
          </a>
        </div>
      </div>
    </>
  );
}
