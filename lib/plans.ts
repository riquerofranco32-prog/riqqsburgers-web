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
    maxProducts: null,
    analyticsEnabled: false,
    customBranding: false,
    priceArs: 0,
    label: "Starter",
    description: "Para arrancar sin riesgo.",
  },
  pro: {
    maxProducts: 50,
    analyticsEnabled: true,
    customBranding: true,
    priceArs: 17000,
    label: "Pro",
    description: "Para negocios que quieren crecer.",
  },
  premium: {
    maxProducts: null,
    analyticsEnabled: true,
    customBranding: true,
    priceArs: 27000,
    label: "Growth",
    description: "Para locales con alto volumen.",
  },
};

export function getPlanLimits(plan: PlanId): PlanLimits {
  return PLANS[plan] ?? PLANS.free;
}
