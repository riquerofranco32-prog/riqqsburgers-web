import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { competitors } from "../data";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return Object.keys(competitors).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const comp = competitors[slug];
  if (!comp) return { title: "No encontrado — Takefyy" };

  const url = `https://takefyy.com/vs/${slug}`;
  return {
    metadataBase: new URL("https://takefyy.com"),
    title: `${comp.title} | Takefyy`,
    description: comp.description,
    keywords: comp.keywords,
    alternates: { canonical: url },
    openGraph: {
      title: comp.title,
      description: comp.description,
      url,
      siteName: "Takefyy",
      locale: "es_AR",
      type: "article",
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: comp.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: comp.title,
      description: comp.description,
      images: ["/opengraph-image"],
    },
    robots: { index: true, follow: true },
  };
}

const ACCENT = "var(--accent, #FF6B35)";

function CheckIcon() {
  return <span style={{ color: "#22c55e", fontWeight: 700, fontSize: 16 }}>✓</span>;
}
function XIcon() {
  return <span style={{ color: "#ef4444", fontWeight: 700, fontSize: 16 }}>✗</span>;
}

export default async function VsPage({ params }: Props) {
  const { slug } = await params;
  const comp = competitors[slug];
  if (!comp) notFound();

  const url = `https://takefyy.com/vs/${slug}`;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: comp.title,
      description: comp.description,
      url,
      datePublished: "2026-07-01",
      dateModified: new Date().toISOString().split("T")[0],
      author: { "@type": "Organization", name: "Takefyy", url: "https://takefyy.com" },
      publisher: { "@type": "Organization", name: "Takefyy", url: "https://takefyy.com" },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inicio", item: "https://takefyy.com" },
        { "@type": "ListItem", position: 2, name: "Comparativas", item: "https://takefyy.com/vs" },
        { "@type": "ListItem", position: 3, name: `Takefyy vs ${comp.name}`, item: url },
      ],
    },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div style={{ minHeight: "100vh", background: "var(--brand-cream, #FFF8F0)", fontFamily: "var(--font-sans)" }}>
        {/* Header */}
        <div style={{ background: "#0E1116", padding: "72px 20px 64px", textAlign: "center" }}>
          <nav aria-label="Breadcrumb" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 28, fontSize: 12 }}>
            <Link href="/" style={{ color: "rgba(255,255,255,0.35)", textDecoration: "none" }}>Takefyy</Link>
            <span style={{ color: "rgba(255,255,255,0.2)" }}>›</span>
            <Link href="/vs" style={{ color: "rgba(255,255,255,0.35)", textDecoration: "none" }}>Comparativas</Link>
            <span style={{ color: "rgba(255,255,255,0.2)" }}>›</span>
            <span style={{ color: "rgba(255,255,255,0.55)" }}>vs {comp.name}</span>
          </nav>

          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,107,53,0.1)", border: "1px solid rgba(255,107,53,0.25)", borderRadius: 99, padding: "5px 14px", marginBottom: 24 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: ACCENT, letterSpacing: "0.08em", textTransform: "uppercase" }}>{comp.tagline}</span>
          </div>

          <h1 style={{ fontFamily: "var(--font-anton)", fontSize: "clamp(2rem, 5vw, 3.4rem)", color: "#fff", lineHeight: 1.08, marginBottom: 20, maxWidth: 720, margin: "0 auto 20px" }}>
            Takefyy vs {comp.name}
          </h1>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.6)", maxWidth: 560, margin: "0 auto", lineHeight: 1.65 }}>
            {comp.intro}
          </p>
        </div>

        {/* Comparison table */}
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "64px 20px 0" }}>
          <h2 style={{ fontFamily: "var(--font-anton)", fontSize: "clamp(1.4rem, 3vw, 2rem)", textAlign: "center", marginBottom: 32, color: "#0E1116" }}>
            Comparación de funciones
          </h2>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, background: "#fff", borderRadius: 14, overflow: "hidden", border: "1px solid #e5e7eb" }}>
              <thead>
                <tr style={{ background: "#0E1116" }}>
                  <th style={{ textAlign: "left", padding: "14px 20px", fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.6)" }}>Función</th>
                  <th style={{ textAlign: "center", padding: "14px 20px", fontSize: 13, fontWeight: 800, color: ACCENT }}>Takefyy</th>
                  <th style={{ textAlign: "center", padding: "14px 20px", fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.6)" }}>{comp.name}</th>
                </tr>
              </thead>
              <tbody>
                {comp.tableRows.map((row, i) => (
                  <tr key={row.feature} style={{ background: i % 2 === 0 ? "#fff" : "#f9fafb" }}>
                    <td style={{ padding: "13px 20px", fontSize: 14, color: "#374151", fontWeight: 500 }}>{row.feature}</td>
                    <td style={{ padding: "13px 20px", textAlign: "center" }}>
                      {typeof row.takefyy === "boolean" ? (row.takefyy ? <CheckIcon /> : <XIcon />) : (
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#16a34a" }}>{row.takefyy}</span>
                      )}
                    </td>
                    <td style={{ padding: "13px 20px", textAlign: "center" }}>
                      {typeof row.competitor === "boolean" ? (row.competitor ? <CheckIcon /> : <XIcon />) : (
                        <span style={{ fontSize: 13, color: "#6b7280" }}>{row.competitor}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pros/cons */}
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "48px 20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: 20 }}>
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "24px 20px" }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0E1116", marginBottom: 16 }}>✅ Ventajas de Takefyy</h3>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                {comp.takefyyPros.map((pro) => (
                  <li key={pro} style={{ fontSize: 14, color: "#374151", display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <span style={{ color: "#22c55e", flexShrink: 0, fontWeight: 700 }}>✓</span>
                    {pro}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "20px", marginBottom: 16 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0E1116", marginBottom: 12 }}>✅ Ventajas de {comp.name}</h3>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                  {comp.competitorPros.map((pro) => (
                    <li key={pro} style={{ fontSize: 13, color: "#374151", display: "flex", gap: 8, alignItems: "flex-start" }}>
                      <span style={{ color: "#22c55e", flexShrink: 0, fontWeight: 700 }}>✓</span>
                      {pro}
                    </li>
                  ))}
                </ul>
              </div>
              <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "20px" }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0E1116", marginBottom: 12 }}>⚠️ Desventajas de {comp.name}</h3>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                  {comp.competitorCons.map((con) => (
                    <li key={con} style={{ fontSize: 13, color: "#374151", display: "flex", gap: 8, alignItems: "flex-start" }}>
                      <span style={{ color: "#ef4444", flexShrink: 0, fontWeight: 700 }}>✗</span>
                      {con}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Verdict */}
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 20px 64px" }}>
          <div style={{ background: "#0E1116", borderRadius: 16, padding: "28px 24px", border: "1px solid rgba(255,107,53,0.2)" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: ACCENT, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Veredicto</p>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.8)", lineHeight: 1.7 }}>{comp.verdict}</p>
          </div>
        </div>

        {/* More comparisons */}
        <div style={{ borderTop: "1px solid #e5e7eb", padding: "40px 20px" }}>
          <div style={{ maxWidth: 720, margin: "0 auto", textAlign: "center" }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>Más comparativas</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
              {Object.values(competitors)
                .filter((c) => c.slug !== slug)
                .map((c) => (
                  <Link key={c.slug} href={`/vs/${c.slug}`} style={{ padding: "8px 16px", borderRadius: 99, background: "#fff", border: "1px solid #e5e7eb", fontSize: 13, fontWeight: 600, color: "#374151", textDecoration: "none" }}>
                    Takefyy vs {c.name}
                  </Link>
                ))}
              <Link href="/software-restaurantes" style={{ padding: "8px 16px", borderRadius: 99, background: "#fff", border: "1px solid #e5e7eb", fontSize: 13, fontWeight: 600, color: "#374151", textDecoration: "none" }}>
                💻 Software para Restaurantes
              </Link>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div style={{ background: "#0E1116", padding: "64px 20px", textAlign: "center" }}>
          <h2 style={{ fontFamily: "var(--font-anton)", fontSize: "clamp(1.8rem, 4vw, 2.6rem)", color: "#fff", marginBottom: 16 }}>
            Probá Takefyy gratis
          </h2>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 15, marginBottom: 28 }}>14 días gratis. Sin tarjeta. Sin contrato.</p>
          <a href="/signup" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "15px 36px", borderRadius: 99, background: ACCENT, color: "#fff", fontWeight: 700, fontSize: 16, textDecoration: "none" }}>
            Empezar gratis →
          </a>
        </div>
      </div>
    </>
  );
}
