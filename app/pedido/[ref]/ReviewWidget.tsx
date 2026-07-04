"use client";

import { useState } from "react";

interface Props {
  orderRef: string;
  accent: string;
  alreadyReviewed: boolean;
}

export default function ReviewWidget({
  orderRef,
  accent,
  alreadyReviewed,
}: Props) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(alreadyReviewed);
  const [error, setError] = useState("");

  async function submit() {
    if (rating === 0) {
      setError("Elegí una calificación");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_ref: orderRef,
          rating,
          comment: comment.trim() || null,
        }),
      });
      if (res.ok || res.status === 409) {
        setSubmitted(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "No se pudo enviar la calificación");
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div
        style={{
          marginTop: 20,
          padding: "16px",
          borderRadius: 14,
          background: "#F7F3EE",
          textAlign: "center",
        }}
      >
        <p
          style={{ fontSize: 14, fontWeight: 700, color: "#1A1208", margin: 0 }}
        >
          ¡Gracias por tu opinión! 🎉
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        marginTop: 20,
        padding: "18px 16px",
        borderRadius: 14,
        background: "#F7F3EE",
      }}
    >
      <p
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: "#1A1208",
          margin: 0,
          marginBottom: 12,
          textAlign: "center",
        }}
      >
        ¿Cómo estuvo tu pedido?
      </p>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 6,
          marginBottom: 12,
        }}
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            onMouseEnter={() => setHoverRating(n)}
            onMouseLeave={() => setHoverRating(0)}
            aria-label={`${n} estrellas`}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 28,
              lineHeight: 1,
              color: (hoverRating || rating) >= n ? accent : "#D8D0C7",
              transition: "color 0.15s",
              padding: 2,
            }}
          >
            ★
          </button>
        ))}
      </div>
      {rating > 0 && (
        <>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Contanos algo más (opcional)"
            rows={2}
            maxLength={500}
            style={{
              width: "100%",
              boxSizing: "border-box",
              borderRadius: 10,
              border: "1px solid #E5DDD3",
              padding: "10px 12px",
              fontSize: 13,
              fontFamily: "inherit",
              resize: "vertical",
              marginBottom: 10,
            }}
          />
          <button
            onClick={submit}
            disabled={submitting}
            style={{
              width: "100%",
              padding: "11px",
              borderRadius: 10,
              border: "none",
              background: accent,
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              cursor: submitting ? "default" : "pointer",
              opacity: submitting ? 0.6 : 1,
            }}
          >
            {submitting ? "Enviando..." : "Enviar calificación"}
          </button>
        </>
      )}
      {error && (
        <p
          style={{
            color: "#ef4444",
            fontSize: 12,
            marginTop: 8,
            textAlign: "center",
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
}
