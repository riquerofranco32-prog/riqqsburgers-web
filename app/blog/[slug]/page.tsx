import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getAllPosts, getPostBySlug } from "@/lib/blog";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: "No encontrado — Takefyy" };

  const url = `https://takefyy.com/blog/${post.slug}`;
  return {
    metadataBase: new URL("https://takefyy.com"),
    title: `${post.title} | Blog Takefyy`,
    description: post.description,
    keywords: post.keywords,
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description: post.description,
      url,
      siteName: "Takefyy",
      locale: "es_AR",
      type: "article",
      publishedTime: post.date,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const allPosts = getAllPosts().filter((p) => p.slug !== slug);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.date,
    author: {
      "@type": "Organization",
      name: "Takefyy",
      url: "https://takefyy.com",
    },
    publisher: {
      "@type": "Organization",
      name: "Takefyy",
      url: "https://takefyy.com",
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://takefyy.com/blog/${post.slug}`,
    },
  };

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
        {/* Header */}
        <div
          style={{
            background: "#0E1116",
            padding: "64px 20px 56px",
          }}
        >
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            <Link
              href="/blog"
              style={{
                display: "inline-block",
                marginBottom: 28,
                color: "rgba(255,255,255,0.45)",
                fontSize: 13,
                fontWeight: 500,
                textDecoration: "none",
              }}
            >
              ← Blog
            </Link>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 20,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--accent)",
                  background: "rgba(255,107,53,0.12)",
                  border: "1px solid rgba(255,107,53,0.25)",
                  borderRadius: 99,
                  padding: "3px 10px",
                  letterSpacing: "0.05em",
                }}
              >
                {post.category}
              </span>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
                {post.readingTime} min de lectura ·{" "}
                {new Date(post.date).toLocaleDateString("es-AR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>

            <h1
              style={{
                fontFamily: "var(--font-anton)",
                fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
                color: "#fff",
                letterSpacing: "0.01em",
                lineHeight: 1.1,
                marginBottom: 20,
              }}
            >
              {post.title}
            </h1>

            <p
              style={{
                fontSize: 16,
                color: "rgba(255,255,255,0.5)",
                lineHeight: 1.7,
                maxWidth: 580,
              }}
            >
              {post.description}
            </p>
          </div>
        </div>

        {/* Article body */}
        <div
          style={{ maxWidth: 720, margin: "0 auto", padding: "56px 20px 80px" }}
        >
          <div
            className="blog-content"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* CTA */}
          <div
            style={{
              marginTop: 56,
              padding: "32px 28px",
              background: "#0E1116",
              borderRadius: 16,
              border: "1px solid rgba(255,107,53,0.2)",
              textAlign: "center",
            }}
          >
            <p
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: "#fff",
                marginBottom: 8,
              }}
            >
              ¿Querés probarlo con tu restaurante?
            </p>
            <p
              style={{
                fontSize: 14,
                color: "rgba(255,255,255,0.5)",
                marginBottom: 24,
                lineHeight: 1.6,
              }}
            >
              14 días gratis. Sin tarjeta. Sin contrato.
            </p>
            <a
              href="https://wa.me/542994247985?text=Hola!%20Quiero%20probar%20Takefyy%20gratis%20🚀"
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
              Empezar gratis →
            </a>
          </div>

          {/* More articles */}
          {allPosts.length > 0 && (
            <div style={{ marginTop: 64 }}>
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
                Más artículos
              </p>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                {allPosts.slice(0, 2).map((p) => (
                  <Link
                    key={p.slug}
                    href={`/blog/${p.slug}`}
                    style={{
                      display: "block",
                      padding: "16px 20px",
                      background: "#fff",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      textDecoration: "none",
                    }}
                  >
                    <p
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: "var(--text-primary)",
                        marginBottom: 4,
                        lineHeight: 1.4,
                      }}
                    >
                      {p.title}
                    </p>
                    <span
                      style={{
                        fontSize: 12,
                        color: "var(--accent)",
                        fontWeight: 600,
                      }}
                    >
                      Leer →
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
