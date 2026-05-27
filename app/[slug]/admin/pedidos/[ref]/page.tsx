import { createServerClient } from "@/lib/supabase";
import { notFound } from "next/navigation";
import TicketActions from "@/components/admin/TicketActions";
import type { OrderItem } from "@/types/supabase";

export const dynamic = "force-dynamic";

export default async function OrderTicketPage({
  params,
}: {
  params: Promise<{ slug: string; ref: string }>;
}) {
  const { slug, ref } = await params;
  const supabase = createServerClient();

  const { data: tenantRow } = await supabase
    .from("tenants")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  const { data: order } = await supabase
    .from("orders")
    .select("*, tenants(name, address, whatsapp_number)")
    .eq("order_ref", ref.toUpperCase())
    .eq("tenant_id", tenantRow?.id ?? "")
    .maybeSingle();

  if (!order) notFound();

  const items = order.items as OrderItem[];
  const tenant = order.tenants as { name: string; address?: string } | null;
  const isDelivery = order.delivery_type === "delivery";

  const createdAt = new Date(order.created_at).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      style={{
        maxWidth: 420,
        margin: "0 auto",
        padding: "24px 20px",
        fontFamily: "system-ui, sans-serif",
        background: "white",
        color: "#000",
        minHeight: "100vh",
      }}
    >
      {/* Acciones — client component con onClick */}
      <TicketActions
        slug={slug}
        isDelivery={isDelivery}
        deliveryData={
          isDelivery
            ? {
                orderRef: order.order_ref,
                createdAt,
                customerName: order.customer_name ?? "",
                customerPhone: order.customer_phone ?? undefined,
                customerAddress: order.customer_address ?? "",
                items: items.map((item) => ({
                  quantity: item.quantity,
                  name: item.name,
                })),
                total: order.total,
                paymentMethod: order.payment_method,
                notes: order.notes ?? undefined,
              }
            : undefined
        }
      />

      {/* TICKET DEL RESTAURANTE */}
      <div id="restaurant-ticket" style={{ fontFamily: "monospace" }}>
        <div
          style={{
            textAlign: "center",
            borderBottom: "2px dashed #000",
            paddingBottom: 12,
            marginBottom: 12,
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 700 }}>
            {tenant?.name ?? slug.toUpperCase()}
          </div>
          {tenant?.address && (
            <div style={{ fontSize: 12, marginTop: 2 }}>{tenant.address}</div>
          )}
          <div style={{ fontSize: 11, color: "#666", marginTop: 4 }}>
            {createdAt}
          </div>
        </div>

        <div style={{ textAlign: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 12 }}>PEDIDO</div>
          <div
            style={{ fontSize: 32, fontWeight: 800, letterSpacing: "0.15em" }}
          >
            #{order.order_ref}
          </div>
        </div>

        <div
          style={{
            borderBottom: "1px dashed #000",
            paddingBottom: 10,
            marginBottom: 10,
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 4 }}>
            CLIENTE
          </div>
          {order.customer_name && (
            <div style={{ fontSize: 14 }}>{order.customer_name}</div>
          )}
          {order.customer_phone && (
            <div style={{ fontSize: 12 }}>{order.customer_phone}</div>
          )}
        </div>

        <div
          style={{
            borderBottom: "1px dashed #000",
            paddingBottom: 10,
            marginBottom: 10,
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 6 }}>
            ITEMS
          </div>
          {items.map((item, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 13,
                marginBottom: 3,
              }}
            >
              <span>
                {item.quantity}x {item.name}
              </span>
              <span>
                ${(item.price * item.quantity).toLocaleString("es-AR")}
              </span>
            </div>
          ))}
        </div>

        <div
          style={{
            borderBottom: "1px dashed #000",
            paddingBottom: 10,
            marginBottom: 10,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 12,
              marginBottom: 4,
            }}
          >
            <span>ENTREGA</span>
            <span>{isDelivery ? "🚚 DELIVERY" : "🏠 RETIRA EN LOCAL"}</span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 12,
            }}
          >
            <span>PAGO</span>
            <span>
              {order.payment_method === "cash"
                ? "💵 EFECTIVO"
                : "📲 TRANSFERENCIA"}
            </span>
          </div>
          {isDelivery && order.customer_address && (
            <div
              style={{
                fontSize: 12,
                marginTop: 8,
                padding: "6px 8px",
                background: "#f5f5f5",
                borderRadius: 4,
              }}
            >
              📍 {order.customer_address}
            </div>
          )}
        </div>

        {order.notes && (
          <div
            style={{
              borderBottom: "1px dashed #000",
              paddingBottom: 10,
              marginBottom: 10,
              fontSize: 12,
            }}
          >
            <span style={{ fontWeight: 700 }}>NOTA: </span>
            {order.notes}
          </div>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 20,
            fontWeight: 800,
            marginTop: 4,
          }}
        >
          <span>TOTAL</span>
          <span>${order.total.toLocaleString("es-AR")}</span>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; }
        }
      `}</style>
    </div>
  );
}
