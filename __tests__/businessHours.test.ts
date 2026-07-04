import { describe, it, expect } from "vitest";
import {
  isOpenNow,
  isValidBusinessHours,
  type BusinessHours,
} from "@/lib/businessHours";

const CLOSED: BusinessHours = Array.from({ length: 7 }, () => ({
  open: null,
  close: null,
  closed: true,
}));

function hoursAllDays(open: string, close: string): BusinessHours {
  return Array.from({ length: 7 }, () => ({ open, close, closed: false }));
}

// Un instante dado en un día de semana + hora, expresado en hora de
// Argentina (UTC-3, sin horario de verano).
function arAt(dow: number, hh: number, mm: number): Date {
  // 2026-07-05 es domingo (dow=0); sumamos días para llegar al dow buscado.
  const base = Date.UTC(2026, 6, 5 + dow, hh + 3, mm);
  return new Date(base);
}

describe("isOpenNow", () => {
  it("cerrado cuando todos los días están marcados closed", () => {
    expect(isOpenNow(CLOSED, arAt(3, 13, 0))).toBe(false);
  });

  it("abierto dentro del rango normal del mismo día", () => {
    const hours = hoursAllDays("11:00", "23:00");
    expect(isOpenNow(hours, arAt(3, 12, 0))).toBe(true);
    expect(isOpenNow(hours, arAt(3, 22, 59))).toBe(true);
  });

  it("cerrado fuera del rango normal del mismo día", () => {
    const hours = hoursAllDays("11:00", "23:00");
    expect(isOpenNow(hours, arAt(3, 10, 59))).toBe(false);
    expect(isOpenNow(hours, arAt(3, 23, 0))).toBe(false);
  });

  it("horario que cruza medianoche: abierto antes de medianoche", () => {
    const hours = hoursAllDays("20:00", "02:00");
    expect(isOpenNow(hours, arAt(4, 23, 30))).toBe(true);
  });

  it("horario que cruza medianoche: abierto después de medianoche gracias al turno de ayer", () => {
    const hours = hoursAllDays("20:00", "02:00");
    expect(isOpenNow(hours, arAt(5, 1, 0))).toBe(true);
  });

  it("horario que cruza medianoche: cerrado ya pasado el cierre de la madrugada", () => {
    const hours = hoursAllDays("20:00", "02:00");
    expect(isOpenNow(hours, arAt(5, 10, 0))).toBe(false);
  });

  it("respeta un día particular marcado como cerrado", () => {
    const hours = hoursAllDays("11:00", "23:00");
    hours[1] = { open: null, close: null, closed: true }; // lunes cerrado
    expect(isOpenNow(hours, arAt(1, 12, 0))).toBe(false);
    expect(isOpenNow(hours, arAt(2, 12, 0))).toBe(true);
  });
});

describe("isValidBusinessHours", () => {
  it("acepta un horario válido de 7 días", () => {
    expect(isValidBusinessHours(hoursAllDays("11:00", "23:00"))).toBe(true);
    expect(isValidBusinessHours(CLOSED)).toBe(true);
  });

  it("rechaza arrays con longitud distinta de 7", () => {
    expect(
      isValidBusinessHours(hoursAllDays("11:00", "23:00").slice(0, 6)),
    ).toBe(false);
  });

  it("rechaza formatos de hora inválidos", () => {
    const bad = hoursAllDays("11:00", "23:00");
    bad[0] = { open: "11h", close: "23:00", closed: false };
    expect(isValidBusinessHours(bad)).toBe(false);
  });

  it("rechaza valores que no son objetos", () => {
    expect(isValidBusinessHours(null)).toBe(false);
    expect(isValidBusinessHours("nope")).toBe(false);
  });
});
