"use client";

import type { BlogPost } from "@/lib/blog";

export function BlogCard({ post }: { post: BlogPost }) {
  return (
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
        (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
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
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>·</span>
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
  );
}
