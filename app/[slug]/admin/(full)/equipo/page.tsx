import { createServerClient } from "@/lib/supabase";
import { getTenantId } from "@/lib/tenants";
import type { Metadata } from "next";
import { TeamAdmin } from "@/components/admin/team/TeamAdmin";
import BackButton from "@/components/BackButton";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Equipo" };

export default async function EquipoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const db = createServerClient();

  const tenantId = await getTenantId(slug);
  if (!tenantId) return null;

  const { data: rawMembers } = await db
    .from("tenant_users")
    .select("id, email, role")
    .eq("tenant_id", tenantId)
    .neq("role", "superadmin")
    .order("role", { ascending: false });

  const members = rawMembers ?? [];

  return (
    <div className="p-5 md:p-8 flex flex-col gap-6 w-full">
      <BackButton href={`/${slug}/admin`} label="Dashboard" />
      <div>
        <h1 className="text-xl font-bold font-[family-name:var(--font-syne)] text-zinc-100">
          Equipo
        </h1>
        <p className="text-xs text-zinc-500 mt-0.5">
          Dueños/gerentes con acceso total y personal de cocina o mozo con
          acceso solo a Pedidos
        </p>
      </div>

      <TeamAdmin slug={slug} initialMembers={members} />
    </div>
  );
}
