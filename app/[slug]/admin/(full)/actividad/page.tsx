import { createServerClient } from "@/lib/supabase";
import { getTenantId } from "@/lib/tenants";
import type { Metadata } from "next";
import BackButton from "@/components/BackButton";
import {
  ActivityTable,
  type ActivityRow,
} from "@/components/admin/activity/ActivityTable";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Actividad" };

const MAX_EVENTS = 100;

export default async function ActividadPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenantId = await getTenantId(slug);
  if (!tenantId) return null;

  const db = createServerClient();
  const { data } = await db
    .from("activity_log")
    .select(
      "id, actor_email, action, entity_type, entity_id, metadata, created_at",
    )
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(MAX_EVENTS);

  const events = (data ?? []) as ActivityRow[];

  return (
    <div className="p-5 md:p-8 flex flex-col gap-6 w-full">
      <BackButton href={`/${slug}/admin`} label="Dashboard" />
      <div>
        <h1 className="text-xl font-bold font-[family-name:var(--font-syne)] text-zinc-100">
          Actividad
        </h1>
        <p className="text-xs text-zinc-500 mt-0.5">
          Últimos {MAX_EVENTS} cambios hechos por vos o tu equipo en el panel
        </p>
      </div>

      <ActivityTable events={events} />
    </div>
  );
}
