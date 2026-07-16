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

  const [{ data: rawMembers }, { data: rawActivity }] = await Promise.all([
    db
      .from("tenant_users")
      .select("id, email, role, display_name")
      .eq("tenant_id", tenantId)
      .neq("role", "superadmin")
      .order("role", { ascending: false }),
    db
      .from("activity_log")
      .select("actor_email, created_at")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false }),
  ]);

  const members = rawMembers ?? [];

  // activity_log no tiene user_id, solo actor_email — se linkea por ahí. Ya
  // viene ordenado desc, así que la primera aparición de cada email es la
  // más reciente (no hace falta un GROUP BY server-side).
  const lastActivityByEmail: Record<string, string> = {};
  for (const ev of rawActivity ?? []) {
    if (!(ev.actor_email in lastActivityByEmail)) {
      lastActivityByEmail[ev.actor_email] = ev.created_at;
    }
  }

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

      <TeamAdmin
        slug={slug}
        initialMembers={members}
        lastActivityByEmail={lastActivityByEmail}
      />
    </div>
  );
}
