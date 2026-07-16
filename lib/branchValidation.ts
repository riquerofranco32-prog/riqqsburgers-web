/**
 * Validación pura de inputs de sucursal (POST/PATCH /api/branches).
 * Extraída para poder testearla sin pegarle a Supabase — mismo patrón que
 * __tests__/orders.test.ts.
 */

export const BRANCH_NAME_MAX = 60;

export const DELIVERY_MODES = ["none", "fixed", "zones", "distance"] as const;
export type DeliveryMode = (typeof DELIVERY_MODES)[number];

export interface BranchInput {
  name?: unknown;
  latitude?: unknown;
  longitude?: unknown;
  delivery_mode?: unknown;
  active?: unknown;
}

/**
 * Valida un patch parcial (PATCH) o completo (POST) de sucursal. Solo valida
 * los campos presentes en el input — el caller decide qué es requerido.
 */
export function validateBranchInput(input: BranchInput): string | null {
  if ("name" in input) {
    const name = input.name;
    if (
      typeof name !== "string" ||
      name.trim().length === 0 ||
      name.length > BRANCH_NAME_MAX
    ) {
      return `Nombre inválido (máx. ${BRANCH_NAME_MAX} caracteres)`;
    }
  }

  if ("latitude" in input && input.latitude !== null) {
    const lat = input.latitude;
    if (typeof lat !== "number" || !isFinite(lat) || lat < -90 || lat > 90) {
      return "Latitud inválida";
    }
  }

  if ("longitude" in input && input.longitude !== null) {
    const lng = input.longitude;
    if (typeof lng !== "number" || !isFinite(lng) || lng < -180 || lng > 180) {
      return "Longitud inválida";
    }
  }

  if (
    "delivery_mode" in input &&
    !DELIVERY_MODES.includes(input.delivery_mode as DeliveryMode)
  ) {
    return "Modo de entrega inválido";
  }

  if ("active" in input && typeof input.active !== "boolean") {
    return "active debe ser boolean";
  }

  return null;
}
