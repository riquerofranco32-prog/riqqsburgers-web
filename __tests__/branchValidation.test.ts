import { describe, it, expect } from "vitest";
import { validateBranchInput } from "@/lib/branchValidation";

describe("validateBranchInput", () => {
  it("accepts a valid full input", () => {
    expect(
      validateBranchInput({
        name: "Sucursal Centro",
        latitude: -34.6,
        longitude: -58.4,
        delivery_mode: "zones",
        active: true,
      }),
    ).toBeNull();
  });

  it("only validates fields present in the input (partial PATCH)", () => {
    expect(validateBranchInput({ active: false })).toBeNull();
  });

  it("rejects empty or too-long name", () => {
    expect(validateBranchInput({ name: "" })).toMatch(/Nombre inválido/);
    expect(validateBranchInput({ name: "  " })).toMatch(/Nombre inválido/);
    expect(validateBranchInput({ name: "a".repeat(61) })).toMatch(
      /Nombre inválido/,
    );
  });

  it("allows null latitude/longitude (sucursal sin ubicación aún)", () => {
    expect(validateBranchInput({ latitude: null, longitude: null })).toBeNull();
  });

  it("rejects out-of-range latitude/longitude", () => {
    expect(validateBranchInput({ latitude: 91 })).toMatch(/Latitud inválida/);
    expect(validateBranchInput({ latitude: -91 })).toMatch(/Latitud inválida/);
    expect(validateBranchInput({ longitude: 181 })).toMatch(
      /Longitud inválida/,
    );
    expect(validateBranchInput({ longitude: -181 })).toMatch(
      /Longitud inválida/,
    );
  });

  it("rejects non-numeric or non-finite coordinates", () => {
    expect(validateBranchInput({ latitude: "abc" })).toMatch(
      /Latitud inválida/,
    );
    expect(validateBranchInput({ latitude: Infinity })).toMatch(
      /Latitud inválida/,
    );
  });

  it("rejects invalid delivery_mode", () => {
    expect(validateBranchInput({ delivery_mode: "teleport" })).toMatch(
      /Modo de entrega inválido/,
    );
  });

  it("rejects non-boolean active", () => {
    expect(validateBranchInput({ active: "yes" })).toMatch(
      /active debe ser boolean/,
    );
  });
});
