import { describe, it, expect } from "vitest";
import {
  assignBranch,
  pickLeastBusyBranch,
  type Branch,
} from "@/lib/branchAssignment";

// Coordenadas de referencia: cliente en el "centro", sucursal A más cerca,
// sucursal B más lejos (ver docs/delivery.md sobre Haversine).
const CUSTOMER_LAT = -34.6037;
const CUSTOMER_LNG = -58.3816;

const NEAR: Branch = {
  id: "branch-near",
  name: "Sucursal Centro",
  latitude: -34.6037,
  longitude: -58.3816,
  active: true,
};
const FAR: Branch = {
  id: "branch-far",
  name: "Sucursal Norte",
  latitude: -34.55,
  longitude: -58.45,
  active: true,
};
const THIRD: Branch = {
  id: "branch-third",
  name: "Sucursal Sur",
  latitude: -34.65,
  longitude: -58.3,
  active: true,
};

describe("assignBranch", () => {
  it("devuelve la única sucursal activa sin comparar demanda", () => {
    const result = assignBranch(CUSTOMER_LAT, CUSTOMER_LNG, [NEAR], {});
    expect(result.branchId).toBe("branch-near");
    expect(result.error).toBeUndefined();
  });

  it("entre 2+ sucursales, prioriza la más cercana con demanda igual", () => {
    const result = assignBranch(
      CUSTOMER_LAT,
      CUSTOMER_LNG,
      [NEAR, FAR, THIRD],
      {
        "branch-near": 2,
        "branch-far": 2,
        "branch-third": 2,
      },
    );
    expect(result.branchId).toBe("branch-near");
  });

  it("entre las 2 más cercanas, elige la de menor demanda aunque no sea la más cercana", () => {
    const result = assignBranch(CUSTOMER_LAT, CUSTOMER_LNG, [NEAR, FAR], {
      "branch-near": 5,
      "branch-far": 1,
    });
    expect(result.branchId).toBe("branch-far");
  });

  it("ignora una 3ra sucursal lejana aunque tenga demanda 0", () => {
    // THIRD es más lejana que FAR desde CUSTOMER; aunque tenga demanda 0,
    // solo se comparan las 2 más cercanas (NEAR y FAR).
    const result = assignBranch(
      CUSTOMER_LAT,
      CUSTOMER_LNG,
      [NEAR, FAR, THIRD],
      {
        "branch-near": 5,
        "branch-far": 5,
        "branch-third": 0,
      },
    );
    expect(["branch-near", "branch-far"]).toContain(result.branchId);
    expect(result.branchId).not.toBe("branch-third");
  });

  it("empate de distancia: ambas sucursales igual de cerca, gana por demanda", () => {
    const sameDistanceA: Branch = {
      id: "branch-a",
      name: "A",
      latitude: -34.6,
      longitude: -58.38,
      active: true,
    };
    const sameDistanceB: Branch = {
      id: "branch-b",
      name: "B",
      latitude: -34.6074,
      longitude: -58.3816,
      active: true,
    };
    const result = assignBranch(
      CUSTOMER_LAT,
      CUSTOMER_LNG,
      [sameDistanceA, sameDistanceB],
      { "branch-a": 3, "branch-b": 1 },
    );
    expect(result.branchId).toBe("branch-b");
  });

  it("empate de demanda: gana la más cercana", () => {
    const result = assignBranch(CUSTOMER_LAT, CUSTOMER_LNG, [NEAR, FAR], {
      "branch-near": 3,
      "branch-far": 3,
    });
    expect(result.branchId).toBe("branch-near");
  });

  it("sin conteo de demanda para una branch, la trata como 0 pedidos activos", () => {
    const result = assignBranch(CUSTOMER_LAT, CUSTOMER_LNG, [NEAR, FAR], {
      "branch-near": 5,
    });
    expect(result.branchId).toBe("branch-far");
  });

  it("ninguna sucursal activa: devuelve error explícito, no lanza excepción", () => {
    const inactive: Branch = { ...NEAR, active: false };
    const result = assignBranch(CUSTOMER_LAT, CUSTOMER_LNG, [inactive], {});
    expect(result.branchId).toBeNull();
    expect(result.error).toBeTruthy();
  });

  it("lista de sucursales vacía: devuelve error explícito", () => {
    const result = assignBranch(CUSTOMER_LAT, CUSTOMER_LNG, [], {});
    expect(result.branchId).toBeNull();
    expect(result.error).toBeTruthy();
  });

  it("ignora sucursales activas sin lat/lng configurado", () => {
    const noLocation: Branch = {
      id: "branch-no-location",
      name: "Sin ubicación",
      latitude: null,
      longitude: null,
      active: true,
    };
    const result = assignBranch(
      CUSTOMER_LAT,
      CUSTOMER_LNG,
      [noLocation, FAR],
      {},
    );
    expect(result.branchId).toBe("branch-far");
  });
});

describe("pickLeastBusyBranch", () => {
  it("elige la sucursal activa con menos pedidos en cola", () => {
    const result = pickLeastBusyBranch([NEAR, FAR], {
      "branch-near": 4,
      "branch-far": 1,
    });
    expect(result.branchId).toBe("branch-far");
  });

  it("no requiere lat/lng — sirve para retiro en local", () => {
    const noLocation: Branch = {
      id: "branch-no-location",
      name: "Sin ubicación",
      latitude: null,
      longitude: null,
      active: true,
    };
    const result = pickLeastBusyBranch([noLocation], {});
    expect(result.branchId).toBe("branch-no-location");
  });

  it("ninguna sucursal activa: devuelve error explícito", () => {
    const result = pickLeastBusyBranch([{ ...NEAR, active: false }], {});
    expect(result.branchId).toBeNull();
    expect(result.error).toBeTruthy();
  });
});
