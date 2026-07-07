import { createServerClient } from "@/lib/supabase";
import { createAuthClient } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import { Toaster } from "sonner";
import type { Tenant } from "@/types/supabase";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const authClient = await createAuthClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();
  if (!user) redirect("/login");

  const db = createServerClient();

  const { data: rawTenant } = await db
    .from("tenants")
    .select("id, name, slug, logo_url")
    .eq("slug", slug)
    .maybeSingle();

  const tenant = rawTenant as Pick<
    Tenant,
    "id" | "name" | "slug" | "logo_url"
  > | null;
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
  const [{ data: directAccess }, { data: superAdminAccess }] =
    await Promise.all([
      db
        .from("tenant_users")
        .select("role")
        .eq("user_id", user.id)
        .eq("tenant_id", tenant.id)
        .maybeSingle(),
      db
        .from("tenant_users")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "superadmin")
        .limit(1)
        .maybeSingle(),
    ]);

  if (!directAccess && !superAdminAccess) redirect("/login");

  const role = superAdminAccess
    ? "superadmin"
    : (directAccess?.role ?? "admin");

  return (
    <AdminShell
      slug={slug}
      tenantName={tenant.name}
      tenantLogoUrl={tenant.logo_url}
      tenantId={tenant.id}
      userEmail={user.email ?? ""}
      isSuperAdmin={!!superAdminAccess}
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
