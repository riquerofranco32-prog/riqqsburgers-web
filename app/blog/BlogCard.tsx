"use client";

import { useState } from "react";
import type { BlogPost } from "@/lib/blog";

const CATEGORY_PALETTE: Record<string, { bg: string; color: string; glow: string }> = {
  Guías:       { bg: "rgba(255,107,53,0.12)", color: "#ff6b35", glow: "rgba(255,107,53,0.25)" },
  Comparativas:{ bg: "rgba(99,179,237,0.12)", color: "#63b3ed", glow: "rgba(99,179,237,0.25)" },
  Estrategias: { bg: "rgba(104,211,145,0.12)", color: "#68d391", glow: "rgba(104,211,145,0.25)" },
  Tips:        { bg: "rgba(183,148,246,0.12)", color: "#b794f6", glow: "rgba(183,148,246,0.25)" },
};

function getCategoryStyle(cat: string) {
  return CATEGORY_PALETTE[cat] ?? { bg: "rgba(160,160,160,0.1)", color: "#a0aec0", glow: "rgba(160,160,160,0.2)" };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-AR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function BlogCard({ post }: { post: BlogPost }) {
  const [hovered, setHovered] = useState(false);
  const catStyle = getCategoryStyle(post.category);

  return (
    <article
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        background: hovered
          ? "linear-gradient(135deg, #ffffff 0%, #fefefe 100%)"
          : "#fff",
        border: `1px solid ${hovered ? catStyle.glow : "rgba(0,0,0,0.07)"}`,
        borderRadius: 20,
        padding: "28px 32px",
        cursor: "pointer",
        transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        boxShadow: hovered
          ? `0 20px 48px rgba(0,0,0,0.09), 0 0 0 1px ${catStyle.glow}`
          : "0 2px 8px rgba(0,0,0,0.04)",
        transform: hovered ? "translateY(-3px)" : "translateY(0)",
        overflow: "hidden",
      }}
    >
      {/* Accent strip */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: `linear-gradient(90deg, ${catStyle.color}, transparent)`,
          opacity: hovered ? 1 : 0,
          transition: "opacity 0.3s ease",
          borderRadius: "20px 20px 0 0",
        }}
      />

      {/* Meta row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 10,
          marginBottom: 16,
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            fontSize: 11,
            fontWeight: 700,
            color: catStyle.color,
            background: catStyle.bg,
            border: `1px solid ${catStyle.glow}`,
            borderRadius: 99,
            padding: "4px 11px",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            transition: "background 0.2s",
          }}
        >
          {post.category}
        </span>

        <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#94a3b8" }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
          </svg>
          {post.readingTime} min de lectura
        </span>

        <span style={{ fontSize: 12, color: "#cbd5e1" }}>·</span>

        <span style={{ fontSize: 12, color: "#94a3b8" }}>
          {formatDate(post.date)}
        </span>
      </div>

      {/* Title */}
      <h2
        style={{
          fontSize: "clamp(16px, 2.2vw, 20px)",
          fontWeight: 800,
          color: hovered ? "#0f172a" : "#1e293b",
          lineHeight: 1.3,
          marginBottom: 10,
          letterSpacing: "-0.02em",
          transition: "color 0.2s",
        }}
      >
        {post.title}
      </h2>

      {/* Description */}
      <p
        style={{
          fontSize: 14,
          color: "#64748b",
          lineHeight: 1.75,
          marginBottom: 20,
        }}
      >
        {post.description}
      </p>

      {/* CTA */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontSize: 13,
          fontWeight: 700,
          color: catStyle.color,
          transition: "gap 0.2s ease",
        }}
      >
        Leer artículo
        <span
          style={{
            display: "inline-block",
            transition: "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
            transform: hovered ? "translateX(5px)" : "translateX(0)",
            fontSize: 15,
          }}
        >
          →
        </span>
      </div>
    </article>
  );
}
