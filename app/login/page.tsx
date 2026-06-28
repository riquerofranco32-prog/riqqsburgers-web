"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase";
import TakefyyLogo from "@/components/TakefyyLogo";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [resetMode, setResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState("");

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!resetEmail.trim()) return;
    setResetLoading(true);
    setResetError("");
    try {
      const supabase = createSupabaseBrowser();
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(
        resetEmail.trim(),
        {
          redirectTo:
            (typeof window !== "undefined" ? window.location.origin : "") +
            "/reset-password",
        },
      );
      if (resetErr) {
        setResetError("No pudimos enviar el email. Intentá de nuevo.");
      } else {
        setResetSent(true);
      }
    } catch {
      setResetError("Error de conexión. Intentá de nuevo.");
    } finally {
      setResetLoading(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = createSupabaseBrowser();

      const { data, error: authError } = await supabase.auth.signInWithPassword(
        {
          email,
          password,
        },
      );

      if (authError || !data.user) {
        const msg = authError?.message ?? "";
        const translated =
          msg.toLowerCase().includes("invalid login") ||
          msg.toLowerCase().includes("invalid credentials")
            ? "Email o contraseña incorrectos"
            : msg || "Error al iniciar sesión";
        setError(translated);
        setLoading(false);
        return;
      }

      const { data: tuData, error: tuError } = await supabase
        .from("tenant_users")
        .select("role, tenant_id, tenants(slug)")
        .eq("user_id", data.user.id)
        .order("role", { ascending: false }) // superadmin primero
        .limit(1)
        .maybeSingle();

      if (tuError) {
        console.error("[login] tenant_users error:", tuError);
        setError("Error al verificar permisos. Intentá de nuevo.");
        setLoading(false);
        return;
      }

      if (!tuData) {
        setError(
          "No tenés acceso a ningún negocio. Contactá al administrador.",
        );
        setLoading(false);
        return;
      }

      const role = tuData.role;
      const slug = (tuData.tenants as unknown as { slug: string } | null)?.slug;

      if (role === "superadmin") {
        router.push("/admin");
      } else if (slug) {
        router.push(`/${slug}/admin`);
      } else {
        setError("No se encontró el negocio asignado.");
        setLoading(false);
      }
    } catch (err) {
      setError(
        `Error inesperado: ${err instanceof Error ? err.message : String(err)}`,
      );
      setLoading(false);
    }
  }

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
            Bienvenido de vuelta
          </h1>
          <p style={{ color: "var(--dash-muted, #8A8D95)", fontSize: 14 }}>
            Ingresá con tu cuenta para continuar
          </p>
        </div>

        <form
          onSubmit={handleLogin}
          style={{ display: "flex", flexDirection: "column", gap: 16 }}
        >
          <div>
            <label
              style={{
                display: "block",
                color: "var(--dash-muted, #8A8D95)",
                fontSize: 12,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 6,
              }}
            >
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="tu@email.com"
              style={{
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
              }}
              onFocus={(e) =>
                (e.target.style.borderColor = "var(--accent, #FF6B35)")
              }
              onBlur={(e) =>
                (e.target.style.borderColor = "var(--dash-border, #2A2D35)")
              }
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                color: "var(--dash-muted, #8A8D95)",
                fontSize: 12,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 6,
              }}
            >
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              style={{
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
              }}
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
            {loading ? "Ingresando..." : "Ingresar →"}
          </button>
        </form>

        {/* Reset password */}
        {!resetMode && (
          <button
            onClick={() => {
              setResetMode(true);
              setResetEmail(email);
            }}
            style={{
              marginTop: 20,
              width: "100%",
              background: "none",
              border: "none",
              color: "var(--dash-muted, #8A8D95)",
              fontSize: 13,
              cursor: "pointer",
              textAlign: "center",
              padding: "4px 0",
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "var(--accent, #FF6B35)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "var(--dash-muted, #8A8D95)")
            }
          >
            ¿Olvidaste tu contraseña?
          </button>
        )}

        {resetMode && !resetSent && (
          <form
            onSubmit={handleResetPassword}
            style={{
              marginTop: 20,
              display: "flex",
              flexDirection: "column",
              gap: 10,
              borderTop: "1px solid var(--dash-border, #2A2D35)",
              paddingTop: 20,
            }}
          >
            <p
              style={{
                color: "var(--dash-muted, #8A8D95)",
                fontSize: 13,
                textAlign: "center",
              }}
            >
              Ingresá tu email y te enviamos un link para restablecer tu
              contraseña.
            </p>
            <input
              type="email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              required
              placeholder="tu@email.com"
              style={{
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
              }}
              onFocus={(e) =>
                (e.target.style.borderColor = "var(--accent, #FF6B35)")
              }
              onBlur={(e) =>
                (e.target.style.borderColor = "var(--dash-border, #2A2D35)")
              }
            />
            {resetError && (
              <p
                style={{
                  color: "#f87171",
                  fontSize: 13,
                  textAlign: "center",
                }}
              >
                {resetError}
              </p>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                onClick={() => {
                  setResetMode(false);
                  setResetError("");
                }}
                style={{
                  flex: 1,
                  background: "var(--dash-surface, #1A1D24)",
                  border: "1px solid var(--dash-border, #2A2D35)",
                  borderRadius: 10,
                  padding: "11px",
                  color: "var(--dash-muted, #8A8D95)",
                  fontSize: 13,
                  cursor: "pointer",
                  fontWeight: 500,
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={resetLoading}
                style={{
                  flex: 2,
                  background: resetLoading
                    ? "var(--dash-border)"
                    : "var(--accent, #FF6B35)",
                  border: "none",
                  borderRadius: 10,
                  padding: "11px",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: resetLoading ? "not-allowed" : "pointer",
                }}
              >
                {resetLoading ? "Enviando..." : "Enviar link"}
              </button>
            </div>
          </form>
        )}

        {resetSent && (
          <div
            style={{
              marginTop: 20,
              padding: "14px 16px",
              borderRadius: 10,
              background: "rgba(74,222,128,0.08)",
              border: "1px solid rgba(74,222,128,0.25)",
              color: "#4ade80",
              fontSize: 13,
              textAlign: "center",
              lineHeight: 1.5,
            }}
          >
            Te enviamos un email para restablecer tu contraseña. Revisá tu
            bandeja de entrada.
          </div>
        )}
      </div>
    </div>
  );
}
