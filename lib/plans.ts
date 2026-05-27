export type PlanId = "free" | "pro" | "premium";

export interface PlanLimits {
  maxProducts: number | null; // null = ilimitado
  analyticsEnabled: boolean;
  customBranding: boolean;
  priceArs: number;
  label: string;
  description: string;
}

export const PLANS: Record<PlanId, PlanLimits> = {
  free: {
    maxProducts: 10,
    analyticsEnabled: false,
    customBranding: false,
    priceArs: 0,
    label: "Free",
    description: "Hasta 10 productos. Ideal para empezar.",
  },
  pro: {
    maxProducts: 50,
    analyticsEnabled: true,
    customBranding: true,
    priceArs: 4999,
    label: "Pro",
    description: "Hasta 50 productos con analytics y personalización.",
  },
  premium: {
    maxProducts: null,
    analyticsEnabled: true,
    customBranding: true,
    priceArs: 9999,
    label: "Premium",
    description: "Productos ilimitados. Todo incluido.",
  },
};

export function getPlanLimits(plan: PlanId): PlanLimits {
  return PLANS[plan] ?? PLANS.free;
}
