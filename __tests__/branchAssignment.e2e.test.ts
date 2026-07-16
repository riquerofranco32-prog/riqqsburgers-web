import { describe, it, expect } from "vitest";
import {
  assignBranch,
  pickLeastBusyBranch,
  type Branch,
} from "@/lib/branchAssignment";
import { resolveZoneByLocation, resolveDistancePrice } from "@/lib/delivery";

// ── Integration test for the full "pedido → sucursal → costo de envío"
// flow used by POST /api/orders (app/api/orders/route.ts), replaying the
// exact same sequence against in-memory fixtures instead of a real
// Supabase project (no local Docker / staging project available).

interface Fixture {
  branches: Branch[];
  activeOrderCountByBranch: Record<string, number>;
  zonesByBranch: Record<
    string,
    {
      id: string;
      name: string;
      price: number;
      lat: number;
      lng: number;
      radius_km: number;
    }[]
  >;
  rangesByBranch: Record<string, { max_km: number; price: number }[]>;
}

// Mirrors the branching logic in app/api/orders/route.ts lines ~299-412.
function resolveOrder(
  customerLat: number,
  customerLng: number,
  deliveryMode: "zones" | "distance" | "fixed" | "none",
  tenantFixedDeliveryCost: number,
  fixture: Fixture,
) {
  const assignment = assignBranch(
    customerLat,
    customerLng,
    fixture.branches,
    fixture.activeOrderCountByBranch,
  );
  if (!assignment.branchId) return { error: assignment.error };

  const branch = fixture.branches.find((b) => b.id === assignment.branchId)!;
  let deliveryCost = 0;

  if (deliveryMode === "zones") {
    const result = resolveZoneByLocation(
      fixture.zonesByBranch[branch.id] ?? [],
      customerLat,
      customerLng,
      "Fuera de zona de cobertura",
    );
    deliveryCost = result.price;
  } else if (deliveryMode === "distance") {
    const result = resolveDistancePrice(
      fixture.rangesByBranch[branch.id] ?? [],
      branch.latitude as number,
      branch.longitude as number,
      customerLat,
      customerLng,
      "Fuera de rango de entrega",
    );
    deliveryCost = result.price;
  } else if (deliveryMode === "fixed") {
    deliveryCost = tenantFixedDeliveryCost;
  }

  return { branchId: branch.id, branchName: branch.name, deliveryCost };
}

describe("end-to-end: pedido en zona centro con 2 sucursales cercanas y 1 lejana", () => {
  // Corrientes capital, 3 sucursales del mismo tenant.
  const centro: Branch = {
    id: "b-centro",
    name: "Centro",
    latitude: -27.4806,
    longitude: -58.8341,
    active: true,
  };
  const norte: Branch = {
    id: "b-norte",
    name: "Norte",
    latitude: -27.45,
    longitude: -58.81,
    active: true,
  };
  const lejos: Branch = {
    id: "b-lejos",
    name: "Lejos",
    latitude: -27.6,
    longitude: -58.7,
    active: true,
  }; // ~20km

  const customerInCentro = { lat: -27.482, lng: -58.835 }; // a metros de "Centro"

  it("descarta la sucursal lejana y elige por cercanía cuando no hay carga", () => {
    const fixture: Fixture = {
      branches: [centro, norte, lejos],
      activeOrderCountByBranch: {},
      zonesByBranch: {},
      rangesByBranch: {
        "b-centro": [{ max_km: 5, price: 1000 }],
        "b-norte": [{ max_km: 5, price: 1000 }],
        "b-lejos": [{ max_km: 30, price: 1000 }],
      },
    };

    const result = resolveOrder(
      customerInCentro.lat,
      customerInCentro.lng,
      "distance",
      0,
      fixture,
    );

    expect(result.branchId).toBe("b-centro");
    expect(result.branchId).not.toBe("b-lejos");
  });

  it("entre las 2 más cercanas, elige la de menor demanda aunque no sea la más cercana", () => {
    const fixture: Fixture = {
      branches: [centro, norte, lejos],
      // Centro es la más cercana pero está saturada.
      activeOrderCountByBranch: { "b-centro": 12, "b-norte": 1 },
      zonesByBranch: {},
      rangesByBranch: {
        "b-centro": [{ max_km: 5, price: 1000 }],
        "b-norte": [{ max_km: 10, price: 1200 }],
        "b-lejos": [{ max_km: 30, price: 1000 }],
      },
    };

    const result = resolveOrder(
      customerInCentro.lat,
      customerInCentro.lng,
      "distance",
      0,
      fixture,
    );

    expect(result.branchId).toBe("b-norte");
    expect(result.deliveryCost).toBe(1200); // costo de la sucursal ganadora, no de la más cercana
  });

  it("nunca considera a la sucursal lejana como desempate por demanda", () => {
    const fixture: Fixture = {
      branches: [centro, norte, lejos],
      // "Lejos" tiene demanda 0 (la más ociosa), pero no debe ganar: quedó
      // afuera del top-2 por distancia antes de mirar demanda.
      activeOrderCountByBranch: { "b-centro": 5, "b-norte": 5, "b-lejos": 0 },
      zonesByBranch: {},
      rangesByBranch: {
        "b-centro": [{ max_km: 5, price: 1000 }],
        "b-norte": [{ max_km: 5, price: 1000 }],
        "b-lejos": [{ max_km: 30, price: 500 }],
      },
    };

    const result = resolveOrder(
      customerInCentro.lat,
      customerInCentro.lng,
      "distance",
      0,
      fixture,
    );

    expect(result.branchId).not.toBe("b-lejos");
    expect(["b-centro", "b-norte"]).toContain(result.branchId);
  });

  it("modo zonas: calcula el precio contra las zonas de la sucursal asignada, no de otra", () => {
    const fixture: Fixture = {
      branches: [centro, norte],
      activeOrderCountByBranch: {},
      zonesByBranch: {
        "b-centro": [
          {
            id: "z1",
            name: "Centro",
            price: 900,
            lat: -27.4806,
            lng: -58.8341,
            radius_km: 3,
          },
        ],
        "b-norte": [
          {
            id: "z2",
            name: "Norte",
            price: 1500,
            lat: -27.45,
            lng: -58.81,
            radius_km: 3,
          },
        ],
      },
      rangesByBranch: {},
    };

    const result = resolveOrder(
      customerInCentro.lat,
      customerInCentro.lng,
      "zones",
      0,
      fixture,
    );

    expect(result.branchId).toBe("b-centro");
    expect(result.deliveryCost).toBe(900); // precio de la zona de Centro, no de Norte
  });

  it("retiro / sin ubicación: reparte solo por demanda entre todas las sucursales activas", () => {
    const branches = [centro, norte, lejos];
    const result = pickLeastBusyBranch(branches, {
      "b-centro": 3,
      "b-norte": 1,
      "b-lejos": 0,
    });

    expect(result.branchId).toBe("b-lejos"); // acá sí puede ganar la lejana: no hay cercanía que evaluar
  });

  it("si no hay ninguna sucursal activa, devuelve error explícito y no asigna nada", () => {
    const fixture: Fixture = {
      branches: [
        { ...centro, active: false },
        { ...norte, active: false },
      ],
      activeOrderCountByBranch: {},
      zonesByBranch: {},
      rangesByBranch: {},
    };

    const result = resolveOrder(
      customerInCentro.lat,
      customerInCentro.lng,
      "distance",
      0,
      fixture,
    );

    expect(result.branchId).toBeUndefined();
    expect(result.error).toBeTruthy();
  });
});
