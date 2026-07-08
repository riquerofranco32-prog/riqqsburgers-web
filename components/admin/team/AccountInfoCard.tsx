import { Building2, ShieldCheck } from "lucide-react";

const ROLE_LABEL: Record<string, { label: string; desc: string }> = {
  superadmin: {
    label: "Superadmin",
    desc: "Acceso total a todos los negocios de Takefyy.",
  },
  admin: {
    label: "Administrador",
    desc: "Acceso total a este negocio: productos, precios, config y facturación.",
  },
  staff: {
    label: "Cocina / Mozo",
    desc: "Solo puede ver y gestionar la sección de Pedidos.",
  },
};

export function AccountInfoCard({
  email,
  role,
  tenantName,
  tenantSlug,
}: {
  email: string;
  role: string;
  tenantName: string;
  tenantSlug: string;
}) {
  const roleInfo = ROLE_LABEL[role] ?? { label: role, desc: "" };
  const isSuperAdmin = role === "superadmin";

  return (
    <div
      style={{
        background: "var(--dash-surface)",
        border: "1px solid var(--dash-border)",
        borderRadius: 16,
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <div>
        <p style={{ fontWeight: 700, color: "var(--dash-text)", fontSize: 16 }}>
          {email}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: "rgba(255,107,53,0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <ShieldCheck className="w-4 h-4" style={{ color: "var(--accent)" }} />
        </div>
        <div>
          <p
            style={{
              fontSize: 11,
              color: "var(--dash-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              fontWeight: 700,
            }}
          >
            Rol
          </p>
          <p
            style={{ fontSize: 14, fontWeight: 600, color: "var(--dash-text)" }}
          >
            {roleInfo.label}
          </p>
          {roleInfo.desc && (
            <p
              style={{ fontSize: 12, color: "var(--dash-muted)", marginTop: 2 }}
            >
              {roleInfo.desc}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: "var(--dash-surface-2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Building2
            className="w-4 h-4"
            style={{ color: "var(--dash-muted)" }}
          />
        </div>
        <div>
          <p
            style={{
              fontSize: 11,
              color: "var(--dash-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              fontWeight: 700,
            }}
          >
            Negocio
          </p>
          <p
            style={{ fontSize: 14, fontWeight: 600, color: "var(--dash-text)" }}
          >
            {isSuperAdmin ? "Todos los negocios" : tenantName}
          </p>
          {!isSuperAdmin && (
            <p
              style={{
                fontSize: 12,
                color: "var(--dash-muted)",
                fontFamily: "var(--font-mono)",
                marginTop: 2,
              }}
            >
              /{tenantSlug}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
