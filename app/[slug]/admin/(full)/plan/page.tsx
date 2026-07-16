import { getPlanLimits } from "@/lib/plans";
import { getTenantId } from "@/lib/tenants";
import { createServerClient } from "@/lib/supabase";
import {
  getEffectiveSubscription,
  getProductCount,
  trialDaysLeft,
} from "@/lib/subscriptions";
import type { Metadata } from "next";
import type { PlanId } from "@/lib/plans";
import PlanCard from "@/components/admin/PlanCard";
import BackButton from "@/components/BackButton";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Mi Plan" };

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
// ponytail: "productos últimos 30 días / 30 * días restantes" — sin
// regresión lineal, alcanza para un aviso orientativo.
const MIN_PRODUCTS_TO_PROJECT = 5;
const MIN_SPAN_DAYS_TO_PROJECT = 3;

/**
 * Estima en cuántos días se llega al límite del plan, a partir del ritmo de
 * alta de productos en los últimos 30 días. Devuelve null cuando no hay
 * suficiente historial para que la proyección signifique algo (pocos
 * productos, todos cargados casi el mismo día, o ritmo actual nulo) — mejor
 * no mostrar nada que inventar un número.
 */
function estimateDaysToLimit(
  createdAtList: string[],
  currentCount: number,
  maxProducts: number | null,
): number | null {
  if (maxProducts === null || currentCount >= maxProducts) return null;
  if (createdAtList.length < MIN_PRODUCTS_TO_PROJECT) return null;

  const now = Date.now();
  const times = createdAtList.map((iso) => new Date(iso).getTime());
  const spanDays = (now - Math.min(...times)) / 86_400_000;
  if (spanDays < MIN_SPAN_DAYS_TO_PROJECT) return null;

  const recentCount = times.filter((t) => now - t <= THIRTY_DAYS_MS).length;
  const ratePerDay = recentCount / 30;
  if (ratePerDay <= 0) return null;

  const days = Math.round((maxProducts - currentCount) / ratePerDay);
  return days > 0 ? days : null;
}

export default async function PlanPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const tenantId = await getTenantId(slug);
  if (!tenantId) return null;

  const [subscription, productCount, { data: rawProducts }] = await Promise.all(
    [
      getEffectiveSubscription(tenantId),
      getProductCount(tenantId),
      createServerClient()
        .from("products")
        .select("created_at")
        .eq("tenant_id", tenantId),
    ],
  );

  const currentPlan = (subscription.plan ?? "free") as PlanId;
  const limits = getPlanLimits(currentPlan);
  const trialDays = trialDaysLeft(subscription);
  const daysToLimit = estimateDaysToLimit(
    (rawProducts ?? []).map((p) => p.created_at as string),
    productCount,
    limits.maxProducts,
  );

  return (
    <>
      <div className="px-5 pt-5 md:px-8">
        <BackButton href={`/${slug}/admin`} label="Dashboard" />
      </div>
      <div
        style={{
          padding: "4px 20px 0",
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
        trialDaysLeft={trialDays}
        daysToLimit={daysToLimit}
      />
    </>
  );
}
