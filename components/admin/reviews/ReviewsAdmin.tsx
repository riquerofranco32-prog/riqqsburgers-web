"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Star, MessageSquareReply, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import EmptyState from "@/components/admin/EmptyState";
import { adminInputStyle } from "@/components/ui/admin/AdminField";
import { AdminButton } from "@/components/ui/admin/AdminButton";
import type { Review } from "@/types/supabase";

export interface ReviewWithOrderRef extends Review {
  order_ref: string | null;
}

const MAX_REPLY = 500;

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

function ReplyBox({
  review,
  slug,
  onSaved,
}: {
  review: ReviewWithOrderRef;
  slug: string;
  onSaved: (reply: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(review.reply ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!draft.trim()) {
      toast.error("La respuesta no puede estar vacía");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/reviews/${review.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reply: draft.trim() }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(data.error ?? "Error al guardar la respuesta");
      }
      onSaved(draft.trim());
      setEditing(false);
      toast.success("Respuesta publicada");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "No se pudo guardar la respuesta",
      );
    } finally {
      setSaving(false);
    }
  }

  if (review.reply && !editing) {
    return (
      <div
        style={{
          marginTop: 4,
          padding: "8px 12px",
          borderRadius: 8,
          background: "var(--dash-surface-2)",
          borderLeft: "3px solid var(--accent)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "var(--accent)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Tu respuesta
          </span>
          <button
            onClick={() => {
              setDraft(review.reply ?? "");
              setEditing(true);
            }}
            style={{
              background: "none",
              border: "none",
              color: "var(--dash-muted)",
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
              padding: 0,
            }}
          >
            Editar
          </button>
        </div>
        <p
          style={{ fontSize: 13, color: "var(--dash-text)", margin: "4px 0 0" }}
        >
          {review.reply}
        </p>
      </div>
    );
  }

  return (
    <div
      style={{ marginTop: 4, display: "flex", flexDirection: "column", gap: 6 }}
    >
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        maxLength={MAX_REPLY}
        rows={2}
        placeholder="Escribí una respuesta pública para este cliente..."
        style={{ ...adminInputStyle, fontSize: 13, resize: "vertical" }}
      />
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <AdminButton onClick={() => void save()} disabled={saving}>
          <MessageSquareReply size={14} />
          {saving ? "Guardando..." : "Responder"}
        </AdminButton>
        {editing && (
          <button
            onClick={() => setEditing(false)}
            disabled={saving}
            style={{
              background: "none",
              border: "none",
              color: "var(--dash-muted)",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Cancelar
          </button>
        )}
      </div>
    </div>
  );
}

export function ReviewsAdmin({
  reviews: initialReviews,
  slug,
}: {
  reviews: ReviewWithOrderRef[];
  slug: string;
}) {
  const [reviews, setReviews] = useState(initialReviews);
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

  function handleReplySaved(id: string, reply: string) {
    setReviews((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, reply, replied_at: new Date().toISOString() } : r,
      ),
    );
  }

  if (reviews.length === 0) {
    return (
      <EmptyState
        icon={Star}
        title="Todavía no hay reseñas"
        description="Cuando tus clientes dejen su opinión, la vas a ver reflejada acá."
      />
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
        {filtered.length === 0 && (
          <EmptyState
            icon={Star}
            title="Sin reseñas de esa calificación"
            description={`Nadie dejó ${filter} estrella${filter !== 1 ? "s" : ""} todavía.`}
            action={{ label: "Ver todas", onClick: () => setFilter("all") }}
          />
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
            {r.order_ref && (
              <Link
                href={`/${slug}/admin/pedidos/${r.order_ref}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3,
                  width: "fit-content",
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--dash-muted)",
                  textDecoration: "none",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = "var(--accent)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "var(--dash-muted)")
                }
              >
                Ver pedido #{r.order_ref}
                <ArrowUpRight size={11} />
              </Link>
            )}
            <ReplyBox
              review={r}
              slug={slug}
              onSaved={(reply) => handleReplySaved(r.id, reply)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
