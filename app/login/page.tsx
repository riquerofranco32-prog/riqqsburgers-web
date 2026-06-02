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
      </div>
    </div>
  );
}
