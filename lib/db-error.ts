/**
 * Maps internal Supabase/PostgREST error codes to safe client-facing messages.
 * Never expose raw error.message to the client — it can leak table names,
 * column names, constraint names, and other internal DB details.
 */

interface SupabaseError {
  code?: string;
  message?: string;
}

export function safeDbError(
  error: SupabaseError | null | undefined,
  fallback = "Error interno del servidor",
): string {
  if (!error) return fallback;

  // PostgreSQL error codes we can safely surface
  switch (error.code) {
    case "23505":
      return "Ya existe un registro con ese valor (duplicado)";
    case "23503":
      return "Referencia inválida: el registro relacionado no existe";
    case "23502":
      return "Falta un campo requerido";
    case "22P02":
      return "Formato de datos inválido";
    case "42P01":
      // Table not found — should never reach prod, but don't leak name
      return fallback;
    default:
      // Log internally but never forward to client
      console.error("[db-error] Supabase error:", error.code, error.message);
      return fallback;
  }
}
