"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase";
import TakefyyLogo from "@/components/TakefyyLogo";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowser();

    // Supabase procesa el token del hash de la URL automáticamente.
    // Esperamos el evento PASSWORD_RECOVERY para habilitar el form.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });

    // Si ya hay sesión activa (ej: el usuario vuelve a la tab), habilitamos igual.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);
    try {
      const supabase = createSupabaseBrowser();
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });
      if (updateError) {
        setError(
          "No se pudo actualizar la contraseña. El link puede haber expirado.",
        );
      } else {
        setSuccess(true);
        setTimeout(() => router.push("/login"), 2500);
      }
    } catch {
      setError("Error de conexión. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "var(--dash-surface, #1A1D24)",
    border: "1px solid var(--dash-border, #2A2D35)",
    borderRadius: 10,
    padding: "12px 16px",
    color: "var(--dash-text, #F0EDE8)",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.15s",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    color: "var(--dash-muted, #8A8D95)",
    fontSize: 12,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginBottom: 6,
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--brand-dark, #0E1116)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
    >
      <div style={{ width: "100%", maxWidth: 360 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: 40,
          }}
        >
          <TakefyyLogo size="md" />
        </div>

        <div style={{ marginBottom: 28, textAlign: "center" }}>
          <h1
            style={{
              color: "var(--dash-text, #F0EDE8)",
              fontSize: 22,
              fontWeight: 700,
              marginBottom: 6,
            }}
          >
            Nueva contraseña
          </h1>
          <p style={{ color: "var(--dash-muted, #8A8D95)", fontSize: 14 }}>
            {ready
              ? "Elegí una contraseña nueva para tu cuenta."
              : "Verificando el link..."}
          </p>
        </div>

        {!ready && !success && (
          <div
            style={{
              textAlign: "center",
              color: "var(--dash-muted, #8A8D95)",
              fontSize: 14,
              padding: "32px 0",
            }}
          >
            <div
              style={{
                width: 24,
                height: 24,
                border: "2px solid var(--dash-border, #2A2D35)",
                borderTopColor: "var(--accent, #FF6B35)",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
                margin: "0 auto 12px",
              }}
            />
            Cargando...
          </div>
        )}

        {ready && !success && (
          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
          >
            <div>
              <label style={labelStyle}>Nueva contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Mínimo 6 caracteres"
                style={inputStyle}
                onFocus={(e) =>
                  (e.target.style.borderColor = "var(--accent, #FF6B35)")
                }
                onBlur={(e) =>
                  (e.target.style.borderColor = "var(--dash-border, #2A2D35)")
                }
              />
            </div>

            <div>
              <label style={labelStyle}>Confirmar contraseña</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                placeholder="Repetí la contraseña"
                style={inputStyle}
                onFocus={(e) =>
                  (e.target.style.borderColor = "var(--accent, #FF6B35)")
                }
                onBlur={(e) =>
                  (e.target.style.borderColor = "var(--dash-border, #2A2D35)")
                }
              />
            </div>

            {error && (
              <p
                style={{
                  color: "#f87171",
                  fontSize: 13,
                  textAlign: "center",
                  background: "rgba(248,113,113,0.1)",
                  border: "1px solid rgba(248,113,113,0.2)",
                  borderRadius: 8,
                  padding: "8px 12px",
                }}
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                background: loading
                  ? "var(--dash-border)"
                  : "var(--accent, #FF6B35)",
                color: "white",
                fontWeight: 700,
                fontSize: 15,
                padding: "14px",
                borderRadius: 10,
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.15s",
                marginTop: 4,
              }}
            >
              {loading ? "Guardando..." : "Guardar contraseña"}
            </button>
          </form>
        )}

        {success && (
          <div
            style={{
              padding: "20px 16px",
              borderRadius: 10,
              background: "rgba(74,222,128,0.08)",
              border: "1px solid rgba(74,222,128,0.25)",
              color: "#4ade80",
              fontSize: 14,
              textAlign: "center",
              lineHeight: 1.6,
            }}
          >
            <p style={{ margin: "0 0 6px", fontWeight: 700 }}>
              Contraseña actualizada
            </p>
            <p style={{ margin: 0, fontSize: 13, opacity: 0.8 }}>
              Te redirigimos al login...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
