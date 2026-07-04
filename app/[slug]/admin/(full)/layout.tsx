import { createServerClient } from "@/lib/supabase";
import { createAuthClient } from "@/lib/auth";
import { redirect } from "next/navigation";

/**
 * Segmentos que requieren rol admin/superadmin del tenant.
 * El personal de cocina/mozo (role="staff") solo puede acceder a /pedidos,
 * fuera de este route group — ver app/[slug]/admin/layout.tsx.
 */
export default async function FullAdminLayout({
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

  const { data: tenant } = await db
    .from("tenants")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (!tenant) redirect(`/${slug}/admin`);

  const [{ data: directAccess }, { data: superAdmin }] = await Promise.all([
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
      .maybeSingle(),
  ]);

  const isFullAccess = directAccess?.role === "admin" || !!superAdmin;
  if (!isFullAccess) redirect(`/${slug}/admin/pedidos`);

  return <>{children}</>;
}
