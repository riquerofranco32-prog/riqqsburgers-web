import { getSessionUser, getTenantRole } from "@/lib/authz";
import { getTenant } from "@/lib/tenants";
import { redirect } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import { Toaster } from "sonner";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // En paralelo: auth (red a Supabase Auth) + tenant. Ambos cacheados por
  // request — (full)/layout y las pages reusan el resultado sin re-consultar.
  const [user, tenant] = await Promise.all([getSessionUser(), getTenant(slug)]);
  if (!user) redirect("/login");

  if (!tenant) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#0d0d0d" }}
      >
        <div
          className="text-center"
          style={{ display: "flex", flexDirection: "column", gap: 12 }}
        >
          <p style={{ color: "#fff", fontWeight: 600, fontSize: 18 }}>
            Restaurante &quot;{slug}&quot; no encontrado
          </p>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>
            Verificá que el slug existe en Supabase
          </p>
          <a href="/admin" style={{ color: "#FF6B35", fontSize: 14 }}>
            → Ir al panel Takefyy
          </a>
        </div>
      </div>
    );
  }

  // Verificar acceso: admin del tenant específico O superadmin en cualquier tenant
  const access = await getTenantRole(user.id, tenant.id);
  if (!access.direct && !access.superadmin) redirect("/login");

  const role = access.superadmin ? "superadmin" : (access.direct ?? "admin");

  return (
    <AdminShell
      slug={slug}
      tenantName={tenant.name}
      tenantLogoUrl={tenant.logo_url}
      tenantId={tenant.id}
      userEmail={user.email ?? ""}
      isSuperAdmin={access.superadmin}
      role={role}
    >
      {children}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "var(--dash-surface)",
            border: "1px solid var(--dash-border)",
            color: "var(--dash-text)",
          },
        }}
      />
    </AdminShell>
  );
}
