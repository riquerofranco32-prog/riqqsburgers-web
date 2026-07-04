"use client";

import { useMemo, useState } from "react";
import { Search, Users } from "lucide-react";
import type { CustomerSummary } from "@/lib/customers";

function fmtARS(n: number) {
  return "$ " + n.toLocaleString("es-AR");
}

function fmtFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

type SortKey = "spent" | "orders" | "recent";

export function CustomersTable({
  customers,
}: {
  customers: CustomerSummary[];
}) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("spent");

  const filtered = useMemo(() => {
    let list = customers;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.phone?.toLowerCase().includes(q),
      );
    }
    return [...list].sort((a, b) => {
      if (sort === "orders") return b.ordersCount - a.ordersCount;
      if (sort === "recent")
        return (
          new Date(b.lastOrderAt).getTime() - new Date(a.lastOrderAt).getTime()
        );
      return b.totalSpent - a.totalSpent;
    });
  }, [customers, search, sort]);

  if (customers.length === 0) {
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
        <Users
          style={{ width: 32, height: 32, margin: "0 auto 8px", opacity: 0.5 }}
        />
        <p style={{ fontSize: 14 }}>
          Todavía no hay clientes con datos de contacto en los pedidos.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "var(--dash-surface)",
        border: "1px solid var(--dash-border)",
        borderRadius: 16,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid var(--dash-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <h2
          style={{ fontSize: 15, fontWeight: 700, color: "var(--dash-text)" }}
        >
          {customers.length} cliente{customers.length !== 1 ? "s" : ""}
        </h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <div style={{ position: "relative", minWidth: 200 }}>
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
              placeholder="Buscar por nombre o teléfono..."
              style={{
                background: "var(--dash-surface-2)",
                border: "1px solid var(--dash-border)",
                borderRadius: 8,
                paddingLeft: 30,
                paddingRight: 10,
                paddingTop: 8,
                paddingBottom: 8,
                fontSize: 16,
                color: "var(--dash-text)",
                outline: "none",
                width: "100%",
              }}
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            style={{
              background: "var(--dash-surface-2)",
              border: "1px solid var(--dash-border)",
              borderRadius: 8,
              padding: "8px 10px",
              fontSize: 13,
              color: "var(--dash-text)",
              outline: "none",
            }}
          >
            <option value="spent">Mayor gasto</option>
            <option value="orders">Más pedidos</option>
            <option value="recent">Más reciente</option>
          </select>
        </div>
      </div>

      {/* List */}
      <div>
        {filtered.map((c) => (
          <div
            key={c.key}
            style={{
              padding: "14px 20px",
              borderBottom: "1px solid var(--dash-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div style={{ minWidth: 0 }}>
              <p
                style={{
                  margin: 0,
                  fontSize: 14,
                  fontWeight: 700,
                  color: "var(--dash-text)",
                }}
              >
                {c.name}
              </p>
              <p
                style={{
                  margin: "2px 0 0",
                  fontSize: 12,
                  color: "var(--dash-muted)",
                }}
              >
                {c.phone ? (
                  <a
                    href={`tel:${c.phone}`}
                    style={{ color: "var(--accent)", textDecoration: "none" }}
                  >
                    {c.phone}
                  </a>
                ) : (
                  "Sin teléfono"
                )}
                {" · "}
                {c.ordersCount} pedido{c.ordersCount !== 1 ? "s" : ""}
                {" · "}
                Último: {fmtFecha(c.lastOrderAt)}
              </p>
            </div>
            <span
              style={{
                fontWeight: 800,
                fontSize: 15,
                color: "var(--accent)",
                flexShrink: 0,
              }}
            >
              {fmtARS(c.totalSpent)}
            </span>
          </div>
        ))}
        {filtered.length === 0 && (
          <div
            style={{
              padding: "40px 20px",
              textAlign: "center",
              color: "var(--dash-muted)",
              fontSize: 14,
            }}
          >
            Sin resultados para esa búsqueda
          </div>
        )}
      </div>
    </div>
  );
}
