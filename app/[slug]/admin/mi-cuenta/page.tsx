import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase";
import { createAuthClient } from "@/lib/auth";
import type { Metadata } from "next";
import type { Tenant } from "@/types/supabase";
import { AccountInfoCard } from "@/components/admin/team/AccountInfoCard";
import { ChangePasswordCard } from "@/components/admin/team/ChangePasswordCard";
import BackButton from "@/components/BackButton";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Mi cuenta" };

export default async function MiCuentaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const db = createServerClient();

  const authClient = await createAuthClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();
  if (!user) redirect("/login");

  const { data: rawTenant } = await db
    .from("tenants")
    .select("id, name, slug")
    .eq("slug", slug)
    .maybeSingle();

  const tenant = rawTenant as Pick<Tenant, "id" | "name" | "slug"> | null;
  if (!tenant) return null;

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

  const role = superAdmin ? "superadmin" : (directAccess?.role ?? "admin");

  return (
    <div className="p-5 md:p-8 flex flex-col gap-6 w-full max-w-lg">
      <BackButton href={`/${slug}/admin`} label="Dashboard" />
      <div>
        <h1 className="text-xl font-bold font-[family-name:var(--font-syne)] text-zinc-100">
          Mi cuenta
        </h1>
        <p className="text-xs text-zinc-500 mt-0.5">
          Tu rol de acceso y los datos de tu cuenta
        </p>
      </div>

      <AccountInfoCard
        email={user.email ?? ""}
        role={role}
        tenantName={tenant.name}
        tenantSlug={tenant.slug}
      />

      {user.email && <ChangePasswordCard userEmail={user.email} />}
    </div>
  );
}
