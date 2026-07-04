import { describe, it, expect } from "vitest";
import { estimateMinutes } from "@/lib/eta";

describe("estimateMinutes", () => {
  it("usa el default de 25 min si no hay prep_time configurado", () => {
    expect(estimateMinutes(null, "pickup")).toBe(25);
  });

  it("usa el prep_time configurado para retiro", () => {
    expect(estimateMinutes(15, "pickup")).toBe(15);
    expect(estimateMinutes(15, "retiro")).toBe(15);
  });

  it("suma el margen de delivery", () => {
    expect(estimateMinutes(15, "delivery")).toBe(30);
    expect(estimateMinutes(15, "domicilio")).toBe(30);
    expect(estimateMinutes(null, "delivery")).toBe(40);
  });
});
