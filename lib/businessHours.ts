// Horarios en hora de Argentina, sin importar en qué timezone corra el server
// (Vercel corre en UTC). Índice 0=domingo..6=sábado, igual que Date.getDay().
const TZ = "America/Argentina/Buenos_Aires";

export interface TimeSlot {
  open: string; // "HH:MM"
  close: string; // "HH:MM"
}

export interface DayHours {
  open: string | null; // "HH:MM" — franja 1 (apertura)
  close: string | null; // "HH:MM" — franja 1 (cierre)
  closed: boolean;
  slot2?: TimeSlot; // segunda franja (opcional)
}

export type BusinessHours = DayHours[];

export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function nowInBuenosAires(at: Date): { day: number; minutes: number } {
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
 * Verifica si `minutes` está dentro de un slot que puede cruzar medianoche.
 * Si crossPrev=true verifica si el slot del día anterior aún sigue abierto.
 */
function isInSlot(
  minutes: number,
  open: number,
  close: number,
  crossPrev = false,
): boolean {
  if (crossPrev) {
    return close <= open && minutes < close;
  }
  if (close > open) {
    return minutes >= open && minutes < close;
  }
  // slot cruza medianoche
  return minutes >= open;
}

/**
 * true si el local está abierto según el horario configurado. Soporta
 * horarios que cruzan la medianoche (ej: 20:00–02:00) mirando también si el
 * turno de "ayer" todavía sigue abierto en la madrugada de hoy.
 * Soporta dos franjas por día (slot2 opcional).
 */
export function isOpenNow(
  hours: BusinessHours,
  at: Date = new Date(),
): boolean {
  const { day, minutes } = nowInBuenosAires(at);
  const prevDay = (day + 6) % 7;

  // Verificar si la franja de ayer cruza la medianoche
  const yesterday = hours[prevDay];
  if (yesterday && !yesterday.closed) {
    if (yesterday.open && yesterday.close) {
      const yOpen = toMinutes(yesterday.open);
      const yClose = toMinutes(yesterday.close);
      if (isInSlot(minutes, yOpen, yClose, true)) return true;
    }
    if (yesterday.slot2) {
      const y2Open = toMinutes(yesterday.slot2.open);
      const y2Close = toMinutes(yesterday.slot2.close);
      if (isInSlot(minutes, y2Open, y2Close, true)) return true;
    }
  }

  const today = hours[day];
  if (!today || today.closed) return false;

  // Verificar franja 1
  if (today.open && today.close) {
    const tOpen = toMinutes(today.open);
    const tClose = toMinutes(today.close);
    if (isInSlot(minutes, tOpen, tClose)) return true;
  }

  // Verificar franja 2 (si existe)
  if (today.slot2) {
    const t2Open = toMinutes(today.slot2.open);
    const t2Close = toMinutes(today.slot2.close);
    if (isInSlot(minutes, t2Open, t2Close)) return true;
  }

  return false;
}

export type OpenStatus =
  | { kind: "open"; until: string | null; reopens: string | null }
  | { kind: "closed"; opensAt: string | null };

/**
 * Busca la próxima apertura a partir del día `fromDay` y `fromMinutes`.
 * Retorna "HH:MM" o null si no hay apertura en los próximos 7 días.
 */
function findNextOpen(
  hours: BusinessHours,
  fromDay: number,
  fromMinutes: number,
): string | null {
  for (let i = 0; i < 7; i++) {
    const d = (fromDay + i) % 7;
    const day = hours[d];
    if (!day || day.closed) continue;

    if (i === 0) {
      // Mismo día: revisar si hay franja que aún no empezó
      if (day.open && toMinutes(day.open) >= fromMinutes) return day.open;
      if (day.slot2 && toMinutes(day.slot2.open) >= fromMinutes)
        return day.slot2.open;
    } else {
      // Día futuro: retornar la primera apertura
      if (day.open) return day.open;
      if (day.slot2) return day.slot2.open;
    }
  }
  return null;
}

/**
 * Devuelve el estado detallado del local en un momento dado, para mostrar
 * mensajes como:
 *   "Abierto hasta las 15:00. Reabre a las 20:00."
 *   "Abre a las 11:30."
 *   "Cerrado"
 */
export function getOpenStatus(
  hours: BusinessHours,
  at: Date = new Date(),
): OpenStatus {
  const { day, minutes } = nowInBuenosAires(at);
  const prevDay = (day + 6) % 7;

  // ── Verificar si ayer cruza la medianoche ──────────────────────────────
  const yesterday = hours[prevDay];
  if (yesterday && !yesterday.closed) {
    if (yesterday.open && yesterday.close) {
      const yOpen = toMinutes(yesterday.open);
      const yClose = toMinutes(yesterday.close);
      if (isInSlot(minutes, yOpen, yClose, true)) {
        const todayDay = hours[day];
        const reopens =
          todayDay && !todayDay.closed
            ? (todayDay.slot2?.open ?? todayDay.open ?? null)
            : null;
        return { kind: "open", until: yesterday.close, reopens };
      }
    }
    if (yesterday.slot2) {
      const y2Open = toMinutes(yesterday.slot2.open);
      const y2Close = toMinutes(yesterday.slot2.close);
      if (isInSlot(minutes, y2Open, y2Close, true)) {
        return { kind: "open", until: yesterday.slot2.close, reopens: null };
      }
    }
  }

  const today = hours[day];
  if (!today || today.closed) {
    return { kind: "closed", opensAt: findNextOpen(hours, (day + 1) % 7, 0) };
  }

  // ── Franja 1 ───────────────────────────────────────────────────────────
  if (today.open && today.close) {
    const tOpen = toMinutes(today.open);
    const tClose = toMinutes(today.close);

    if (isInSlot(minutes, tOpen, tClose)) {
      const normalClose = tClose > tOpen;
      const reopens = normalClose && today.slot2 ? today.slot2.open : null;
      return { kind: "open", until: today.close, reopens };
    }

    // Antes de la franja 1
    if (minutes < tOpen) {
      return { kind: "closed", opensAt: today.open };
    }

    // Entre franja 1 (ya terminó, normal) y posible franja 2
    if (tClose > tOpen && minutes >= tClose) {
      if (today.slot2) {
        const t2Open = toMinutes(today.slot2.open);
        const t2Close = toMinutes(today.slot2.close);
        if (isInSlot(minutes, t2Open, t2Close)) {
          return { kind: "open", until: today.slot2.close, reopens: null };
        }
        if (minutes < t2Open) {
          return { kind: "closed", opensAt: today.slot2.open };
        }
      }
      // Ambas franjas terminaron
      return { kind: "closed", opensAt: findNextOpen(hours, (day + 1) % 7, 0) };
    }
  }

  // ── Solo franja 2 (sin franja 1 configurada) ───────────────────────────
  if (today.slot2) {
    const t2Open = toMinutes(today.slot2.open);
    const t2Close = toMinutes(today.slot2.close);
    if (isInSlot(minutes, t2Open, t2Close)) {
      return { kind: "open", until: today.slot2.close, reopens: null };
    }
    if (minutes < t2Open) {
      return { kind: "closed", opensAt: today.slot2.open };
    }
  }

  return { kind: "closed", opensAt: findNextOpen(hours, (day + 1) % 7, 0) };
}

/**
 * Convierte un OpenStatus en un string legible para el usuario.
 * Ejemplo: "Abierto hasta las 15:00. Reabre a las 20:00."
 */
export function formatOpenStatus(status: OpenStatus): string {
  if (status.kind === "open") {
    if (status.until && status.reopens) {
      return `Abierto hasta las ${status.until}. Reabre a las ${status.reopens}.`;
    }
    if (status.until) {
      return `Abierto hasta las ${status.until}.`;
    }
    return "Abierto ahora";
  }
  if (status.opensAt) {
    return `Abre a las ${status.opensAt}.`;
  }
  return "Cerrado";
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

export function isValidTimeSlot(slot: unknown): slot is TimeSlot {
  if (typeof slot !== "object" || slot === null) return false;
  const s = slot as Record<string, unknown>;
  return (
    typeof s.open === "string" &&
    typeof s.close === "string" &&
    /^\d{2}:\d{2}$/.test(s.open) &&
    /^\d{2}:\d{2}$/.test(s.close)
  );
}

export function isValidBusinessHours(value: unknown): value is BusinessHours {
  if (!Array.isArray(value) || value.length !== 7) return false;
  return value.every((d) => {
    if (typeof d !== "object" || d === null) return false;
    const day = d as Record<string, unknown>;
    if (typeof day.closed !== "boolean") return false;
    if (day.closed) return true;

    // Franja 1 (requerida si no está cerrado)
    if (
      typeof day.open !== "string" ||
      typeof day.close !== "string" ||
      !/^\d{2}:\d{2}$/.test(day.open) ||
      !/^\d{2}:\d{2}$/.test(day.close)
    ) {
      return false;
    }

    // Franja 2 (opcional)
    if ("slot2" in day && day.slot2 !== undefined) {
      if (!isValidTimeSlot(day.slot2)) return false;

      // Validar superposición en slots normales (sin cruce de medianoche)
      const s1Open = toMinutes(day.open as string);
      const s1Close = toMinutes(day.close as string);
      const s2 = day.slot2 as TimeSlot;
      const s2Open = toMinutes(s2.open);
      const s2Close = toMinutes(s2.close);

      if (s1Close > s1Open && s2Close > s2Open) {
        const overlaps = s2Open < s1Close && s2Close > s1Open;
        if (overlaps) return false;
      }
    }

    return true;
  });
}
