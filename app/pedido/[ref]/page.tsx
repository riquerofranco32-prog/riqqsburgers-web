import { createServerClient } from "@/lib/supabase";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { Order } from "@/types/supabase";
import Link from "next/link";
import TrackingClient from "./TrackingClient";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ ref: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { ref } = await params;
  return {
    title: `Pedido ${ref} — Takefyy`,
    robots: { index: false },
  };
}

const DELIVERY_LABEL: Record<string, string> = {
  domicilio: "Delivery",
  retiro: "Retiro en local",
  pickup: "Retiro en local",
  delivery: "Delivery",
};

function fmt(n: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n);
}

export default async function TrackingPage({ params }: Props) {
  const { ref } = await params;

  // Solo refs con formato válido (6 alfanuméricos)
  if (!/^[A-Z0-9]{4,10}$/i.test(ref)) notFound();

  const supabase = createServerClient();

  const { data: order, error } = await supabase
    .from("orders")
    .select(
      "id, order_ref, status, delivery_type, customer_name, items, subtotal, delivery_cost, total, created_at, tenant_id",
    )
    .eq("order_ref", ref.toUpperCase())
    .single();

  if (error || !order) notFound();

  const o = order as Order;

  // Obtener nombre del restaurante
  const { data: tenant } = await supabase
    .from("tenants")
    .select("name, slug, primary_color")
    .eq("id", o.tenant_id)
    .single();

  const deliveryLabel = DELIVERY_LABEL[o.delivery_type] ?? o.delivery_type;
  const accent = (tenant?.primary_color as string) ?? "#FF6B35";

  const orderDate = new Date(o.created_at).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const items = Array.isArray(o.items) ? o.items : [];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#FFFAF7",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "32px 16px 64px",
        fontFamily:
          "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      }}
    >
      {/* Header */}
      <div style={{ width: "100%", maxWidth: 480, marginBottom: 24 }}>
        <Link
          href={tenant ? `/${tenant.slug}` : "/"}
          style={{
            fontSize: 13,
            color: "#6B5B4E",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          ← {tenant?.name ?? "Volver al menú"}
        </Link>
      </div>

      <div
        style={{
          width: "100%",
          maxWidth: 480,
          background: "#FFFFFF",
          borderRadius: 20,
          boxShadow: "0 4px 32px rgba(0,0,0,0.08)",
          overflow: "hidden",
        }}
      >
        {/* Top band */}
        <div
          style={{
            background: accent,
            padding: "20px 24px",
          }}
        >
          <p
            style={{
              color: "rgba(255,255,255,0.75)",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: 4,
            }}
          >
            Número de pedido
          </p>
          <span
            style={{
              color: "#fff",
              fontSize: 30,
              fontWeight: 800,
              letterSpacing: "0.2em",
              fontFamily: "monospace",
            }}
          >
            {o.order_ref}
          </span>
        </div>

        <div style={{ padding: "20px 24px" }}>
          {/* Real-time tracking stepper */}
          <TrackingClient
            orderId={o.id}
            initialStatus={o.status}
            accent={accent}
          />

          {/* Info row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
              marginBottom: 20,
            }}
          >
            <div
              style={{
                background: "#F5F0EC",
                borderRadius: 12,
                padding: "12px 14px",
              }}
            >
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                  color: "#A8998C",
                  marginBottom: 4,
                }}
              >
                Tipo
              </p>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#1A1208" }}>
                {deliveryLabel}
              </p>
            </div>
            <div
              style={{
                background: "#F5F0EC",
                borderRadius: 12,
                padding: "12px 14px",
              }}
            >
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                  color: "#A8998C",
                  marginBottom: 4,
                }}
              >
                Fecha
              </p>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#1A1208" }}>
                {orderDate}
              </p>
            </div>
          </div>

          {/* Cliente */}
          {o.customer_name && (
            <div style={{ marginBottom: 20 }}>
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                  color: "#A8998C",
                  marginBottom: 6,
                }}
              >
                Cliente
              </p>
              <p style={{ fontSize: 14, color: "#1A1208" }}>
                {o.customer_name}
              </p>
            </div>
          )}

          {/* Items */}
          <div style={{ marginBottom: 20 }}>
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.07em",
                color: "#A8998C",
                marginBottom: 10,
              }}
            >
              Productos
            </p>
            <div
              style={{
                border: "1px solid #EDE8E3",
                borderRadius: 12,
                overflow: "hidden",
              }}
            >
              {items.map(
                (
                  item: {
                    product_id: string;
                    name: string;
                    price: number;
                    quantity: number;
                  },
                  idx: number,
                ) => (
                  <div
                    key={`${item.product_id}-${idx}`}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "10px 14px",
                      borderBottom:
                        idx < items.length - 1 ? "1px solid #EDE8E3" : "none",
                      background: idx % 2 === 0 ? "#FFFFFF" : "#FAFAF9",
                    }}
                  >
                    <span style={{ fontSize: 14, color: "#1A1208" }}>
                      <span
                        style={{
                          fontWeight: 700,
                          color: accent,
                          marginRight: 6,
                        }}
                      >
                        ×{item.quantity}
                      </span>
                      {item.name}
                    </span>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#6B5B4E",
                        flexShrink: 0,
                        marginLeft: 8,
                      }}
                    >
                      {fmt(item.price * item.quantity)}
                    </span>
                  </div>
                ),
              )}
            </div>
          </div>

          {/* Totales */}
          <div
            style={{
              background: "#F5F0EC",
              borderRadius: 12,
              padding: "14px 16px",
            }}
          >
            {o.delivery_cost > 0 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 13,
                  color: "#6B5B4E",
                  marginBottom: 8,
                }}
              >
                <span>Subtotal</span>
                <span>{fmt(o.subtotal)}</span>
              </div>
            )}
            {o.delivery_cost > 0 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 13,
                  color: "#6B5B4E",
                  marginBottom: 8,
                }}
              >
                <span>Envío</span>
                <span>{fmt(o.delivery_cost)}</span>
              </div>
            )}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 17,
                fontWeight: 800,
                color: "#1A1208",
                borderTop: o.delivery_cost > 0 ? "1px solid #EDE8E3" : "none",
                paddingTop: o.delivery_cost > 0 ? 10 : 0,
                marginTop: o.delivery_cost > 0 ? 6 : 0,
              }}
            >
              <span>Total</span>
              <span style={{ color: accent }}>{fmt(o.total)}</span>
            </div>
          </div>

          {/* Restaurante */}
          {tenant && (
            <div style={{ marginTop: 20, textAlign: "center" }}>
              <Link
                href={`/${tenant.slug}`}
                style={{
                  display: "inline-block",
                  fontSize: 13,
                  color: accent,
                  textDecoration: "none",
                  fontWeight: 600,
                  padding: "10px 20px",
                  border: `1px solid ${accent}40`,
                  borderRadius: 10,
                }}
              >
                Ver menú de {tenant.name}
              </Link>
            </div>
          )}
        </div>
      </div>

      <p
        style={{
          marginTop: 24,
          fontSize: 12,
          color: "#A8998C",
          textAlign: "center",
        }}
      >
        Powered by{" "}
        <a
          href="/"
          style={{ color: "#FF6B35", textDecoration: "none", fontWeight: 600 }}
        >
          Takefyy
        </a>
      </p>
    </div>
  );
}
