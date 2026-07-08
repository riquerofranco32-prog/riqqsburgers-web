import { getTenant } from "@/lib/tenants";
import type { Metadata } from "next";
import RestaurantSettingsForm from "@/components/admin/RestaurantSettingsForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Configuración" };

export default async function ConfiguracionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const tenant = await getTenant(slug);

  if (!tenant) {
    return (
      <div
        style={{
          padding: "40px 24px",
          color: "var(--dash-muted)",
          fontSize: 14,
        }}
      >
        Restaurante no encontrado.
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 w-full pb-12">
      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            fontSize: "1.4rem",
            fontWeight: 700,
            color: "var(--dash-text)",
            letterSpacing: "-0.02em",
            marginBottom: 4,
          }}
        >
          Configuración
        </h1>
        <p style={{ fontSize: 14, color: "var(--dash-muted)" }}>
          Editá los datos de tu restaurante. Los cambios se aplican de
          inmediato.
        </p>
      </div>

      <RestaurantSettingsForm tenant={tenant} />
    </div>
  );
}
