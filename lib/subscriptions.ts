import { createServerClient } from "./supabase";
import { getPlanLimits, type PlanId } from "./plans";
import type { Subscription } from "@/types/supabase";

// Obtiene la suscripción activa de un tenant.
// Si no existe, retorna un objeto default con plan 'free'.
export async function getOrCreateSubscription(
  tenantId: string,
): Promise<Subscription> {
  const supabase = createServerClient();

  const { data: existing } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (existing) return existing as Subscription;

  const { data: created, error } = await supabase
    .from("subscriptions")
    .insert({ tenant_id: tenantId, plan: "free", status: "active" })
    .select()
    .single();

  if (error || !created) {
    // Fallback en memoria si falla el insert (ej: constraint race condition)
    return {
      id: "",
      tenant_id: tenantId,
      plan: "free",
      status: "active",
      current_period_end: null,
      mp_preapproval_id: null,
      mp_payer_id: null,
      notes: null,
      updated_by: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  return created as Subscription;
}

// Cuenta productos activos de un tenant
export async function getProductCount(tenantId: string): Promise<number> {
  const supabase = createServerClient();
  const { count, error } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId);

  if (error) return 0;
  return count ?? 0;
}

// Verifica si el tenant puede agregar un producto más según su plan
export async function canAddProduct(
  tenantId: string,
): Promise<{ allowed: boolean; current: number; max: number | null }> {
  const subscription = await getOrCreateSubscription(tenantId);
  const limits = getPlanLimits(subscription.plan as PlanId);
  const current = await getProductCount(tenantId);

  if (limits.maxProducts === null) {
    return { allowed: true, current, max: null };
  }

  return {
    allowed: current < limits.maxProducts,
    current,
    max: limits.maxProducts,
  };
}

// Cambia el plan de un tenant. Actualiza subscriptions y tenants.plan (cache).
// Solo usado por super-admin.
export async function updatePlan(
  tenantId: string,
  plan: PlanId,
  updatedBy: string,
  notes?: string,
): Promise<void> {
  const supabase = createServerClient();

  // Asegura que existe la fila en subscriptions antes de actualizar
  await getOrCreateSubscription(tenantId);

  const [subResult, tenantResult] = await Promise.all([
    supabase
      .from("subscriptions")
      .update({
        plan,
        updated_by: updatedBy,
        notes: notes ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("tenant_id", tenantId),
    supabase.from("tenants").update({ plan }).eq("id", tenantId),
  ]);

  if (subResult.error)
    throw new Error(
      `Error actualizando subscription: ${subResult.error.message}`,
    );
  if (tenantResult.error)
    throw new Error(
      `Error actualizando tenant.plan: ${tenantResult.error.message}`,
    );
}
