import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts } from "@/lib/blog";
import { BlogCard } from "./BlogCard";

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
              <BlogCard post={post} />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
