import { describe, it, expect } from "vitest";

// ── Validation logic extracted from POST /api/orders ──────────────────────
// Tests the core business rules without hitting Supabase.

function validateOrderBody(body: {
  tenant_id?: unknown;
  items?: unknown;
  delivery_type?: unknown;
  payment_method?: unknown;
  customer_name?: unknown;
}): string | null {
  if (!body.tenant_id) return "Faltan campos requeridos";
  if (!Array.isArray(body.items) || body.items.length === 0)
    return "Faltan campos requeridos";
  if (!body.delivery_type) return "Faltan campos requeridos";
  if (!body.payment_method) return "Faltan campos requeridos";
  if (!body.customer_name) return "Faltan campos requeridos";
  return null;
}

function calculateTotal(
  items: { price: number; quantity: number }[],
  deliveryCost: number,
  deliveryType: "pickup" | "delivery",
): number {
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  return subtotal + (deliveryType === "delivery" ? deliveryCost : 0);
}

describe("POST /api/orders — validation", () => {
  it("rejects request missing required fields", () => {
    expect(validateOrderBody({})).toBe("Faltan campos requeridos");
    expect(validateOrderBody({ tenant_id: "abc" })).toBe(
      "Faltan campos requeridos",
    );
    expect(validateOrderBody({ tenant_id: "abc", items: [] })).toBe(
      "Faltan campos requeridos",
    );
  });

  it("accepts a valid order body", () => {
    expect(
      validateOrderBody({
        tenant_id: "uuid",
        items: [{ product_id: "p1", quantity: 2 }],
        delivery_type: "pickup",
        payment_method: "cash",
        customer_name: "Juan García",
      }),
    ).toBeNull();
  });
});

describe("POST /api/orders — total calculation", () => {
  it("adds delivery cost only for delivery type", () => {
    const items = [{ price: 9500, quantity: 2 }];
    expect(calculateTotal(items, 1500, "delivery")).toBe(20500);
    expect(calculateTotal(items, 1500, "pickup")).toBe(19000);
  });

  it("sums multiple items correctly", () => {
    const items = [
      { price: 9500, quantity: 2 },
      { price: 3000, quantity: 1 },
    ];
    expect(calculateTotal(items, 0, "pickup")).toBe(22000);
  });

  it("returns 0 for empty items with no delivery", () => {
    expect(calculateTotal([], 0, "pickup")).toBe(0);
  });
});
