"use client";

import Link from "next/link";
import Image from "next/image";
import type { TenantWithStats } from "@/lib/tenants";

const PLAN_LABELS: Record<string, string> = {
  free: "Starter",
  pro: "Pro",
  premium: "Growth",
};

function daysAgo(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
}

function formatLastOrder(dateStr: string | null): string {
  if (!dateStr) return "Sin pedidos todavía";
  const days = daysAgo(dateStr);
  if (days <= 0) return "Último pedido: hoy";
  if (days === 1) return "Último pedido: ayer";
  return `Último pedido: hace ${days} días`;
}

interface RestaurantCardProps {
  tenant: TenantWithStats;
}

export default function RestaurantCard({ tenant }: RestaurantCardProps) {
  const initials = tenant.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  const isTrialing = tenant.subscriptionStatus === "trialing";
  const trialUrgent =
    isTrialing && tenant.trialDaysLeft !== null && tenant.trialDaysLeft <= 3;
  const isExpired = tenant.subscriptionStatus === "expired";
  const clienteDesde = new Date(tenant.created_at).toLocaleDateString("es-AR", {
    month: "short",
    year: "numeric",
  });

  return (
    <div
      onMouseEnter={(e) =>
        (e.currentTarget.style.borderColor = "rgba(255,107,53,0.4)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.borderColor = "var(--dash-border)")
      }
      style={{
        background: "var(--dash-surface)",
        border: "1px solid var(--dash-border)",
        borderRadius: 16,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        transition: "border-color 0.2s",
      }}
    >
      {/* Banner */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: 120,
          flexShrink: 0,
          background: tenant.banner_url
            ? "var(--dash-surface-2)"
            : `linear-gradient(135deg, ${tenant.primary_color ?? "var(--accent)"}, var(--dash-surface-2))`,
        }}
      >
        {tenant.banner_url && (
          <Image
            src={tenant.banner_url}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 340px"
            style={{ objectFit: "cover" }}
          />
        )}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.05) 55%, transparent 100%)",
          }}
        />
        <span
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            fontSize: 11,
            fontWeight: 600,
            padding: "3px 10px",
            borderRadius: 20,
            background: tenant.active
              ? "rgba(34,197,94,0.18)"
              : "rgba(239,68,68,0.18)",
            color: tenant.active ? "#4ade80" : "#f87171",
            border: `1px solid ${tenant.active ? "rgba(74,222,128,0.4)" : "rgba(248,113,113,0.4)"}`,
            backdropFilter: "blur(4px)",
          }}
        >
          {tenant.active ? "Activo" : "Inactivo"}
        </span>

        {/* Logo overlapping the banner */}
        <div
          style={{
            position: "absolute",
            left: 16,
            bottom: -30,
            width: 72,
            height: 72,
            borderRadius: 18,
            background: tenant.logo_url
              ? "var(--dash-surface)"
              : (tenant.primary_color ?? "var(--accent)"),
            border: "3px solid var(--dash-surface)",
            boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 22,
            fontWeight: 700,
            color: "#fff",
            overflow: "hidden",
          }}
        >
          {tenant.logo_url ? (
            <Image
              src={tenant.logo_url}
              alt={tenant.name}
              width={72}
              height={72}
              sizes="72px"
              style={{ objectFit: "cover" }}
            />
          ) : (
            initials
          )}
        </div>
      </div>

      <div
        style={{
          padding: "38px 20px 20px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
          flex: 1,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: "var(--dash-text)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {tenant.name}
          </div>
          <div
            style={{ fontSize: 12, color: "var(--dash-muted)", marginTop: 2 }}
          >
            <span style={{ fontFamily: "var(--font-mono)" }}>
              /{tenant.slug}
            </span>
          </div>
        </div>

        {tenant.tagline && (
          <p
            style={{
              fontSize: 13,
              color: "var(--dash-muted)",
              lineHeight: 1.5,
              margin: "-10px 0 0",
            }}
          >
            {tenant.tagline}
          </p>
        )}

        {/* Plan + trial */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              padding: "3px 10px",
              borderRadius: 20,
              background: "rgba(255,107,53,0.1)",
              color: "var(--accent)",
              border: "1px solid rgba(255,107,53,0.2)",
            }}
          >
            {PLAN_LABELS[tenant.plan] ?? tenant.plan}
          </span>
          {isTrialing && tenant.trialDaysLeft !== null && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                padding: "3px 10px",
                borderRadius: 20,
                background: trialUrgent
                  ? "rgba(239,68,68,0.12)"
                  : "rgba(217,119,6,0.12)",
                color: trialUrgent ? "#ef4444" : "#d97706",
                border: `1px solid ${trialUrgent ? "rgba(239,68,68,0.25)" : "rgba(217,119,6,0.25)"}`,
              }}
            >
              ⏳{" "}
              {tenant.trialDaysLeft === 0
                ? "Trial vence hoy"
                : `${tenant.trialDaysLeft} día${tenant.trialDaysLeft === 1 ? "" : "s"} de trial`}
            </span>
          )}
          {isExpired && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                padding: "3px 10px",
                borderRadius: 20,
                background: "rgba(239,68,68,0.12)",
                color: "#ef4444",
                border: "1px solid rgba(239,68,68,0.25)",
              }}
            >
              Trial vencido
            </span>
          )}
        </div>

        {/* Stats */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 12,
            color: "var(--dash-muted)",
            paddingTop: 4,
            borderTop: "1px solid var(--dash-border)",
          }}
        >
          <span>
            {tenant.productCount} producto{tenant.productCount === 1 ? "" : "s"}
          </span>
          <span>
            {tenant.orderCount} pedido{tenant.orderCount === 1 ? "" : "s"}
          </span>
          <span>Cliente desde {clienteDesde}</span>
        </div>
        <p
          style={{
            fontSize: 11,
            color: "var(--dash-muted)",
            margin: "-10px 0 0",
          }}
        >
          {formatLastOrder(tenant.lastOrderAt)}
        </p>

        {/* Actions */}
        <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
          <Link
            href={`/${tenant.slug}`}
            target="_blank"
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "var(--dash-text)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "var(--dash-muted)")
            }
            style={{
              flex: 1,
              textAlign: "center",
              padding: "8px 0",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 500,
              background: "var(--dash-surface-2)",
              color: "var(--dash-muted)",
              textDecoration: "none",
              border: "1px solid var(--dash-border)",
              transition: "color 0.15s",
            }}
          >
            Ver menú ↗
          </Link>
          <Link
            href={`/${tenant.slug}/admin`}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "var(--dash-text)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "var(--dash-muted)")
            }
            style={{
              flex: 1,
              textAlign: "center",
              padding: "8px 0",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 500,
              background: "var(--dash-surface-2)",
              color: "var(--dash-muted)",
              textDecoration: "none",
              border: "1px solid var(--dash-border)",
              transition: "color 0.15s",
            }}
          >
            Panel admin ↗
          </Link>
          <Link
            href={`/${tenant.slug}/admin/configuracion`}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(255,107,53,0.18)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "rgba(255,107,53,0.1)")
            }
            style={{
              flex: 1,
              textAlign: "center",
              padding: "8px 0",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              background: "rgba(255,107,53,0.1)",
              color: "var(--accent)",
              textDecoration: "none",
              border: "1px solid rgba(255,107,53,0.2)",
              transition: "background 0.15s",
            }}
          >
            Editar
          </Link>
        </div>
      </div>
    </div>
  );
}
