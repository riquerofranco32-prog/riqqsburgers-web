"use client";

import type { PlanId, PlanLimits } from "@/lib/plans";
import { PLANS } from "@/lib/plans";
import { Card } from "@/components/ui/admin/Card";
import { Badge } from "@/components/ui/admin/Badge";

interface PlanCardProps {
  currentPlan: PlanId;
  productCount: number;
  limits: PlanLimits;
  trialDaysLeft?: number | null;
  /** true cuando trialDaysLeft viene de un plan pago con vencimiento fijo,
   * no de un trial gratis. */
  isPaidPlan?: boolean;
  /** Días estimados hasta llegar al límite de productos, o null si no hay
   * suficiente historial para proyectar con algo de confianza. */
  daysToLimit?: number | null;
}

function formatDaysToLimit(days: number): string {
  if (days < 14) return `~${days} día${days !== 1 ? "s" : ""}`;
  if (days < 60) return `~${Math.round(days / 7)} semanas`;
  return `~${Math.round(days / 30)} meses`;
}

const PLAN_COLORS: Record<
  PlanId,
  { bg: string; text: string; border: string }
> = {
  free: {
    bg: "var(--dash-surface-2)",
    text: "var(--dash-muted)",
    border: "var(--dash-border)",
  },
  pro: {
    bg: "rgba(255, 107, 53, 0.12)",
    text: "var(--accent)",
    border: "rgba(255, 107, 53, 0.35)",
  },
  premium: {
    bg: "rgba(168, 85, 247, 0.12)",
    text: "#a855f7",
    border: "rgba(168, 85, 247, 0.35)",
  },
};

const WHATSAPP_SUPPORT =
  "https://wa.me/542994247985?text=Hola%2C%20quiero%20actualizar%20mi%20plan%20en%20Takefyy";

