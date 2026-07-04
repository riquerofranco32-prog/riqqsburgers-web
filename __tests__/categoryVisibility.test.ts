import { describe, it, expect } from "vitest";
import { isCategoryVisibleNow } from "@/lib/categoryVisibility";

function arAt(hh: number, mm: number): Date {
  // 2026-07-06 es lunes; suma 3hs porque Argentina es UTC-3.
  return new Date(Date.UTC(2026, 6, 6, hh + 3, mm));
}

describe("isCategoryVisibleNow", () => {
  it("siempre visible si no hay ventana configurada", () => {
    expect(
      isCategoryVisibleNow(
        { visible_from: null, visible_to: null },
        arAt(3, 0),
      ),
    ).toBe(true);
  });

  it("visible dentro de la ventana normal", () => {
    const w = { visible_from: "08:00", visible_to: "12:00" };
    expect(isCategoryVisibleNow(w, arAt(9, 0))).toBe(true);
    expect(isCategoryVisibleNow(w, arAt(11, 59))).toBe(true);
  });

  it("no visible fuera de la ventana normal", () => {
    const w = { visible_from: "08:00", visible_to: "12:00" };
    expect(isCategoryVisibleNow(w, arAt(7, 59))).toBe(false);
    expect(isCategoryVisibleNow(w, arAt(12, 0))).toBe(false);
  });

  it("soporta ventana que cruza la medianoche", () => {
    const w = { visible_from: "20:00", visible_to: "02:00" };
    expect(isCategoryVisibleNow(w, arAt(23, 0))).toBe(true);
    expect(isCategoryVisibleNow(w, arAt(1, 0))).toBe(true);
    expect(isCategoryVisibleNow(w, arAt(10, 0))).toBe(false);
  });
});
