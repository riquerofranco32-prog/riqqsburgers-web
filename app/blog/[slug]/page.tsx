import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getAllPosts,
  getPostBySlug,
  getRelatedPosts,
} from "@/lib/blog";

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
  const ogImage = post.image ?? "/opengraph-image";

  return {
    metadataBase: new URL("https://takefyy.com"),
    title: `${post.title} | Blog Takefyy`,
    description: post.description,
    keywords: post.keywords,
    alternates: {
      canonical: url,
      types: { "application/rss+xml": "https://takefyy.com/feed.xml" },
    },
    openGraph: {
      title: post.title,
      description: post.description,
      url,
      siteName: "Takefyy",
      locale: "es_AR",
      type: "article",
      publishedTime: post.date,
      modifiedTime: post.dateModified ?? post.date,
      authors: ["https://takefyy.com"],
      section: post.category,
      tags: post.tags ?? post.keywords,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: [ogImage],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const relatedPosts = getRelatedPosts(slug, 3);
  const url = `https://takefyy.com/blog/${slug}`;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "@id": url,
      headline: post.title,
      description: post.description,
      datePublished: post.date,
      dateModified: post.dateModified ?? post.date,
      image: post.image
        ? `https://takefyy.com${post.image}`
        : "https://takefyy.com/opengraph-image",
      url,
      inLanguage: "es-AR",
      author: {
        "@type": "Organization",
        "@id": "https://takefyy.com/#organization",
        name: "Takefyy",
        url: "https://takefyy.com",
      },
      publisher: {
        "@type": "Organization",
        "@id": "https://takefyy.com/#organization",
        name: "Takefyy",
        url: "https://takefyy.com",
        logo: {
          "@type": "ImageObject",
          url: "https://takefyy.com/takefyy-logo.png",
        },
      },
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": url,
      },
      articleSection: post.category,
      keywords: post.keywords?.join(", "),
    },
    {
      "@context": "https://schema.org",
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
          name: "Blog",
          item: "https://takefyy.com/blog",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: post.title,
          item: url,
        },
      ],
    },
  ];

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
            {/* Breadcrumb */}
            <nav
              aria-label="Breadcrumb"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginBottom: 28,
                fontSize: 13,
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
              <Link
                href="/blog"
                style={{
                  color: "rgba(255,255,255,0.45)",
                  textDecoration: "none",
                }}
              >
                Blog
              </Link>
              <span style={{ color: "rgba(255,255,255,0.2)" }}>›</span>
              <span
                style={{ color: "rgba(255,255,255,0.55)" }}
                aria-current="page"
              >
                {post.category}
              </span>
            </nav>

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
                <time dateTime={post.date}>
                  {new Date(post.date).toLocaleDateString("es-AR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
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

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                  marginTop: 20,
                }}
              >
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      fontSize: 11,
                      color: "rgba(255,255,255,0.4)",
                      background: "rgba(255,255,255,0.06)",
                      borderRadius: 6,
                      padding: "2px 8px",
                    }}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Article body */}
        <div
          style={{ maxWidth: 720, margin: "0 auto", padding: "56px 20px 80px" }}
        >
          <article>
            <div
              className="blog-content"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </article>

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

          {/* Related articles */}
          {relatedPosts.length > 0 && (
            <aside style={{ marginTop: 64 }} aria-label="Artículos relacionados">
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
                Artículos relacionados
              </p>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                {relatedPosts.map((p) => (
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
            </aside>
          )}
        </div>
      </div>
    </>
  );
}
