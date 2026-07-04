"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import TakefyyLogo from "@/components/TakefyyLogo";
import { createSupabaseBrowser } from "@/lib/supabase";

function toSlug(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

type SlugState = "idle" | "checking" | "available" | "taken" | "invalid";

const inputStyle = {
  width: "100%",
  background: "var(--dash-surface, #1A1D24)",
  border: "1px solid var(--dash-border, #2A2D35)",
  borderRadius: 10,
  padding: "12px 16px",
  color: "var(--dash-text, #F0EDE8)",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box" as const,
  transition: "border-color 0.15s",
};

const labelStyle = {
  display: "block",
  color: "var(--dash-muted, #8A8D95)",
  fontSize: 12,
  fontWeight: 600,
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
  marginBottom: 6,
};

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [slugState, setSlugState] = useState<SlugState>("idle");

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleNameChange(value: string) {
    setName(value);
    if (!slugEdited) setSlug(toSlug(value));
  }

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const s = slug.trim();
    if (!s) {
      setSlugState("idle");
      return;
    }
    if (!/^[a-z0-9-]+$/.test(s)) {
      setSlugState("invalid");
      return;
    }
    setSlugState("checking");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/signup/check-slug?slug=${encodeURIComponent(s)}`,
        );
        const data = (await res.json()) as {
          available?: boolean;
          valid?: boolean;
        };
        if (data.valid === false) setSlugState("invalid");
        else setSlugState(data.available ? "available" : "taken");
      } catch {
        setSlugState("idle");
      }
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [slug]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (slugState === "taken" || slugState === "invalid") {
      setError("Elegí un nombre de local disponible");
      return;
    }
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug,
          whatsapp_number: whatsapp,
          email,
          password,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        slug?: string;
        error?: string;
      };
      if (!res.ok || !data.slug) {
        setError(data.error ?? "Error al crear tu cuenta");
        setLoading(false);
        return;
      }

      // Loguear al dueño automáticamente y llevarlo directo a su panel
      const supabase = createSupabaseBrowser();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (authError) {
        router.push("/login");
        return;
      }
      router.push(`/${data.slug}/admin`);
    } catch {
      setError("Error de conexión. Intentá de nuevo.");
      setLoading(false);
    }
  }

  const slugHint: Record<SlugState, string | null> = {
    idle: null,
    checking: "Verificando disponibilidad...",
    available: `takefyy.com/${slug} ✓ disponible`,
    taken: "Ese nombre ya está en uso",
    invalid: "Solo letras minúsculas, números y guiones",
  };
  const slugHintColor: Record<SlugState, string> = {
    idle: "var(--dash-muted, #8A8D95)",
    checking: "var(--dash-muted, #8A8D95)",
    available: "#4ade80",
    taken: "#f87171",
    invalid: "#f87171",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--brand-dark, #0E1116)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1rem",
      }}
    >
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: 32,
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
            Creá tu menú digital
          </h1>
          <p style={{ color: "var(--dash-muted, #8A8D95)", fontSize: 14 }}>
            14 días de Pro gratis, sin tarjeta
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: 16 }}
        >
          <div>
            <label style={labelStyle}>Nombre del local</label>
            <input
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
              placeholder="La Birra Perfecta"
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
            <label style={labelStyle}>Link de tu menú</label>
            <input
              value={slug}
              onChange={(e) => {
                setSlugEdited(true);
                setSlug(toSlug(e.target.value));
              }}
              required
              placeholder="la-birra-perfecta"
              style={inputStyle}
              onFocus={(e) =>
                (e.target.style.borderColor = "var(--accent, #FF6B35)")
              }
              onBlur={(e) =>
                (e.target.style.borderColor = "var(--dash-border, #2A2D35)")
              }
            />
            {slugHint[slugState] && (
              <p
                style={{
                  fontSize: 12,
                  marginTop: 6,
                  color: slugHintColor[slugState],
                }}
              >
                {slugHint[slugState]}
              </p>
            )}
          </div>

          <div>
            <label style={labelStyle}>WhatsApp del negocio</label>
            <input
              type="tel"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              required
              placeholder="11 2345 6789"
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
            <label style={labelStyle}>Tu email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="tu@email.com"
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
            <label style={labelStyle}>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Mínimo 8 caracteres"
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
            {loading ? "Creando tu cuenta..." : "Crear mi menú gratis →"}
          </button>
        </form>

        <p
          style={{
            marginTop: 20,
            textAlign: "center",
            fontSize: 13,
            color: "var(--dash-muted, #8A8D95)",
          }}
        >
          ¿Ya tenés cuenta?{" "}
          <Link href="/login" style={{ color: "var(--accent, #FF6B35)" }}>
            Iniciá sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
