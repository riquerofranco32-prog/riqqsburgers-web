import { describe, it, expect } from "vitest";
import { getCustomerTier } from "@/lib/customers";

describe("getCustomerTier", () => {
  it("bronze por debajo de 3 pedidos", () => {
    expect(getCustomerTier(0)).toBe("bronze");
    expect(getCustomerTier(2)).toBe("bronze");
  });

  it("silver entre 3 y 9 pedidos", () => {
    expect(getCustomerTier(3)).toBe("silver");
    expect(getCustomerTier(9)).toBe("silver");
  });

  it("gold desde 10 pedidos", () => {
    expect(getCustomerTier(10)).toBe("gold");
    expect(getCustomerTier(50)).toBe("gold");
  });
});
