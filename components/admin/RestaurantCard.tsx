"use client";

import Link from "next/link";
import Image from "next/image";

interface RestaurantCardProps {
  tenant: {
    id: string;
    name: string;
    slug: string;
    tagline?: string | null;
    active: boolean;
    primary_color?: string | null;
    logo_url?: string | null;
  };
}

export default function RestaurantCard({ tenant }: RestaurantCardProps) {
  const initials = tenant.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

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
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 16,
        transition: "border-color 0.2s",
      }}
    >
      {/* Logo + name */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: tenant.logo_url
              ? "transparent"
              : (tenant.primary_color ?? "var(--accent)"),
            border: "2px solid var(--dash-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 14,
            fontWeight: 700,
            color: "#fff",
            flexShrink: 0,
            overflow: "hidden",
          }}
        >
          {tenant.logo_url ? (
            <Image
              src={tenant.logo_url}
              alt={tenant.name}
              width={48}
              height={48}
              sizes="48px"
              style={{ objectFit: "cover" }}
            />
          ) : (
            initials
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 15,
              fontWeight: 600,
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
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            padding: "3px 10px",
            borderRadius: 20,
            flexShrink: 0,
            background: tenant.active
              ? "rgba(34,197,94,0.12)"
              : "rgba(239,68,68,0.12)",
            color: tenant.active ? "#22c55e" : "#ef4444",
            border: `1px solid ${tenant.active ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}`,
          }}
        >
          {tenant.active ? "Activo" : "Inactivo"}
        </span>
      </div>

      {tenant.tagline && (
        <p
          style={{
            fontSize: 13,
            color: "var(--dash-muted)",
            lineHeight: 1.5,
            margin: 0,
          }}
        >
          {tenant.tagline}
        </p>
      )}

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
  );
}
