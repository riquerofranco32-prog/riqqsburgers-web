"use client";

import { useMemo, useState } from "react";
import { Star } from "lucide-react";
import type { Review } from "@/types/supabase";

function fmtFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Argentina/Buenos_Aires",
  });
}

function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div style={{ display: "flex", gap: 1 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          fill={n <= rating ? "#facc15" : "none"}
          color={n <= rating ? "#facc15" : "#52525b"}
        />
      ))}
    </div>
  );
}

type FilterKey = "all" | 1 | 2 | 3 | 4 | 5;

export function ReviewsAdmin({ reviews }: { reviews: Review[] }) {
  const [filter, setFilter] = useState<FilterKey>("all");

  const { avg, distribution } = useMemo(() => {
    if (reviews.length === 0) return { avg: 0, distribution: [0, 0, 0, 0, 0] };
    const dist = [0, 0, 0, 0, 0];
    let sum = 0;
    for (const r of reviews) {
      dist[r.rating - 1] += 1;
      sum += r.rating;
    }
    return { avg: sum / reviews.length, distribution: dist };
  }, [reviews]);

  const filtered =
    filter === "all" ? reviews : reviews.filter((r) => r.rating === filter);

  if (reviews.length === 0) {
    return (
      <div
        style={{
          background: "var(--dash-surface)",
          border: "1px solid var(--dash-border)",
          borderRadius: 16,
          padding: "56px 20px",
          textAlign: "center",
          color: "var(--dash-muted)",
        }}
      >
        <Star
          style={{ width: 32, height: 32, margin: "0 auto 8px", opacity: 0.5 }}
        />
        <p style={{ fontSize: 14 }}>Todavía no hay reseñas de clientes.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Resumen */}
      <div
        style={{
          background: "var(--dash-surface)",
          border: "1px solid var(--dash-border)",
          borderRadius: 16,
          padding: 20,
          display: "flex",
          alignItems: "center",
          gap: 24,
          flexWrap: "wrap",
          boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <p
            style={{
              fontSize: 32,
              fontWeight: 800,
              color: "var(--dash-text)",
              lineHeight: 1,
            }}
          >
            {avg.toFixed(1)}
          </p>
          <Stars rating={Math.round(avg)} />
          <p style={{ fontSize: 11, color: "var(--dash-muted)", marginTop: 4 }}>
            {reviews.length} reseña{reviews.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div
          style={{
            flex: 1,
            minWidth: 180,
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          {[5, 4, 3, 2, 1].map((star) => {
            const count = distribution[star - 1];
            const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
            return (
              <button
                key={star}
                onClick={() =>
                  setFilter(filter === star ? "all" : (star as FilterKey))
                }
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  opacity: filter === "all" || filter === star ? 1 : 0.5,
                  transition: "opacity 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.opacity =
                    filter === "all" || filter === star ? "1" : "0.5")
                }
              >
                <span
                  style={{
                    fontSize: 11,
                    color: "var(--dash-muted)",
                    width: 12,
                  }}
                >
                  {star}
                </span>
                <div
                  style={{
                    flex: 1,
                    height: 6,
                    borderRadius: 999,
                    background: "var(--dash-surface-2)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${pct}%`,
                      height: "100%",
                      background: filter === star ? "var(--accent)" : "#facc15",
                    }}
                  />
                </div>
                <span
                  style={{
                    fontSize: 11,
                    color: "var(--dash-muted)",
                    width: 20,
                    textAlign: "right",
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Lista */}
      <div
        style={{
          background: "var(--dash-surface)",
          border: "1px solid var(--dash-border)",
          borderRadius: 16,
          overflow: "hidden",
          boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
        }}
      >
        {filter !== "all" && (
          <div
            style={{
              padding: "10px 20px",
              borderBottom: "1px solid var(--dash-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: 12,
              color: "var(--dash-muted)",
            }}
          >
            Filtrando por {filter} estrella{filter !== 1 ? "s" : ""}
            <button
              onClick={() => setFilter("all")}
              style={{
                background: "none",
                border: "none",
                color: "var(--accent)",
                cursor: "pointer",
                fontWeight: 600,
                textDecoration: "none",
                transition: "text-decoration-color 0.15s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.textDecoration = "underline")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.textDecoration = "none")
              }
            >
              Ver todas
            </button>
          </div>
        )}
        {filtered.map((r) => (
          <div
            key={r.id}
            style={{
              padding: "14px 20px",
              borderBottom: "1px solid var(--dash-border)",
              display: "flex",
              flexDirection: "column",
              gap: 6,
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "var(--dash-surface-2)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Stars rating={r.rating} />
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--dash-text)",
                  }}
                >
                  {r.customer_name ?? "Cliente anónimo"}
                </span>
              </div>
              <span
                style={{
                  fontSize: 11,
                  color: "var(--dash-muted)",
                  flexShrink: 0,
                }}
              >
                {fmtFecha(r.created_at)}
              </span>
            </div>
            {r.comment && (
              <p
                style={{ fontSize: 13, color: "var(--dash-muted)", margin: 0 }}
              >
                &ldquo;{r.comment}&rdquo;
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
