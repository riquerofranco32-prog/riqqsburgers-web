import { toMinutes, nowInBuenosAires } from "./businessHours";

export interface CategoryWindow {
  visible_from: string | null;
  visible_to: string | null;
}

/**
 * true si la categoría debe mostrarse ahora. Sin horario configurado
 * (ambos null) siempre es visible — comportamiento de siempre. Soporta
 * ventanas que cruzan la medianoche igual que business_hours.
 */
export function isCategoryVisibleNow(
  window: CategoryWindow,
  at: Date = new Date(),
): boolean {
  if (!window.visible_from || !window.visible_to) return true;
  const { minutes } = nowInBuenosAires(at);
  const from = toMinutes(window.visible_from);
  const to = toMinutes(window.visible_to);
  if (to > from) return minutes >= from && minutes < to;
  return minutes >= from || minutes < to; // cruza la medianoche
}
