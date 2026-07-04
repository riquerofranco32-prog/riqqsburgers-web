"use client";

import { useMemo, useState } from "react";
import { Search, Users, Gift, MessageCircle } from "lucide-react";
import { getCustomerTier, type CustomerSummary } from "@/lib/customers";
import { Toast } from "@/components/admin/Toast";

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

const TIER_META = {
  bronze: { label: "Bronce", emoji: "🥉", color: "#cd7f32" },
  silver: { label: "Frecuente", emoji: "🥈", color: "#a1a1aa" },
  gold: { label: "VIP", emoji: "🥇", color: "#facc15" },
} as const;

type SortKey = "spent" | "orders" | "recent";

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 6).toUpperCase();
}

export function CustomersTable({
  customers,
  slug,
}: {
  customers: CustomerSummary[];
  slug: string;
}) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("spent");
  const [toast, setToast] = useState<string | null>(null);
  const [rewardingKey, setRewardingKey] = useState<string | null>(null);
  const [rewardLinks, setRewardLinks] = useState<Record<string, string>>({});

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

  async function rewardCustomer(c: CustomerSummary) {
    setRewardingKey(c.key);
    const base = `GRACIAS${c.phone ? c.phone.slice(-4) : randomSuffix()}`;
    let code = base;
    let attempt = 0;
    try {
      // ponytail: si el código choca reintenta con sufijo random — no hace
      // falta más que un par de intentos, la colisión es rarísima.
      while (attempt < 3) {
        const res = await fetch("/api/coupons", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slug,
            code,
            discount_type: "percent",
            discount_value: 10,
            max_uses: 1,
          }),
        });
        if (res.ok) {
          const waText = encodeURIComponent(
            `¡Hola ${c.name}! Como agradecimiento por ser cliente nuestro, te regalamos un 10% de descuento en tu próximo pedido. Usá el código ${code} 🎉`,
          );
          const waLink = c.phone
            ? `https://wa.me/${c.phone.replace(/\D/g, "")}?text=${waText}`
            : null;
          setRewardLinks((prev) => ({ ...prev, [c.key]: code }));
          setToast(
            waLink
              ? `Cupón ${code} creado`
              : `Cupón ${code} creado (sin teléfono para enviarlo por WhatsApp)`,
          );
          if (waLink) window.open(waLink, "_blank");
          return;
        }
        if (res.status === 409) {
          code = `${base}${randomSuffix()}`;
          attempt++;
          continue;
        }
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        setToast(data.error ?? "Error al crear el cupón");
        return;
      }
      setToast("No se pudo generar un código único, probá de nuevo");
    } catch {
      setToast("Error al crear el cupón");
    } finally {
      setRewardingKey(null);
    }
  }

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
        {filtered.map((c) => {
          const tier = TIER_META[getCustomerTier(c.ordersCount)];
          const rewardCode = rewardLinks[c.key];
          return (
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
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
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
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "1px 8px",
                      borderRadius: 999,
                      color: tier.color,
                      background: `${tier.color}1a`,
                      border: `1px solid ${tier.color}4d`,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {tier.emoji} {tier.label}
                  </span>
                </div>
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
                {rewardCode && (
                  <p
                    style={{
                      margin: "4px 0 0",
                      fontSize: 11,
                      color: "#22c55e",
                      fontWeight: 600,
                    }}
                  >
                    ✓ Cupón {rewardCode} generado
                  </p>
                )}
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    fontWeight: 800,
                    fontSize: 15,
                    color: "var(--accent)",
                  }}
                >
                  {fmtARS(c.totalSpent)}
                </span>
                <button
                  onClick={() => rewardCustomer(c)}
                  disabled={rewardingKey === c.key}
                  title={
                    c.phone
                      ? "Genera un cupón de 10% y lo envía por WhatsApp"
                      : "Genera un cupón de 10% (sin teléfono para enviarlo)"
                  }
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "7px 12px",
                    background: "rgba(250,204,21,0.1)",
                    border: "1px solid rgba(250,204,21,0.3)",
                    color: "#facc15",
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    opacity: rewardingKey === c.key ? 0.5 : 1,
                  }}
                >
                  {c.phone ? (
                    <MessageCircle className="w-3.5 h-3.5" />
                  ) : (
                    <Gift className="w-3.5 h-3.5" />
                  )}
                  {rewardingKey === c.key ? "Generando..." : "Premiar"}
                </button>
              </div>
            </div>
          );
        })}
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

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}
