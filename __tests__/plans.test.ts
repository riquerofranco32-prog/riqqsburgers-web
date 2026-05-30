import { describe, it, expect } from "vitest";
import { getPlanLimits, PLANS } from "@/lib/plans";

describe("plan gating — getPlanLimits", () => {
  it("free plan caps at 10 products", () => {
    const limits = getPlanLimits("free");
    expect(limits.maxProducts).toBe(10);
    expect(limits.analyticsEnabled).toBe(false);
  });

  it("pro plan caps at 50 products with analytics", () => {
    const limits = getPlanLimits("pro");
    expect(limits.maxProducts).toBe(50);
    expect(limits.analyticsEnabled).toBe(true);
  });

  it("premium plan has unlimited products", () => {
    const limits = getPlanLimits("premium");
    expect(limits.maxProducts).toBeNull();
    expect(limits.analyticsEnabled).toBe(true);
  });

  it("unknown plan falls back to free", () => {
    // @ts-expect-error testing invalid plan
    const limits = getPlanLimits("enterprise");
    expect(limits).toEqual(PLANS.free);
  });
});

describe("plan gating — canAddProduct logic", () => {
  function canAdd(currentCount: number, maxProducts: number | null): boolean {
    if (maxProducts === null) return true;
    return currentCount < maxProducts;
  }

  it("blocks free plan at 10 products", () => {
    expect(canAdd(10, PLANS.free.maxProducts)).toBe(false);
    expect(canAdd(9, PLANS.free.maxProducts)).toBe(true);
  });

  it("blocks pro plan at 50 products", () => {
    expect(canAdd(50, PLANS.pro.maxProducts)).toBe(false);
    expect(canAdd(49, PLANS.pro.maxProducts)).toBe(true);
  });

  it("never blocks premium", () => {
    expect(canAdd(9999, PLANS.premium.maxProducts)).toBe(true);
  });
});
