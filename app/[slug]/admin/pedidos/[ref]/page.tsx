import { createServerClient } from "@/lib/supabase";
import { notFound } from "next/navigation";
import TicketActions from "@/components/admin/TicketActions";
import PrintButton from "@/components/admin/PrintButton";
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
        padding: "24px 20px 96px",
        fontFamily: "system-ui, sans-serif",
        background: "white",
        color: "#000",
        minHeight: "100vh",
        overflowY: "auto",
      }}
    >
      {/* Header fijo con ref + botón imprimir */}
      <div
        className="no-print"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              color: "#999",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Pedido
          </div>
          <div
            style={{ fontSize: 24, fontWeight: 800, letterSpacing: "0.1em" }}
          >
            #{order.order_ref}
          </div>
        </div>
        <PrintButton />
      </div>

      <TicketActions
        slug={slug}
        orderId={order.id}
        currentStatus={order.status}
        isDelivery={isDelivery}
        customerPhone={order.customer_phone ?? null}
        orderRef={order.order_ref ?? null}
        initialKitchenNotes={order.kitchen_notes ?? null}
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
      <div id="comanda-print" style={{ fontFamily: "monospace" }}>
        {/* Header restaurante */}
        <div
          style={{
            textAlign: "center",
            borderBottom: "2px dashed #000",
            paddingBottom: 12,
            marginBottom: 12,
          }}
        >
          <div style={{ fontSize: 20, fontWeight: 800 }}>
            {tenant?.name ?? slug.toUpperCase()}
          </div>
          {tenant?.address && (
            <div style={{ fontSize: 12, marginTop: 2 }}>{tenant.address}</div>
          )}
          <div style={{ fontSize: 11, color: "#666", marginTop: 4 }}>
            {createdAt}
          </div>
        </div>

        {/* Número de pedido */}
        <div style={{ textAlign: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 11, letterSpacing: "0.1em", color: "#555" }}>
            PEDIDO
          </div>
          <div
            style={{ fontSize: 36, fontWeight: 800, letterSpacing: "0.15em" }}
          >
            #{order.order_ref}
          </div>
        </div>

        {/* Cliente */}
        <div
          style={{
            borderBottom: "1px dashed #000",
            paddingBottom: 10,
            marginBottom: 10,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              marginBottom: 4,
              letterSpacing: "0.1em",
              color: "#555",
            }}
          >
            CLIENTE
          </div>
          {order.customer_name && (
            <div style={{ fontSize: 16, fontWeight: 700 }}>
              {order.customer_name}
            </div>
          )}
          {order.customer_phone && (
            <div style={{ fontSize: 14 }}>{order.customer_phone}</div>
          )}
        </div>

        {/* Items */}
        <div
          style={{
            borderBottom: "1px dashed #000",
            paddingBottom: 10,
            marginBottom: 10,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              marginBottom: 8,
              letterSpacing: "0.1em",
              color: "#555",
            }}
          >
            ITEMS
          </div>
          {items.map((item, i) => {
            const itemWithExtra = item as OrderItem & {
              selected_extra?: { name: string; price: number };
              addons?: Array<{ name: string; price: number }>;
            };
            const extraPrice = itemWithExtra.selected_extra?.price ?? 0;
            const addonsPrice = (itemWithExtra.addons ?? []).reduce(
              (s, a) => s + a.price,
              0,
            );
            return (
              <div
                key={i}
                style={{
                  marginBottom: 8,
                  paddingBottom: 8,
                  borderBottom:
                    i < items.length - 1 ? "1px solid #e5e5e5" : "none",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 16,
                    fontWeight: 600,
                  }}
                >
                  <span>
                    {item.quantity}x {item.name}
                  </span>
                  <span>
                    $
                    {(
                      (item.price + extraPrice + addonsPrice) *
                      item.quantity
                    ).toLocaleString("es-AR")}
                  </span>
                </div>
                {itemWithExtra.selected_extra && (
                  <div
                    style={{
                      fontSize: 13,
                      color: "#555",
                      marginTop: 2,
                      marginLeft: 8,
                    }}
                  >
                    + {itemWithExtra.selected_extra.name}
                    {itemWithExtra.selected_extra.price > 0 &&
                      ` (+$${itemWithExtra.selected_extra.price.toLocaleString("es-AR")})`}
                  </div>
                )}
                {itemWithExtra.addons && itemWithExtra.addons.length > 0 && (
                  <div
                    style={{
                      fontSize: 13,
                      color: "#555",
                      marginTop: 2,
                      marginLeft: 8,
                    }}
                  >
                    +{" "}
                    {itemWithExtra.addons
                      .map((a) =>
                        a.price > 0
                          ? `${a.name} (+$${a.price.toLocaleString("es-AR")})`
                          : a.name,
                      )
                      .join(", ")}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Entrega y pago */}
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
              fontSize: 13,
              marginBottom: 4,
            }}
          >
            <span style={{ fontWeight: 700 }}>ENTREGA</span>
            <span>{isDelivery ? "DELIVERY" : "RETIRA EN LOCAL"}</span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 13,
            }}
          >
            <span style={{ fontWeight: 700 }}>PAGO</span>
            <span>
              {order.payment_method === "cash" ? "EFECTIVO" : "TRANSFERENCIA"}
            </span>
          </div>
          {isDelivery && order.customer_address && (
            <div
              style={{
                fontSize: 13,
                marginTop: 8,
                padding: "8px 10px",
                background: "#f5f5f5",
                borderRadius: 4,
                fontWeight: 600,
              }}
            >
              {order.customer_address}
            </div>
          )}
        </div>

        {/* Notas — destacadas */}
        {order.notes && (
          <div
            style={{
              borderBottom: "1px dashed #000",
              paddingBottom: 10,
              marginBottom: 10,
              padding: "10px 12px",
              background: "#fff9c4",
              border: "2px solid #f0c040",
              borderRadius: 6,
            }}
          >
            <div
              style={{
                fontWeight: 800,
                fontSize: 11,
                marginBottom: 4,
                letterSpacing: "0.08em",
              }}
            >
              *** NOTA DEL CLIENTE ***
            </div>
            <div style={{ fontSize: 15 }}>{order.notes}</div>
          </div>
        )}

        {/* Totales */}
        <div style={{ marginTop: 4 }}>
          {isDelivery && (order.delivery_cost ?? 0) > 0 && (
            <>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 13,
                  marginBottom: 4,
                  color: "#555",
                }}
              >
                <span>Subtotal</span>
                <span>
                  ${(order.subtotal ?? order.total).toLocaleString("es-AR")}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 13,
                  marginBottom: 8,
                  color: "#555",
                }}
              >
                <span>Envío</span>
                <span>
                  ${(order.delivery_cost ?? 0).toLocaleString("es-AR")}
                </span>
              </div>
            </>
          )}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 22,
              fontWeight: 800,
            }}
          >
            <span>TOTAL</span>
            <span>${order.total.toLocaleString("es-AR")}</span>
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          <PrintButton label="Imprimir comanda" fullWidth />
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #comanda-print, #comanda-print * { visibility: visible !important; }
          .print\\:hidden { display: none !important; }
          #comanda-print {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 16px !important;
            background: white !important;
            color: black !important;
          }
          body { margin: 0; background: white !important; }
          @page { margin: 6mm; size: auto; }
        }
      `}</style>
    </div>
  );
}
