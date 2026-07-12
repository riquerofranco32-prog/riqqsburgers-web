import { createServerClient } from "@/lib/supabase";

interface LogActivityInput {
  tenantId: string;
  actorEmail: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
}

/**
 * Inserta un registro en activity_log. Nunca debe tumbar la operación
 * principal (confirmar pedido, guardar producto, etc.) — si falla, solo
 * logueamos en consola.
 */
export async function logActivity(input: LogActivityInput): Promise<void> {
  try {
    const supabase = createServerClient();
    const { error } = await supabase.from("activity_log").insert({
      tenant_id: input.tenantId,
      actor_email: input.actorEmail,
      action: input.action,
      entity_type: input.entityType,
      entity_id: input.entityId ?? null,
      metadata: input.metadata ?? null,
    });
    if (error) console.error("[activity-log] insert failed:", error.message);
  } catch (err) {
    console.error("[activity-log] insert threw:", err);
  }
}
