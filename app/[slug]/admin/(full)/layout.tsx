import { getSessionUser, getTenantRole } from "@/lib/authz";
import { getTenant } from "@/lib/tenants";
import { redirect } from "next/navigation";

/**
 * Segmentos que requieren rol admin/superadmin del tenant.
 * El personal de cocina/mozo (role="staff") solo puede acceder a /pedidos,
 * fuera de este route group — ver app/[slug]/admin/layout.tsx.
 *
 * getSessionUser/getTenant/getTenantRole están cacheados por request, así
 * que este layout reusa los resultados del layout padre sin re-consultar.
 */
export default async function FullAdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [user, tenant] = await Promise.all([getSessionUser(), getTenant(slug)]);
  if (!user) redirect("/login");
  if (!tenant) redirect(`/${slug}/admin`);

  const access = await getTenantRole(user.id, tenant.id);
  const isFullAccess = access.direct === "admin" || access.superadmin;
  if (!isFullAccess) redirect(`/${slug}/admin/pedidos`);

  return <>{children}</>;
}
