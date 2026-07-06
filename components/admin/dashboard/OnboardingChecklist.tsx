"use client";

import Link from "next/link";
import { CheckCircle2, Circle, QrCode, Rocket } from "lucide-react";

export interface OnboardingState {
  hasLogo: boolean;
  productCount: number;
  hasPhotos: boolean;
  hasHours: boolean;
}

const MIN_PRODUCTS = 3;

export function OnboardingChecklist({
  slug,
  state,
}: {
  slug: string;
  state: OnboardingState;
}) {
  const steps = [
    {
      done: state.hasLogo,
      label: "Subí tu logo",
      href: `/${slug}/admin/configuracion`,
    },
    {
      done: state.productCount >= MIN_PRODUCTS,
      label: `Cargá al menos ${MIN_PRODUCTS} productos`,
      href: `/${slug}/admin/productos`,
    },
    {
      done: state.hasPhotos,
      label: "Agregá fotos a tus productos",
      href: `/${slug}/admin/productos`,
    },
    {
      done: state.hasHours,
      label: "Configurá tus horarios",
      href: `/${slug}/admin/configuracion`,
    },
  ];

  const doneCount = steps.filter((s) => s.done).length;
  if (doneCount === steps.length) return null;

  return (
    <div
      className="stagger-item"
      style={{
        background: "var(--dash-surface)",
        border: "1px solid var(--dash-border)",
        borderRadius: 18,
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            background: "rgba(255,107,53,0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Rocket className="w-4 h-4" style={{ color: "var(--accent)" }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "var(--dash-text)",
            }}
          >
            Poné tu menú a punto
          </p>
          <p style={{ fontSize: 12, color: "var(--dash-muted)" }}>
            {doneCount} de {steps.length} pasos completados
          </p>
        </div>
        <span
          style={{
            fontSize: 13,
            fontWeight: 800,
            color: "var(--accent)",
            flexShrink: 0,
          }}
        >
          {Math.round((doneCount / steps.length) * 100)}%
        </span>
      </div>

      {/* Barra de progreso */}
      <div
        style={{
          height: 6,
          borderRadius: 999,
          background: "var(--dash-surface-2)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${(doneCount / steps.length) * 100}%`,
            background: "var(--accent)",
            borderRadius: 999,
            transition: "width 0.4s ease",
          }}
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {steps.map((step) =>
          step.done ? (
            <div
              key={step.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 10px",
                fontSize: 14,
                color: "var(--dash-muted)",
                textDecoration: "line-through",
              }}
            >
              <CheckCircle2
                className="w-4 h-4 flex-shrink-0"
                style={{ color: "#22c55e" }}
              />
              {step.label}
            </div>
          ) : (
            <Link
              key={step.label}
              href={step.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 10px",
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 600,
                color: "var(--dash-text)",
              }}
              className="hover:bg-[var(--dash-surface-2)] transition-colors"
            >
              <Circle
                className="w-4 h-4 flex-shrink-0"
                style={{ color: "var(--dash-muted)" }}
              />
              {step.label}
              <span
                style={{
                  marginLeft: "auto",
                  fontSize: 12,
                  color: "var(--accent)",
                  fontWeight: 700,
                }}
              >
                Ir →
              </span>
            </Link>
          ),
        )}
      </div>

      <Link
        href={`/${slug}/admin/qr`}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          padding: "10px 14px",
          borderRadius: 12,
          background: "var(--dash-surface-2)",
          border: "1px solid var(--dash-border)",
          fontSize: 13,
          fontWeight: 700,
          color: "var(--dash-text)",
        }}
      >
        <QrCode className="w-4 h-4" />
        Cuando termines, compartí tu QR
      </Link>
    </div>
  );
}
