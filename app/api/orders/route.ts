import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { safeDbError } from "@/lib/db-error";
import { sendPushToTenant } from "@/lib/push";
import { validateCoupon } from "@/lib/coupons";
import { computeEffectiveOpen, type BusinessHours } from "@/lib/businessHours";
import { resolveZoneByLocation, resolveDistancePrice } from "@/lib/delivery";
import { assignBranch, pickLeastBusyBranch } from "@/lib/branchAssignment";

// Estados que ya no cuentan como "en cola" para balancear demanda entre
// sucursales (ver components/admin/orders/utils.ts STATUS_META/aliases).
const TERMINAL_ORDER_STATUSES = ["delivered", "entregado", "cancelled"];

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
  addons?: Array<{ name: string }>;
  removed_ingredients?: string[];
  combined_with_product_id?: string | null;
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
  coupon_code?: string | null;
  delivery_lat?: number | null;
  delivery_lng?: number | null;
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
    .select(
      "id, slug, delivery_cost, active, is_open, business_hours, delivery_mode, latitude, longitude, delivery_out_of_range_msg, min_order_amount",
    )
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

  if (
    !computeEffectiveOpen(
      tenant.is_open ?? true,
      tenant.business_hours as BusinessHours | null,
    )
  ) {
    return NextResponse.json(
      { error: "El restaurante está cerrado en este momento" },
      { status: 400 },
    );
  }

  // Obtener precios reales de la DB para cada producto (+ el "otro sabor" de
  // los ítems mitad y mitad, que solo se usa para mostrar el nombre — el
  // precio siempre sale del producto principal, ya validado abajo)
  const productIds = Array.from(
    new Set([
      ...items.map((i) => i.product_id),
      ...items
        .map((i) => i.combined_with_product_id)
        .filter((id): id is string => !!id),
    ]),
  );

  const { data: products, error: productsError } = await supabase
    .from("products")
    .select(
      "id, name, price, available, extras, addons, stock_quantity, ingredients",
    )
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

  // Stock: un mismo producto puede aparecer en varias líneas del carrito
  // (distintos extras/addons) — se valida contra la cantidad total pedida.
  const requestedQtyByProduct = new Map<string, number>();
  for (const item of items) {
    requestedQtyByProduct.set(
      item.product_id,
      (requestedQtyByProduct.get(item.product_id) ?? 0) + item.quantity,
    );
  }
  for (const [productId, qty] of Array.from(requestedQtyByProduct)) {
    const product = productMap.get(productId)!;
    if (product.stock_quantity !== null && qty > product.stock_quantity) {
      return NextResponse.json(
        {
          error:
            product.stock_quantity === 0
              ? `Sin stock: ${product.name}`
              : `Solo quedan ${product.stock_quantity} unidades de ${product.name}`,
        },
        { status: 400 },
      );
    }
  }

  // Calcular totales server-side con precios reales de la DB
  const subtotal = items.reduce((sum, item) => {
    const product = productMap.get(item.product_id)!;
    const productExtras =
      (product.extras as Array<{ name: string; price: number }>) ?? [];
    const productAddons =
      (product.addons as Array<{ name: string; price: number }>) ?? [];
    const extraPrice = item.selected_extra
      ? (productExtras.find((e) => e.name === item.selected_extra!.name)
          ?.price ?? 0)
      : 0;
    const addonsPrice = (item.addons ?? []).reduce((s, a) => {
      const def = productAddons.find((pa) => pa.name === a.name);
      return s + (def?.price ?? 0);
    }, 0);
    return sum + (product.price + extraPrice + addonsPrice) * item.quantity;
  }, 0);

  if (
    delivery_type === "delivery" &&
    tenant.min_order_amount !== null &&
    subtotal < tenant.min_order_amount
  ) {
    return NextResponse.json(
      {
        error: `El monto mínimo para delivery es $${tenant.min_order_amount.toLocaleString("es-AR")}`,
      },
      { status: 400 },
    );
  }

  // Cupón: se revalida server-side con el subtotal real. El monto de
  // descuento que haya mostrado el checkout es solo informativo — nunca se
  // usa el valor que manda el cliente.
  let couponId: string | null = null;
  let discountAmount = 0;
  if (body.coupon_code) {
    const result = await validateCoupon(tenant_id, body.coupon_code, subtotal);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    couponId = result.coupon!.id;
    discountAmount = result.discountAmount!;
  }

  // Asignación de sucursal: cercanía + demanda si hay ubicación del cliente
  // (delivery con pin), demanda sola si no (retiro, o delivery en modo
  // fixed/none que no pide dirección). Ver lib/branchAssignment.ts.
  const { data: branches } = await supabase
    .from("branches")
    .select("id, name, latitude, longitude, delivery_mode, active")
    .eq("tenant_id", tenant_id)
    .eq("active", true);

  const { data: queuedOrders } = await supabase
    .from("orders")
    .select("branch_id")
    .eq("tenant_id", tenant_id)
    .not("branch_id", "is", null)
    .not("status", "in", `(${TERMINAL_ORDER_STATUSES.join(",")})`);

  const activeOrderCountByBranch: Record<string, number> = {};
  for (const o of queuedOrders ?? []) {
    if (!o.branch_id) continue;
    activeOrderCountByBranch[o.branch_id] =
      (activeOrderCountByBranch[o.branch_id] ?? 0) + 1;
  }

  const hasCustomerLocation =
    delivery_type === "delivery" &&
    typeof body.delivery_lat === "number" &&
    typeof body.delivery_lng === "number";

  const assignment = hasCustomerLocation
    ? assignBranch(
        body.delivery_lat as number,
        body.delivery_lng as number,
        branches ?? [],
        activeOrderCountByBranch,
      )
    : pickLeastBusyBranch(branches ?? [], activeOrderCountByBranch);

  if (!assignment.branchId) {
    return NextResponse.json(
      {
        error:
          assignment.error ??
          "No hay sucursales disponibles para procesar tu pedido",
      },
      { status: 400 },
    );
  }

  const assignedBranch = (branches ?? []).find(
    (b) => b.id === assignment.branchId,
  )!;

  // El precio de envío nunca viene del cliente — se recalcula acá con la
  // misma lógica pura que usa /api/delivery/quote, a partir del modo y las
  // zonas/rangos de la sucursal asignada (no del tenant entero: dos
  // sucursales del mismo tenant pueden tener zonas/rangos distintos).
  let deliveryCost = 0;
  let deliveryZoneName: string | null = null;
  let deliveryDistanceKm: number | null = null;

  if (delivery_type === "delivery") {
    if (
      assignedBranch.delivery_mode === "zones" &&
      typeof body.delivery_lat === "number" &&
      typeof body.delivery_lng === "number"
    ) {
      const { data: zones } = await supabase
        .from("delivery_zones")
        .select("id, name, price, lat, lng, radius_km")
        .eq("branch_id", assignedBranch.id)
        .eq("active", true);
      const result = resolveZoneByLocation(
        zones ?? [],
        body.delivery_lat,
        body.delivery_lng,
        tenant.delivery_out_of_range_msg,
      );
      if (result.outOfRange) {
        return NextResponse.json(
          { error: result.message ?? "Fuera del área de entrega" },
          { status: 400 },
        );
      }
      deliveryCost = result.price;
      deliveryZoneName = result.zoneName ?? null;
    } else if (
      assignedBranch.delivery_mode === "distance" &&
      typeof body.delivery_lat === "number" &&
      typeof body.delivery_lng === "number" &&
      assignedBranch.latitude !== null &&
      assignedBranch.longitude !== null
    ) {
      const { data: ranges } = await supabase
        .from("delivery_ranges")
        .select("max_km, price")
        .eq("branch_id", assignedBranch.id)
        .eq("active", true);
      const result = resolveDistancePrice(
        ranges ?? [],
        assignedBranch.latitude,
        assignedBranch.longitude,
        body.delivery_lat,
        body.delivery_lng,
        tenant.delivery_out_of_range_msg,
      );
      if (result.outOfRange) {
        return NextResponse.json(
          { error: result.message ?? "Fuera del área de entrega" },
          { status: 400 },
        );
      }
      deliveryDistanceKm = result.distanceKm ?? null;
      deliveryCost = result.price;
    } else if (assignedBranch.delivery_mode === "fixed") {
      deliveryCost = tenant.delivery_cost ?? 0;
    }
    // delivery_mode === 'none': deliveryCost se queda en 0 aunque el
    // cliente mande delivery_type "delivery" — el tenant no ofrece envío.
  }

  const total = subtotal + deliveryCost - discountAmount;

  // Armar los items enriquecidos con nombre y precio real
  const enrichedItems = items.map((item) => {
    const product = productMap.get(item.product_id)!;
    const productExtras =
      (product.extras as Array<{ name: string; price: number }>) ?? [];
    const productAddons =
      (product.addons as Array<{ name: string; price: number }>) ?? [];
    const extraDef = item.selected_extra
      ? productExtras.find((e) => e.name === item.selected_extra!.name)
      : null;
    const addonDefs = (item.addons ?? [])
      .map((a) => productAddons.find((pa) => pa.name === a.name))
      .filter((a): a is { name: string; price: number } => !!a);
    const productIngredients = (product.ingredients as string[]) ?? [];
    const removedIngredients = (item.removed_ingredients ?? []).filter((n) =>
      productIngredients.includes(n),
    );
    const combinedWithProduct = item.combined_with_product_id
      ? productMap.get(item.combined_with_product_id)
      : null;
    return {
      product_id: item.product_id,
      name: product.name,
      price: product.price,
      quantity: item.quantity,
      ...(extraDef
        ? { selected_extra: { name: extraDef.name, price: extraDef.price } }
        : {}),
      ...(addonDefs.length > 0 ? { addons: addonDefs } : {}),
      ...(removedIngredients.length > 0
        ? { removed_ingredients: removedIngredients }
        : {}),
      ...(combinedWithProduct
        ? {
            combined_with: {
              id: combinedWithProduct.id,
              name: combinedWithProduct.name,
            },
          }
        : {}),
    };
  });

  const orderRef = generateRef();

  const { data: order, error: insertError } = await supabase
    .from("orders")
    .insert({
      tenant_id,
      branch_id: assignment.branchId,
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
      delivery_address:
        delivery_type === "delivery" ? body.customer_address || null : null,
      delivery_lat:
        delivery_type === "delivery" ? (body.delivery_lat ?? null) : null,
      delivery_lng:
        delivery_type === "delivery" ? (body.delivery_lng ?? null) : null,
      delivery_zone_name: deliveryZoneName,
      delivery_distance_km: deliveryDistanceKm,
      total,
      status: "pending",
      coupon_code: body.coupon_code || null,
      discount_amount: discountAmount || null,
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json(
      { error: safeDbError(insertError, "Error al crear el pedido") },
      { status: 500 },
    );
  }

  // Best-effort: no bloquea la creación del pedido si falla.
  // ponytail: incremento no atómico (read-then-write), aceptable al volumen
  // actual; pasar a un RPC `increment` si dos pedidos con el mismo cupón
  // llegan a coincidir en el mismo instante con frecuencia.
  if (couponId) {
    const { data: couponRow } = await supabase
      .from("coupons")
      .select("uses")
      .eq("id", couponId)
      .maybeSingle();
    if (couponRow) {
      await supabase
        .from("coupons")
        .update({ uses: couponRow.uses + 1 })
        .eq("id", couponId);
    }
  }

  // Descuento de stock — mismo criterio best-effort/no-atómico que arriba.
  for (const [productId, qty] of Array.from(requestedQtyByProduct)) {
    const product = productMap.get(productId)!;
    if (product.stock_quantity === null) continue;
    const newStock = Math.max(product.stock_quantity - qty, 0);
    await supabase
      .from("products")
      .update({
        stock_quantity: newStock,
        ...(newStock === 0 ? { available: false } : {}),
      })
      .eq("id", productId);
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
      discount_amount: discountAmount || undefined,
    },
    { status: 201 },
  );
}
