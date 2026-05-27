import { createServerClient } from "@/lib/supabase";
import { getPlanLimits } from "@/lib/plans";
import { getOrCreateSubscription, getProductCount } from "@/lib/subscriptions";
import type { Metadata } from "next";
import type { Tenant } from "@/types/supabase";
import type { PlanId } from "@/lib/plans";
import PlanCard from "@/components/admin/PlanCard";
import BackButton from "@/components/BackButton";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Mi Plan" };

export default async function PlanPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const db = createServerClient();

  const { data: rawTenant } = await db
    .from("tenants")
    .select("id, name, slug")
    .eq("slug", slug)
    .maybeSingle();

  const tenant = rawTenant as Pick<Tenant, "id" | "name" | "slug"> | null;
  if (!tenant) return null;

  const [subscription, productCount] = await Promise.all([
    getOrCreateSubscription(tenant.id),
    getProductCount(tenant.id),
  ]);

  const currentPlan = (subscription.plan ?? "free") as PlanId;
  const limits = getPlanLimits(currentPlan);

  return (
    <>
      <div className="px-5 pt-5 md:px-8">
        <BackButton href={`/${slug}/admin`} label="Dashboard" />
      </div>
      <div
        style={{
          padding: "4px 20px 0",
          maxWidth: 760,
        }}
      >
        <h1
          style={{
            color: "var(--dash-text)",
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            marginBottom: 2,
          }}
        >
          Mi Plan
        </h1>
        <p style={{ color: "var(--dash-muted)", fontSize: 14 }}>
          Gestioná tu suscripción y conocé los límites de tu plan actual.
        </p>
      </div>
      <PlanCard
        currentPlan={currentPlan}
        productCount={productCount}
        limits={limits}
      />
    </>
  );
}
