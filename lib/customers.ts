export interface CustomerOrderRow {
  customer_name: string | null;
  customer_phone: string | null;
  total: number;
  status: string;
  created_at: string;
}

export interface CustomerSummary {
  key: string;
  name: string;
  phone: string | null;
  ordersCount: number;
  totalSpent: number;
  lastOrderAt: string;
}

export function aggregateCustomers(
  orders: CustomerOrderRow[],
): CustomerSummary[] {
  const map = new Map<string, CustomerSummary>();
  for (const o of orders) {
    if (o.status === "cancelled") continue;
    const phone = o.customer_phone?.trim() || null;
    const name = o.customer_name?.trim() || null;
    if (!phone && !name) continue;
    const key = phone ?? `name:${name!.toLowerCase()}`;
    const existing = map.get(key);
    if (existing) {
      existing.ordersCount += 1;
      existing.totalSpent += o.total;
      if (o.created_at > existing.lastOrderAt)
        existing.lastOrderAt = o.created_at;
      if (!existing.phone && phone) existing.phone = phone;
    } else {
      map.set(key, {
        key,
        name: name ?? "Sin nombre",
        phone,
        ordersCount: 1,
        totalSpent: o.total,
        lastOrderAt: o.created_at,
      });
    }
  }
  return Array.from(map.values());
}

export type CustomerTier = "bronze" | "silver" | "gold";

// ponytail: umbrales fijos, ajustar si un negocio necesita algo distinto.
export function getCustomerTier(ordersCount: number): CustomerTier {
  if (ordersCount >= 10) return "gold";
  if (ordersCount >= 3) return "silver";
  return "bronze";
}
