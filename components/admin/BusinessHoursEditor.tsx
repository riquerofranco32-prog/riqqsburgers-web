"use client";

import type { BusinessHours, DayHours, TimeSlot } from "@/lib/businessHours";

const DAY_LABELS = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
] as const;

const DEFAULT_HOURS: BusinessHours = Array.from({ length: 7 }, () => ({
  open: "11:00",
  close: "23:00",
  closed: false,
}));

const labelStyle = {
  display: "block",
  fontSize: 12,
  fontWeight: 600,
  color: "var(--dash-muted)",
  marginBottom: 6,
  textTransform: "uppercase" as const,
  letterSpacing: "0.06em",
};

const timeInputStyle = {
  padding: "8px 10px",
  borderRadius: 8,
  fontSize: 14,
  background: "var(--dash-surface-2)",
  border: "1.5px solid var(--dash-border)",
  color: "var(--dash-text)",
  outline: "none",
  width: 100,
};

/** Detecta si dos franjas se superponen (solo franjas normales sin cruce de medianoche) */
function slotsOverlap(
  open1: string,
  close1: string,
  open2: string,
  close2: string,
): boolean {
  const toMin = (hhmm: string) => {
    const [h, m] = hhmm.split(":").map(Number);
    return h * 60 + m;
  };
  const o1 = toMin(open1),
    c1 = toMin(close1);
  const o2 = toMin(open2),
    c2 = toMin(close2);
  if (c1 <= o1 || c2 <= o2) return false; // alguno cruza medianoche — omitir validación
  return o2 < c1 && c2 > o1;
}

