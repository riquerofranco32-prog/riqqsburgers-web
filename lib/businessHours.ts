// Horarios en hora de Argentina, sin importar en qué timezone corra el server
// (Vercel corre en UTC). Índice 0=domingo..6=sábado, igual que Date.getDay().
const TZ = "America/Argentina/Buenos_Aires";

export interface DayHours {
  open: string | null; // "HH:MM"
  close: string | null; // "HH:MM"
  closed: boolean;
}

export type BusinessHours = DayHours[];

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function nowInBuenosAires(at: Date): { day: number; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(at);
  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  const weekday = parts.find((p) => p.type === "weekday")!.value;
  let hour = Number(parts.find((p) => p.type === "hour")!.value);
  const minute = Number(parts.find((p) => p.type === "minute")!.value);
  if (hour === 24) hour = 0; // some environments format midnight as "24"
  return { day: weekdayMap[weekday], minutes: hour * 60 + minute };
}

/**
 * true si el local está abierto según el horario configurado. Soporta
 * horarios que cruzan la medianoche (ej: 20:00–02:00) mirando también si el
 * turno de "ayer" todavía sigue abierto en la madrugada de hoy.
 */
export function isOpenNow(
  hours: BusinessHours,
  at: Date = new Date(),
): boolean {
  const { day, minutes } = nowInBuenosAires(at);
  const prevDay = (day + 6) % 7;

  const yesterday = hours[prevDay];
  if (yesterday && !yesterday.closed && yesterday.open && yesterday.close) {
    const yOpen = toMinutes(yesterday.open);
    const yClose = toMinutes(yesterday.close);
    if (yClose <= yOpen && minutes < yClose) return true;
  }

  const today = hours[day];
  if (!today || today.closed || !today.open || !today.close) return false;
  const tOpen = toMinutes(today.open);
  const tClose = toMinutes(today.close);
  if (tClose > tOpen) return minutes >= tOpen && minutes < tClose;
  return minutes >= tOpen; // cruza la medianoche esta noche
}

/**
 * manualOpen=false es un "cerrado forzado" que siempre gana. Si es true
 * (default) y hay horario configurado, el estado real depende del horario;
 * sin horario configurado, el toggle manual es la única fuente de verdad
 * (comportamiento de siempre).
 */
export function computeEffectiveOpen(
  manualOpen: boolean,
  hours: BusinessHours | null,
  at: Date = new Date(),
): boolean {
  if (!manualOpen) return false;
  if (hours) return isOpenNow(hours, at);
  return manualOpen;
}

export function isValidBusinessHours(value: unknown): value is BusinessHours {
  if (!Array.isArray(value) || value.length !== 7) return false;
  return value.every((d) => {
    if (typeof d !== "object" || d === null) return false;
    const day = d as Record<string, unknown>;
    if (typeof day.closed !== "boolean") return false;
    if (day.closed) return true;
    return (
      typeof day.open === "string" &&
      typeof day.close === "string" &&
      /^\d{2}:\d{2}$/.test(day.open) &&
      /^\d{2}:\d{2}$/.test(day.close)
    );
  });
}
