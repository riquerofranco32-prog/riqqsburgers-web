import { haversineKm } from "./delivery";

export interface Branch {
  id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  active: boolean;
}

export interface BranchAssignmentResult {
  branchId: string | null;
  error?: string;
}

// Cuántas de las sucursales más cercanas se comparan por demanda antes de
// elegir. Fijo en 2 según lo acordado con el cliente — no una config genérica
// de "estrategia de asignación".
const CANDIDATES_TO_COMPARE = 2;

/**
 * Asigna una sucursal a un pedido: cercanía primero (Haversine, ver
 * lib/delivery.ts), demanda como desempate entre las 2 más cercanas.
 * activeOrderCountByBranch = cantidad de pedidos en cola (pendiente/en
 * preparación) por branch_id — sucursales ausentes del mapa cuentan como 0.
 */
export function assignBranch(
  customerLat: number,
  customerLng: number,
  branches: Branch[],
  activeOrderCountByBranch: Record<string, number>,
): BranchAssignmentResult {
  const eligible = branches.filter(
    (b) => b.active && b.latitude !== null && b.longitude !== null,
  );

  if (eligible.length === 0) {
    return { branchId: null, error: "No hay sucursales activas disponibles" };
  }

  if (eligible.length === 1) {
    return { branchId: eligible[0].id };
  }

  const byDistance = eligible
    .map((branch) => ({
      branch,
      distanceKm: haversineKm(
        customerLat,
        customerLng,
        branch.latitude as number,
        branch.longitude as number,
      ),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, CANDIDATES_TO_COMPARE);

  const winner = [...byDistance].sort((a, b) => {
    const demandA = activeOrderCountByBranch[a.branch.id] ?? 0;
    const demandB = activeOrderCountByBranch[b.branch.id] ?? 0;
    if (demandA !== demandB) return demandA - demandB;
    return a.distanceKm - b.distanceKm; // empate de demanda: gana la más cercana
  })[0];

  return { branchId: winner.branch.id };
}

/**
 * Asignación por demanda sin ubicación del cliente (retiro en local, o
 * delivery en modo 'fixed'/'none' donde no se pide dirección). No hay
 * "cercanía" que evaluar — se reparte por menor cola entre todas las
 * sucursales activas.
 */
export function pickLeastBusyBranch(
  branches: Branch[],
  activeOrderCountByBranch: Record<string, number>,
): BranchAssignmentResult {
  const eligible = branches.filter((b) => b.active);
  if (eligible.length === 0) {
    return { branchId: null, error: "No hay sucursales activas disponibles" };
  }

  const sorted = [...eligible].sort((a, b) => {
    const demandA = activeOrderCountByBranch[a.id] ?? 0;
    const demandB = activeOrderCountByBranch[b.id] ?? 0;
    return demandA - demandB;
  });

  return { branchId: sorted[0].id };
}
