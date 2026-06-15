import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts } from "@/lib/blog";

export const metadata: Metadata = {
  metadataBase: new URL("https://takefyy.com"),
  title: "Blog — Takefyy | Consejos para restaurantes argentinos",
  description:
    "Guías, comparativas y consejos para dueños de restaurantes en Argentina. Menú digital, pedidos por WhatsApp, cómo vender más sin comisiones.",
  alternates: { canonical: "https://takefyy.com/blog" },
  openGraph: {
    title: "Blog Takefyy — Consejos para restaurantes argentinos",
    description:
      "Guías y consejos para dueños de restaurantes. Menú digital, pedidos por WhatsApp, cómo crecer sin Rappi.",
    url: "https://takefyy.com/blog",
    siteName: "Takefyy",
    locale: "es_AR",
    type: "website",
  },
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--brand-cream)",
        fontFamily: "var(--font-sans)",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "#0E1116",
          padding: "80px 20px 64px",
          textAlign: "center",
        }}
      >
        <Link
          href="/"
          style={{
            display: "inline-block",
            marginBottom: 32,
            color: "var(--accent)",
            fontSize: 13,
            fontWeight: 600,
            textDecoration: "none",
            letterSpacing: "0.05em",
          }}
        >
          ← Volver a Takefyy
        </Link>
        <p
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "var(--accent)",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            marginBottom: 16,
          }}
        >
          Blog
        </p>
        <h1
          style={{
            fontFamily: "var(--font-anton)",
            fontSize: "clamp(2.2rem, 5vw, 3.8rem)",
            color: "#fff",
            letterSpacing: "0.01em",
            lineHeight: 1.05,
            marginBottom: 16,
          }}
        >
          Recursos para tu restaurante
        </h1>
        <p
          style={{
            fontSize: 16,
            color: "rgba(255,255,255,0.55)",
            maxWidth: 500,
            margin: "0 auto",
            lineHeight: 1.7,
          }}
        >
          Guías prácticas, comparativas y consejos para vender más sin pagar
          comisiones a terceros.
        </p>
      </div>

      {/* Articles */}
      <div
        style={{
          maxWidth: 760,
          margin: "0 auto",
          padding: "64px 20px 100px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              style={{ textDecoration: "none" }}
            >
              <article
                style={{
                  background: "#fff",
                  border: "1px solid var(--border)",
                  borderRadius: 16,
                  padding: "28px 32px",
                  transition: "box-shadow 0.2s, border-color 0.2s",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow =
                    "0 8px 32px rgba(0,0,0,0.08)";
                  (e.currentTarget as HTMLElement).style.borderColor =
                    "rgba(255,107,53,0.3)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = "none";
                  (e.currentTarget as HTMLElement).style.borderColor =
                    "var(--border)";
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 14,
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "var(--accent)",
                      background: "rgba(255,107,53,0.08)",
                      border: "1px solid rgba(255,107,53,0.18)",
                      borderRadius: 99,
                      padding: "3px 10px",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {post.category}
                  </span>
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    {post.readingTime} min de lectura
                  </span>
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    ·
                  </span>
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    {new Date(post.date).toLocaleDateString("es-AR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <h2
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    lineHeight: 1.3,
                    marginBottom: 10,
                  }}
                >
                  {post.title}
                </h2>
                <p
                  style={{
                    fontSize: 14,
                    color: "var(--text-secondary)",
                    lineHeight: 1.7,
                    marginBottom: 16,
                  }}
                >
                  {post.description}
                </p>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--accent)",
                  }}
                >
                  Leer artículo →
                </span>
              </article>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
