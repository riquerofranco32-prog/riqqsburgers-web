import { redirect } from "next/navigation";
import { getSessionUser, getTenantRole } from "@/lib/authz";
import { getTenant } from "@/lib/tenants";
import { createServerClient } from "@/lib/supabase";
import type { Metadata } from "next";
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

  const [user, tenant] = await Promise.all([getSessionUser(), getTenant(slug)]);
  if (!user) redirect("/login");
  if (!tenant) return null;

  const access = await getTenantRole(user.id, tenant.id);
  const role = access.superadmin ? "superadmin" : (access.direct ?? "admin");

  // Fila propia en tenant_users de este tenant — un superadmin viendo un
  // negocio ajeno puede no tener una (no hay dónde guardar un nombre acá).
  const db = createServerClient();
  const { data: ownMembership } = await db
    .from("tenant_users")
    .select("display_name")
    .eq("user_id", user.id)
    .eq("tenant_id", tenant.id)
    .maybeSingle();

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
        displayName={ownMembership?.display_name ?? null}
        canEditName={!!ownMembership}
      />

      {user.email && <ChangePasswordCard userEmail={user.email} />}
    </div>
  );
}