export default function BusinessHoursEditor({
  value,
  onChange,
}: {
  value: BusinessHours | null;
  onChange: (value: BusinessHours | null) => void;
}) {
  const enabled = value !== null;
  const hours = value ?? DEFAULT_HOURS;

  function setDay(index: number, patch: Partial<DayHours>) {
    const next = hours.map((d, i) => (i === index ? { ...d, ...patch } : d));
    onChange(next);
  }

  function addSlot2(index: number) {
    const day = hours[index];
    const defaultSlot2: TimeSlot = { open: "20:00", close: "23:30" };
    setDay(index, { slot2: defaultSlot2 });
    void day; // suppress unused warning
  }

  function removeSlot2(index: number) {
    const next = hours.map((d, i) => {
      if (i !== index) return d;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { slot2: _removed, ...rest } = d;
      return rest as DayHours;
    });
    onChange(next);
  }

  function setSlot2(index: number, patch: Partial<TimeSlot>) {
    const day = hours[index];
    if (!day.slot2) return;
    const next = hours.map((d, i) =>
      i === index ? { ...d, slot2: { ...d.slot2!, ...patch } } : d,
    );
    onChange(next);
  }

  function copyToAll(index: number) {
    const source = hours[index];
    onChange(hours.map(() => ({ ...source, slot2: source.slot2 ? { ...source.slot2 } : undefined })));
  }

  return (
    <div>
      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          cursor: "pointer",
          marginBottom: enabled ? 12 : 0,
        }}
      >
        <div
          onClick={() => onChange(enabled ? null : DEFAULT_HOURS)}
          style={{
            width: 44,
            height: 24,
            borderRadius: 999,
            position: "relative",
            flexShrink: 0,
            background: enabled ? "var(--accent)" : "var(--dash-border)",
            transition: "background 0.15s",
            cursor: "pointer",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 2,
              left: enabled ? 22 : 2,
              width: 20,
              height: 20,
              borderRadius: "50%",
              background: "#fff",
              transition: "left 0.15s",
            }}
          />
        </div>
        <span
          style={{ fontSize: 13, fontWeight: 600, color: "var(--dash-text)" }}
        >
          Abrir y cerrar automáticamente según el horario
        </span>
      </label>

      {!enabled && (
        <p style={{ fontSize: 11, color: "var(--dash-muted)", marginTop: 6 }}>
          Desactivado: el estado abierto/cerrado lo manejás vos a mano desde el
          panel principal.
        </p>
      )}

      {enabled && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {hours.map((day, i) => {
            const hasOverlap =
              !day.closed &&
              day.open &&
              day.close &&
              day.slot2 &&
              slotsOverlap(day.open, day.close, day.slot2.open, day.slot2.close);

            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  padding: "10px 12px",
                  borderRadius: 10,
                  background: "var(--dash-surface-2)",
                  border: hasOverlap
                    ? "1.5px solid rgba(234,179,8,0.5)"
                    : "1px solid var(--dash-border)",
                }}
              >
                {/* Fila principal: nombre del día + franja 1 + copiar */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setDay(i, { closed: !day.closed })}
                    style={{
                      width: 84,
                      flexShrink: 0,
                      fontSize: 12,
                      fontWeight: 700,
                      padding: "6px 10px",
                      borderRadius: 8,
                      border: "1px solid",
                      cursor: "pointer",
                      textAlign: "left",
                      background: day.closed
                        ? "transparent"
                        : "rgba(34,197,94,0.12)",
                      color: day.closed ? "var(--dash-muted)" : "#22c55e",
                      borderColor: day.closed
                        ? "var(--dash-border)"
                        : "rgba(34,197,94,0.3)",
                    }}
                  >
                    {DAY_LABELS[i]}
                  </button>

                  {day.closed ? (
                    <span style={{ fontSize: 12, color: "var(--dash-muted)" }}>
                      Cerrado
                    </span>
                  ) : (
                    <>
                      {/* Franja 1 */}
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 11, color: "var(--dash-muted)", fontWeight: 600 }}>
                          1
                        </span>
                        <input
                          type="time"
                          value={day.open ?? "11:00"}
                          onChange={(e) => setDay(i, { open: e.target.value })}
                          style={timeInputStyle}
                          aria-label={`${DAY_LABELS[i]} apertura 1`}
                        />
                        <span style={{ fontSize: 12, color: "var(--dash-muted)" }}>
                          a
                        </span>
                        <input
                          type="time"
                          value={day.close ?? "23:00"}
                          onChange={(e) => setDay(i, { close: e.target.value })}
                          style={timeInputStyle}
                          aria-label={`${DAY_LABELS[i]} cierre 1`}
                        />
                      </div>

                      {/* Botón agregar franja 2 (solo si no existe) */}
                      {!day.slot2 && (
                        <button
                          type="button"
                          onClick={() => addSlot2(i)}
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: "var(--accent)",
                            background: "rgba(var(--accent-rgb, 255,107,53),0.08)",
                            border: "1px dashed rgba(var(--accent-rgb, 255,107,53),0.3)",
                            borderRadius: 6,
                            padding: "4px 8px",
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                          }}
                          title="Agregar segunda franja horaria"
                        >
                          + 2° turno
                        </button>
                      )}
                    </>
                  )}

                  <button
                    type="button"
                    onClick={() => copyToAll(i)}
                    title="Copiar este horario a todos los días"
                    style={{
                      marginLeft: "auto",
                      fontSize: 11,
                      fontWeight: 600,
                      color: "var(--accent)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      textDecoration: "underline",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Copiar a todos
                  </button>
                </div>

                {/* Franja 2 (si existe) */}
                {!day.closed && day.slot2 && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      flexWrap: "wrap",
                      paddingLeft: 94,
                    }}
                  >
                    <span style={{ fontSize: 11, color: "var(--dash-muted)", fontWeight: 600 }}>
                      2
                    </span>
                    <input
                      type="time"
                      value={day.slot2.open}
                      onChange={(e) => setSlot2(i, { open: e.target.value })}
                      style={timeInputStyle}
                      aria-label={`${DAY_LABELS[i]} apertura 2`}
                    />
                    <span style={{ fontSize: 12, color: "var(--dash-muted)" }}>
                      a
                    </span>
                    <input
                      type="time"
                      value={day.slot2.close}
                      onChange={(e) => setSlot2(i, { close: e.target.value })}
                      style={timeInputStyle}
                      aria-label={`${DAY_LABELS[i]} cierre 2`}
                    />
                    <button
                      type="button"
                      onClick={() => removeSlot2(i)}
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: "#ef4444",
                        background: "rgba(239,68,68,0.08)",
                        border: "1px solid rgba(239,68,68,0.2)",
                        borderRadius: 6,
                        padding: "4px 8px",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                      title="Eliminar segundo horario"
                    >
                      Eliminar
                    </button>
                  </div>
                )}

                {/* Warning de superposición */}
                {hasOverlap && (
                  <p
                    style={{
                      fontSize: 11,
                      color: "#ca8a04",
                      margin: 0,
                      paddingLeft: 94,
                    }}
                  >
                    ⚠️ Las franjas se superponen — revisá los horarios.
                  </p>
                )}
              </div>
            );
          })}
          <p style={{ fontSize: 11, color: "var(--dash-muted)" }}>
            Los horarios que crucen la medianoche (ej: 20:00 a 02:00) se
            calculan bien. Podés agregar un segundo turno por día (ej: 11:30–15:00
            y 20:00–00:30).
          </p>
        </div>
      )}
    </div>
  );
}
