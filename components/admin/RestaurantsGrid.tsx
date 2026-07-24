"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";
import RestaurantCard from "@/components/admin/RestaurantCard";
import type { TenantWithStats } from "@/lib/tenants";

type FilterId = "all" | "active" | "inactive" | "expiring";

const FILTERS: { id: FilterId; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "active", label: "Activos" },
  { id: "expiring", label: "Vencen pronto" },
  { id: "inactive", label: "Inactivos" },
];

export default function RestaurantsGrid({
  tenants,
}: {
  tenants: TenantWithStats[];
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterId>("all");

  const q = search.trim().toLowerCase();
  const filtered = tenants.filter((t) => {
    if (
      q &&
      !t.name.toLowerCase().includes(q) &&
      !t.slug.toLowerCase().includes(q)
    )
      return false;
    if (filter === "active") return t.active;
    if (filter === "inactive") return !t.active;
    if (filter === "expiring")
      return t.active && t.trialDaysLeft !== null && t.trialDaysLeft <= 7;
    return true;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          alignItems: "center",
        }}
      >
        <div style={{ position: "relative", maxWidth: 320, flex: "1 1 220px" }}>
          <Search
            style={{
              position: "absolute",
              left: 10,
              top: "50%",
              transform: "translateY(-50%)",
              width: 14,
              height: 14,
              color: "var(--dash-muted)",
            }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o slug..."
            style={{
              width: "100%",
              background: "var(--dash-surface)",
              border: "1px solid var(--dash-border)",
              borderRadius: 8,
              paddingLeft: 30,
              paddingRight: search ? 30 : 10,
              paddingTop: 8,
              paddingBottom: 8,
              fontSize: 13,
              color: "var(--dash-text)",
              outline: "none",
            }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              aria-label="Limpiar búsqueda"
              style={{
                position: "absolute",
                right: 8,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--dash-muted)",
                display: "flex",
                padding: 0,
              }}
            >
              <X style={{ width: 12, height: 12 }} />
            </button>
          )}
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {FILTERS.map((f) => {
            const isActive = filter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                style={{
                  padding: "5px 12px",
                  borderRadius: 99,
                  fontSize: 11,
                  fontWeight: 700,
                  border: `1px solid ${isActive ? "var(--dash-accent-glow)" : "var(--dash-border)"}`,
                  background: isActive
                    ? "linear-gradient(135deg, var(--accent), #ff8c5a)"
                    : "var(--dash-surface)",
                  color: isActive ? "#fff" : "var(--dash-muted)",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "56px 0",
            color: "var(--dash-muted)",
            fontSize: 14,
          }}
        >
          Ningún restaurante coincide con la búsqueda o el filtro.
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 16,
          }}
        >
          {filtered.map((tenant) => (
            <RestaurantCard key={tenant.id} tenant={tenant} />
          ))}
        </div>
      )}
    </div>
  );
}
