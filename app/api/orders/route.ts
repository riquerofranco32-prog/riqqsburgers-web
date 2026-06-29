import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { safeDbError } from "@/lib/db-error";
import { sendPushToTenant } from "@/lib/push";

// ponytail: in-memory rate limit per IP, resets on cold start. Upgrade to Upstash if abuse is reported.
const ipBucket = new Map<string, number[]>();
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 10;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const hits = (ipBucket.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (hits.length >= RATE_MAX) return false;
  hits.push(now);
  ipBucket.set(ip, hits);
  return true;
}

interface OrderItem {
  product_id: string;
  quantity: number;
  selected_extra?: { name: string } | null;
}

interface CreateOrderBody {
  tenant_id: string;
  items: OrderItem[];
  delivery_type: "pickup" | "delivery";
  payment_method: "cash" | "transfer";
  customer_name: string;
  customer_phone?: string | null;
  customer_address?: string | null;
  notes?: string | null;
}

function generateRef(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(6);
  return Array.from(bytes, (b: number) => chars[b % chars.length]).join("");
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Demasiados pedidos. Esperá un momento e intentá de nuevo." },
      { status: 429 },
    );
  }

  let body: CreateOrderBody;
  try {
    body = (await req.json()) as CreateOrderBody;
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const { tenant_id, items, delivery_type, payment_method, customer_name } =
    body;

  if (
    !tenant_id ||
    !items?.length ||
    !delivery_type ||
    !payment_method ||
    !customer_name
  ) {
    return NextResponse.json(
      { error: "Faltan campos requeridos" },
      { status: 400 },
    );
  }

  const MAX_ITEMS = 50;
  const MAX_QUANTITY_PER_ITEM = 99;
  const MAX_NAME = 100;
  const MAX_PHONE = 30;
  const MAX_ADDRESS = 200;
  const MAX_NOTES = 500;

  if (customer_name.trim().length > MAX_NAME) {
    return NextResponse.json(
      { error: "Nombre demasiado largo" },
      { status: 400 },
    );
  }
  if (body.customer_phone && body.customer_phone.length > MAX_PHONE) {
    return NextResponse.json(
      { error: "Teléfono demasiado largo" },
      { status: 400 },
    );
  }
  if (body.customer_address && body.customer_address.length > MAX_ADDRESS) {
    return NextResponse.json(
      { error: "Dirección demasiado larga" },
      { status: 400 },
    );
  }
  if (body.notes && body.notes.length > MAX_NOTES) {
    return NextResponse.json(
      { error: "Nota demasiado larga (máx. 500 caracteres)" },
      { status: 400 },
    );
  }

  if (items.length > MAX_ITEMS) {
    return NextResponse.json(
      { error: "Demasiados items en el pedido" },
      { status: 400 },
    );
  }
  for (const item of items) {
    if (item.quantity > MAX_QUANTITY_PER_ITEM) {
      return NextResponse.json(
        { error: "Cantidad máxima por producto: 99" },
        { status: 400 },
      );
    }
  }

  const supabase = createServerClient();

  // Verificar que el tenant existe y está activo
  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("id, slug, delivery_cost, active")
    .eq("id", tenant_id)
    .single();

  if (tenantError || !tenant) {
    return NextResponse.json(
      { error: "Restaurante no encontrado" },
      { status: 400 },
    );
  }

  if (!tenant.active) {
    return NextResponse.json(
      { error: "Este restaurante no está activo" },
      { status: 400 },
    );
  }

  // Obtener precios reales de la DB para cada producto
  const productIds = items.map((i) => i.product_id);

  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, name, price, available, extras")
    .eq("tenant_id", tenant_id)
    .in("id", productIds);

  if (productsError) {
    return NextResponse.json(
      { error: "Error al verificar productos" },
      { status: 500 },
    );
  }

  // Validar que todos los productos existen, pertenecen al tenant y están disponibles
  const productMap = new Map(products?.map((p) => [p.id, p]) ?? []);

  for (const item of items) {
    const product = productMap.get(item.product_id);
    if (!product) {
      return NextResponse.json(
        { error: `Producto no encontrado: ${item.product_id}` },
        { status: 400 },
      );
    }
    if (!product.available) {
      return NextResponse.json(
        { error: `Producto no disponible: ${product.name}` },
        { status: 400 },
      );
    }
    if (item.quantity < 1) {
      return NextResponse.json(
        { error: "La cantidad debe ser al menos 1" },
        { status: 400 },
      );
    }
  }

  // Calcular totales server-side con precios reales de la DB
  const subtotal = items.reduce((sum, item) => {
    const product = productMap.get(item.product_id)!;
    const productExtras =
      (product.extras as Array<{ name: string; price: number }>) ?? [];
    const extraPrice = item.selected_extra
      ? (productExtras.find((e) => e.name === item.selected_extra!.name)
          ?.price ?? 0)
      : 0;
    return sum + (product.price + extraPrice) * item.quantity;
  }, 0);

  const deliveryCost =
    delivery_type === "delivery" ? (tenant.delivery_cost ?? 0) : 0;
  const total = subtotal + deliveryCost;

  // Armar los items enriquecidos con nombre y precio real
  const enrichedItems = items.map((item) => {
    const product = productMap.get(item.product_id)!;
    const productExtras =
      (product.extras as Array<{ name: string; price: number }>) ?? [];
    const extraDef = item.selected_extra
      ? productExtras.find((e) => e.name === item.selected_extra!.name)
      : null;
    return {
      product_id: item.product_id,
      name: product.name,
      price: product.price,
      quantity: item.quantity,
      ...(extraDef
        ? { selected_extra: { name: extraDef.name, price: extraDef.price } }
        : {}),
    };
  });

  const orderRef = generateRef();

  const { data: order, error: insertError } = await supabase
    .from("orders")
    .insert({
      tenant_id,
      order_ref: orderRef,
      customer_name: customer_name.trim(),
      customer_phone: body.customer_phone || null,
      customer_address:
        delivery_type === "delivery" ? body.customer_address || null : null,
      delivery_type: delivery_type === "delivery" ? "domicilio" : "retiro",
      payment_method,
      notes: body.notes || null,
      items: enrichedItems,
      subtotal,
      delivery_cost: deliveryCost,
      total,
      status: "pending",
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json(
      { error: safeDbError(insertError, "Error al crear el pedido") },
      { status: 500 },
    );
  }

  // Fire-and-forget push — no bloquea la respuesta al cliente
  const itemCount = enrichedItems.reduce((s, i) => s + i.quantity, 0);
  sendPushToTenant(tenant_id, {
    title: "🛎️ Nuevo pedido",
    body: `${customer_name.trim()} · ${itemCount} ${itemCount === 1 ? "producto" : "productos"} · $${total.toLocaleString("es-AR")}`,
    url: `/${tenant.slug}/admin/pedidos`,
  }).catch(() => {});

  return NextResponse.json(
    {
      order_ref: order.order_ref,
      total,
      subtotal,
      delivery_cost: deliveryCost,
    },
    { status: 201 },
  );
}