export default function PlanCard({
  currentPlan,
  productCount,
  limits,
  trialDaysLeft,
  isPaidPlan = false,
  daysToLimit,
}: PlanCardProps) {
  const isTrialing = trialDaysLeft !== null && trialDaysLeft !== undefined;
  const colors = PLAN_COLORS[currentPlan];
  const isAtLimit =
    limits.maxProducts !== null && productCount >= limits.maxProducts;
  const nearLimit =
    limits.maxProducts !== null &&
    productCount >= Math.floor(limits.maxProducts * 0.8);

  const usagePercent =
    limits.maxProducts !== null
      ? Math.min(100, Math.round((productCount / limits.maxProducts) * 100))
      : null;

  return (
    <div className="p-4 md:p-5 flex flex-col gap-6 w-full">
      {/* Trial countdown */}
      {isTrialing && (
        <div
          style={{
            background:
              trialDaysLeft! <= 3
                ? "var(--dash-danger-bg)"
                : "var(--dash-accent-subtle)",
            border: `1px solid ${trialDaysLeft! <= 3 ? "var(--dash-danger-border)" : "var(--dash-accent-glow)"}`,
            borderRadius: "var(--radius-md)",
            padding: "14px 16px",
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
          }}
        >
          <span style={{ fontSize: 20, flexShrink: 0 }}>✨</span>
          <div>
            <p
              style={{
                color:
                  trialDaysLeft! <= 3 ? "var(--dash-danger)" : "var(--accent)",
                fontWeight: 700,
                fontSize: 14,
                marginBottom: 4,
              }}
            >
              {isPaidPlan
                ? trialDaysLeft === 1
                  ? "Tu plan Pro vence mañana"
                  : `Tu plan Pro vence en ${trialDaysLeft} días`
                : trialDaysLeft === 1
                  ? "Tu prueba Pro termina mañana"
                  : `Estás probando Pro gratis — te quedan ${trialDaysLeft} días`}
            </p>
            <p
              style={{
                color: "var(--dash-muted)",
                fontSize: 13,
                lineHeight: 1.5,
              }}
            >
              {isPaidPlan
                ? "Renová antes del vencimiento para no volver automáticamente al plan Starter."
                : `Cuando termine la prueba volvés automáticamente al plan Starter: perdés analytics, personalización de marca, y tu menú público se recorta a ${PLANS.free.maxProducts} productos.`}{" "}
              <a
                href={WHATSAPP_SUPPORT}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--accent)", fontWeight: 600 }}
              >
                Mantené Pro
              </a>
            </p>
          </div>
        </div>
      )}

      {/* Free upsell banner */}
      {currentPlan === "free" && (
        <div
          style={{
            background: "var(--dash-accent-subtle)",
            border: "1px solid var(--dash-accent-glow)",
            borderRadius: "var(--radius-md)",
            padding: "14px 16px",
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
          }}
        >
          <span style={{ fontSize: 20, flexShrink: 0 }}>⚡</span>
          <div>
            <p
              style={{
                color: "var(--accent)",
                fontWeight: 700,
                fontSize: 14,
                marginBottom: 4,
              }}
            >
              Estás en el plan Starter
            </p>
            <p
              style={{
                color: "var(--dash-muted)",
                fontSize: 13,
                lineHeight: 1.5,
              }}
            >
              Pasá a Pro y desbloqueá hasta 50 productos, analytics y
              personalización de marca.{" "}
              <a
                href={WHATSAPP_SUPPORT}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--accent)", fontWeight: 600 }}
              >
                Contactanos
              </a>
            </p>
          </div>
        </div>
      )}

      {/* Current plan card */}
      <Card accent padding="20px 20px">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
            marginBottom: 20,
          }}
        >
          <div>
            <p
              style={{
                color: "var(--dash-muted)",
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: 6,
              }}
            >
              Tu plan actual
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <h2
                style={{
                  color: "var(--dash-text)",
                  fontSize: 22,
                  fontWeight: 800,
                  letterSpacing: "-0.02em",
                }}
              >
                {limits.label}
              </h2>
              <span
                style={{
                  background: colors.bg,
                  color: colors.text,
                  border: `1px solid ${colors.border}`,
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "3px 10px",
                  borderRadius: 999,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                {limits.label}
              </span>
            </div>
            <p
              style={{ color: "var(--dash-muted)", fontSize: 13, marginTop: 4 }}
            >
              {limits.description}
            </p>
          </div>

          {currentPlan !== "premium" && (
            <a
              href={WHATSAPP_SUPPORT}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: "#25D366",
                color: "#fff",
                fontWeight: 700,
                fontSize: 13,
                padding: "10px 18px",
                borderRadius: 10,
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexShrink: 0,
              }}
            >
              <span style={{ fontSize: 16 }}>💬</span>
              Actualizar plan
            </a>
          )}
        </div>

        {/* Features */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            borderTop: "1px solid var(--dash-border)",
            paddingTop: 16,
          }}
        >
          <Feature
            label="Productos"
            value={
              limits.maxProducts === null
                ? "Ilimitados"
                : `Hasta ${limits.maxProducts}`
            }
            enabled
          />
          <Feature
            label="Analytics"
            value={limits.analyticsEnabled ? "Incluido" : "No incluido"}
            enabled={limits.analyticsEnabled}
          />
          <Feature
            label="Branding personalizado"
            value={limits.customBranding ? "Incluido" : "No incluido"}
            enabled={limits.customBranding}
          />
          <Feature
            label="Miembros de equipo"
            value={
              limits.maxTeamMembers === null
                ? "Ilimitados"
                : `Hasta ${limits.maxTeamMembers}`
            }
            enabled
          />
        </div>

        {/* Usage bar */}
        {limits.maxProducts !== null && (
          <div
            style={{
              marginTop: 20,
              background: "var(--dash-surface-2)",
              borderRadius: 10,
              padding: "12px 14px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <span style={{ color: "var(--dash-muted)", fontSize: 12 }}>
                Uso de productos
              </span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: isAtLimit
                    ? "var(--dash-danger)"
                    : nearLimit
                      ? "var(--dash-warning)"
                      : "var(--dash-text)",
                }}
              >
                {productCount} / {limits.maxProducts}
              </span>
            </div>
            <div
              style={{
                height: 6,
                background: "var(--dash-border)",
                borderRadius: 999,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${usagePercent}%`,
                  borderRadius: 999,
                  background: isAtLimit
                    ? "var(--dash-danger)"
                    : nearLimit
                      ? "var(--dash-warning)"
                      : "var(--accent)",
                  transition: "width 0.4s ease",
                }}
              />
            </div>
            {isAtLimit && (
              <p
                style={{
                  color: "var(--dash-danger)",
                  fontSize: 12,
                  marginTop: 8,
                  fontWeight: 600,
                }}
              >
                Límite alcanzado — actualizá tu plan para agregar más productos
              </p>
            )}
            {!isAtLimit && daysToLimit != null && (
              <p
                style={{
                  color: nearLimit
                    ? "var(--dash-warning)"
                    : "var(--dash-muted)",
                  fontSize: 12,
                  marginTop: 8,
                  fontWeight: nearLimit ? 600 : 400,
                }}
              >
                A este ritmo de carga, llegás al límite en{" "}
                {formatDaysToLimit(daysToLimit)}
              </p>
            )}
          </div>
        )}
      </Card>

      {/* Plan comparison table */}
      <div>
        <h3
          style={{
            color: "var(--dash-text)",
            fontSize: 15,
            fontWeight: 700,
            marginBottom: 14,
          }}
        >
          Comparativa de planes
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {(["free", "pro", "premium"] as PlanId[]).map((planId) => {
            const plan = PLANS[planId];
            const isCurrent = planId === currentPlan;
            const planColor = PLAN_COLORS[planId];
            return (
              <div
                key={planId}
                style={{
                  background: isCurrent ? planColor.bg : "var(--dash-surface)",
                  border: `1px solid ${isCurrent ? planColor.border : "var(--dash-border)"}`,
                  borderRadius: 14,
                  padding: "16px 14px",
                  position: "relative",
                }}
              >
                {isCurrent && (
                  <span
                    style={{
                      position: "absolute",
                      top: -10,
                      left: "50%",
                      transform: "translateX(-50%)",
                      background: planColor.bg,
                      border: `1px solid ${planColor.border}`,
                      color: planColor.text,
                      fontSize: 10,
                      fontWeight: 800,
                      padding: "2px 10px",
                      borderRadius: 999,
                      whiteSpace: "nowrap",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Actual
                  </span>
                )}

                <p
                  style={{
                    color: isCurrent ? planColor.text : "var(--dash-text)",
                    fontWeight: 800,
                    fontSize: 14,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    marginBottom: 8,
                  }}
                >
                  {plan.label}
                </p>
                <div style={{ marginBottom: 12 }}>
                  <span
                    style={{
                      color: "var(--dash-text)",
                      fontSize: 24,
                      fontWeight: 800,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {plan.priceArs === 0
                      ? "Gratis"
                      : `$${plan.priceArs.toLocaleString("es-AR")}`}
                  </span>
                  <span
                    style={{
                      color: "var(--dash-muted)",
                      fontSize: 13,
                      marginLeft: plan.priceArs === 0 ? 6 : 4,
                    }}
                  >
                    {plan.priceArs === 0 ? "para siempre" : "/mes"}
                  </span>
                </div>
                <p
                  style={{
                    color: "var(--dash-muted)",
                    fontSize: 13,
                    lineHeight: 1.4,
                    marginBottom: 16,
                    minHeight: 38,
                  }}
                >
                  {plan.description}
                </p>

                <div
                  style={{ display: "flex", flexDirection: "column", gap: 7 }}
                >
                  <PlanFeatureRow
                    label={
                      plan.maxProducts === null
                        ? "Productos ilimitados"
                        : `Hasta ${plan.maxProducts} productos`
                    }
                    enabled
                  />
                  <PlanFeatureRow
                    label="Analytics"
                    enabled={plan.analyticsEnabled}
                  />
                  <PlanFeatureRow
                    label="Branding propio"
                    enabled={plan.customBranding}
                  />
                  <PlanFeatureRow
                    label={
                      plan.maxTeamMembers === null
                        ? "Equipo ilimitado"
                        : `Hasta ${plan.maxTeamMembers} del equipo`
                    }
                    enabled
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA footer */}
      {currentPlan !== "premium" && (
        <Card
          padding="16px 18px"
          className="flex items-center justify-between flex-wrap gap-3"
        >
          <div>
            <p
              style={{
                color: "var(--dash-text)",
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              ¿Querés más funciones?
            </p>
            <p
              style={{ color: "var(--dash-muted)", fontSize: 13, marginTop: 2 }}
            >
              Contactanos por WhatsApp y te asesoramos sobre el plan que mejor
              se adapta a tu negocio.
            </p>
          </div>
          <a
            href={WHATSAPP_SUPPORT}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: "#25D366",
              color: "#fff",
              fontWeight: 700,
              fontSize: 13,
              padding: "10px 20px",
              borderRadius: 10,
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: 16 }}>💬</span>
            Contactar soporte
          </a>
        </Card>
      )}
    </div>
  );
}

function Feature({
  label,
  value,
  enabled,
}: {
  label: string;
  value: string;
  enabled: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
      }}
    >
      <span style={{ color: "var(--dash-muted)", fontSize: 13 }}>{label}</span>
      <span
        style={{
          color: enabled ? "var(--dash-text)" : "var(--dash-muted)",
          fontSize: 13,
          fontWeight: enabled ? 600 : 400,
          opacity: enabled ? 1 : 0.5,
        }}
      >
        {enabled ? "✓ " : "✗ "}
        {value}
      </span>
    </div>
  );
}

function PlanFeatureRow({
  label,
  enabled,
}: {
  label: string;
  enabled: boolean;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span
        style={{
          fontSize: 11,
          color: enabled ? "var(--dash-success)" : "var(--dash-border)",
          flexShrink: 0,
        }}
      >
        {enabled ? "●" : "○"}
      </span>
      <span
        style={{
          fontSize: 12,
          color: enabled ? "var(--dash-text)" : "var(--dash-muted)",
          opacity: enabled ? 1 : 0.5,
        }}
      >
        {label}
      </span>
    </div>
  );
}
