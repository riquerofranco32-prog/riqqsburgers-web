export const DEFAULT_PREP_MINUTES = 25;
export const DELIVERY_BUFFER_MINUTES = 15;

export function estimateMinutes(
  prepTimeMinutes: number | null,
  deliveryType: "pickup" | "delivery" | "retiro" | "domicilio",
): number {
  const prep = prepTimeMinutes ?? DEFAULT_PREP_MINUTES;
  const isDelivery =
    deliveryType === "delivery" || deliveryType === "domicilio";
  return prep + (isDelivery ? DELIVERY_BUFFER_MINUTES : 0);
}
