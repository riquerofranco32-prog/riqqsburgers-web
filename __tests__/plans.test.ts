import { describe, it, expect } from "vitest";
import { getPlanLimits, PLANS } from "@/lib/plans";

describe("plan gating — getPlanLimits", () => {
  it("free plan caps at 5 products", () => {
    const limits = getPlanLimits("free");
    expect(limits.maxProducts).toBe(5);
    expect(limits.analyticsEnabled).toBe(false);
  });

  it("pro plan has unlimited products with analytics", () => {
    const limits = getPlanLimits("pro");
    expect(limits.maxProducts).toBeNull();
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

  it("blocks free plan at 5 products", () => {
    expect(canAdd(5, PLANS.free.maxProducts)).toBe(false);
    expect(canAdd(4, PLANS.free.maxProducts)).toBe(true);
  });

  it("never blocks pro plan", () => {
    expect(canAdd(9999, PLANS.pro.maxProducts)).toBe(true);
  });

  it("never blocks premium", () => {
    expect(canAdd(9999, PLANS.premium.maxProducts)).toBe(true);
  });
});

describe("plan gating — team seat limits", () => {
  function canAddMember(
    currentCount: number,
    maxTeamMembers: number | null,
  ): boolean {
    if (maxTeamMembers === null) return true;
    return currentCount < maxTeamMembers;
  }

  it("free plan allows only 1 team member", () => {
    expect(PLANS.free.maxTeamMembers).toBe(1);
    expect(canAddMember(1, PLANS.free.maxTeamMembers)).toBe(false);
    expect(canAddMember(0, PLANS.free.maxTeamMembers)).toBe(true);
  });

  it("pro plan caps at 3 team members", () => {
    expect(PLANS.pro.maxTeamMembers).toBe(3);
    expect(canAddMember(3, PLANS.pro.maxTeamMembers)).toBe(false);
    expect(canAddMember(2, PLANS.pro.maxTeamMembers)).toBe(true);
  });

  it("premium plan has unlimited team members", () => {
    expect(PLANS.premium.maxTeamMembers).toBeNull();
    expect(canAddMember(9999, PLANS.premium.maxTeamMembers)).toBe(true);
  });
});
