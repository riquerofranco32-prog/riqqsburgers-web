"use client";

import type { BusinessHours, DayHours } from "@/lib/businessHours";

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

  function copyToAll(index: number) {
    const source = hours[index];
    onChange(hours.map(() => ({ ...source })));
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
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {hours.map((day, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                flexWrap: "wrap",
                padding: "8px 10px",
                borderRadius: 10,
                background: "var(--dash-surface-2)",
                border: "1px solid var(--dash-border)",
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
                  <input
                    type="time"
                    value={day.open ?? "11:00"}
                    onChange={(e) => setDay(i, { open: e.target.value })}
                    style={timeInputStyle}
                  />
                  <span style={{ fontSize: 12, color: "var(--dash-muted)" }}>
                    a
                  </span>
                  <input
                    type="time"
                    value={day.close ?? "23:00"}
                    onChange={(e) => setDay(i, { close: e.target.value })}
                    style={timeInputStyle}
                  />
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
          ))}
          <p style={{ fontSize: 11, color: "var(--dash-muted)" }}>
            Los horarios que crucen la medianoche (ej: 20:00 a 02:00) se
            calculan bien — no hace falta partirlos en dos días.
          </p>
        </div>
      )}
    </div>
  );
}
