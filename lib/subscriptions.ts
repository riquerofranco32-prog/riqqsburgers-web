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

// Devuelve la suscripción real vigente: si un trial venció, lo baja a
// free automáticamente (una sola vez, en la primera lectura posterior
// al vencimiento) en vez de depender de un cron aparte.
export async function getEffectiveSubscription(
  tenantId: string,
): Promise<Subscription> {
  const sub = await getOrCreateSubscription(tenantId);

  if (
    sub.status === "trialing" &&
    sub.current_period_end &&
    new Date(sub.current_period_end) < new Date()
  ) {
    // tenants.plan lo sincroniza el trigger sync_tenant_plan al tocar
    // subscriptions.plan — no se actualiza tenants directo (bloqueado por
    // el trigger enforce_plan_immutability).
    const supabase = createServerClient();
    await supabase
      .from("subscriptions")
      .update({ plan: "free", status: "expired" })
      .eq("tenant_id", tenantId);
    return { ...sub, plan: "free", status: "expired" };
  }

  return sub;
}

// Días restantes de trial (null si no está en trial o ya venció)
export function trialDaysLeft(subscription: Subscription): number | null {
  if (subscription.status !== "trialing" || !subscription.current_period_end)
    return null;
  const msLeft =
    new Date(subscription.current_period_end).getTime() - Date.now();
  if (msLeft <= 0) return null;
  return Math.ceil(msLeft / (24 * 60 * 60 * 1000));
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
  const [subscription, current] = await Promise.all([
    getEffectiveSubscription(tenantId),
    getProductCount(tenantId),
  ]);
  const limits = getPlanLimits(subscription.plan as PlanId);

  if (limits.maxProducts === null) {
    return { allowed: true, current, max: null };
  }

  return {
    allowed: current < limits.maxProducts,
    current,
    max: limits.maxProducts,
  };
}

// Cuenta miembros de equipo de un tenant (sin contar superadmin)
export async function getTeamCount(tenantId: string): Promise<number> {
  const supabase = createServerClient();
  const { count, error } = await supabase
    .from("tenant_users")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .neq("role", "superadmin");

  if (error) return 0;
  return count ?? 0;
}

// Verifica si el tenant puede agregar un miembro de equipo más según su plan
export async function canAddTeamMember(
  tenantId: string,
): Promise<{ allowed: boolean; current: number; max: number | null }> {
  const [subscription, current] = await Promise.all([
    getEffectiveSubscription(tenantId),
    getTeamCount(tenantId),
  ]);
  const limits = getPlanLimits(subscription.plan as PlanId);

  if (limits.maxTeamMembers === null) {
    return { allowed: true, current, max: null };
  }

  return {
    allowed: current < limits.maxTeamMembers,
    current,
    max: limits.maxTeamMembers,
  };
}

// Cambia el plan de un tenant. tenants.plan se sincroniza solo, vía el
// trigger sync_tenant_plan sobre subscriptions (un update directo a
// tenants.plan está bloqueado por enforce_plan_immutability).
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

  const { error } = await supabase
    .from("subscriptions")
    .update({
      plan,
      status: "active",
      updated_by: updatedBy,
      notes: notes ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("tenant_id", tenantId);

  if (error)
    throw new Error(`Error actualizando subscription: ${error.message}`);
}
