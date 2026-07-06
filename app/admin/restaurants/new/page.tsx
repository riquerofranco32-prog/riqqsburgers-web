"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import BackButton from "@/components/BackButton";

function toSlug(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const inputStyle = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: 10,
  fontSize: 14,
  background: "var(--dash-surface-2)",
  border: "1.5px solid var(--dash-border)",
  color: "var(--dash-text)",
  outline: "none",
  boxSizing: "border-box" as const,
  transition: "border-color 0.15s",
  fontFamily: "var(--font-sans)",
};

const labelStyle = {
  display: "block",
  fontSize: 12,
  fontWeight: 600,
  color: "var(--dash-muted)",
  marginBottom: 6,
  textTransform: "uppercase" as const,
  letterSpacing: "0.06em",
};

type SlugState = "idle" | "checking" | "available" | "taken" | "invalid";

const PLAN_OPTIONS = [
  { value: "free", label: "Starter", sub: "Productos ilimitados" },
  { value: "pro", label: "Pro", sub: "Hasta 50 + analytics" },
  { value: "premium", label: "Growth", sub: "Ilimitado" },
] as const;

export default function NewRestaurantPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [slugState, setSlugState] = useState<SlugState>("idle");
  const [form, setForm] = useState({
    name: "",
    slug: "",
    whatsapp_number: "",
    tagline: "",
    accent_color: "#FF6B35",
    logo_url: "",
    address: "",
    schedule: "",
    plan: "free",
    owner_email: "",
    owner_password: "",
    active: true,
  });

  function handleNameChange(name: string) {
    setForm((f) => ({
      ...f,
      name,
      slug: slugEdited ? f.slug : toSlug(name),
    }));
  }

  // ── Chequeo de slug único en tiempo real (debounce) ──────────────────────
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const slug = form.slug.trim();
    if (!slug) {
      setSlugState("idle");
      return;
    }
    if (!/^[a-z0-9-]+$/.test(slug)) {
      setSlugState("invalid");
      return;
    }
    setSlugState("checking");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/admin/restaurants/check-slug?slug=${encodeURIComponent(slug)}`,
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
  }, [form.slug]);

  const slugHint: Record<SlugState, { text: string; color: string }> = {
    idle: {
      text: "Solo minúsculas, números y guiones.",
      color: "var(--dash-muted)",
    },
    checking: {
      text: "Verificando disponibilidad…",
      color: "var(--dash-muted)",
    },
    available: { text: "✓ Disponible", color: "#22c55e" },
    taken: { text: "✕ Ya está en uso", color: "#ef4444" },
    invalid: {
      text: "Formato inválido (solo a-z, 0-9 y guiones)",
      color: "#ef4444",
    },
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (slugState === "taken" || slugState === "invalid") {
      setError("Revisá el slug antes de continuar");
      return;
    }
    if (form.owner_password.length < 8) {
      setError("La contraseña del dueño debe tener al menos 8 caracteres");
      return;
    }
    setLoading(true);
    setError("");

    const res = await fetch("/api/admin/restaurants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: form.slug,
        name: form.name,
        tagline: form.tagline,
        whatsapp_number: form.whatsapp_number,
        accent_color: form.accent_color,
        logo_url: form.logo_url,
        address: form.address,
        schedule: form.schedule,
        plan: form.plan,
        owner_email: form.owner_email,
        owner_password: form.owner_password,
        is_open: form.active,
      }),
    });

    if (res.ok) {
      router.push("/admin/restaurants");
    } else {
      const data = await res.json();
      setError(data.error ?? "Error al crear el restaurante");
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <div style={{ marginBottom: 24 }}>
        <BackButton href="/admin/restaurants" label="Restaurantes" />
        <h1
          style={{
            fontSize: "1.5rem",
            fontWeight: 700,
            color: "var(--dash-text)",
            letterSpacing: "-0.02em",
            marginTop: 12,
            marginBottom: 4,
          }}
        >
          Nuevo restaurante
        </h1>
        <p style={{ fontSize: 14, color: "var(--dash-muted)" }}>
          Completá los datos para agregar un nuevo restaurante a Takefyy.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: 18 }}
      >
        {/* Name */}
        <div>
          <label style={labelStyle}>Nombre del restaurante *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Ej: Riqq's Burgers"
            required
            style={inputStyle}
            onFocus={(e) =>
              (e.currentTarget.style.borderColor = "var(--accent)")
            }
            onBlur={(e) =>
              (e.currentTarget.style.borderColor = "var(--dash-border)")
            }
          />
        </div>

        {/* Slug */}
        <div>
          <label style={labelStyle}>Slug (URL) *</label>
          <div style={{ position: "relative" }}>
            <span
              style={{
                position: "absolute",
                left: 14,
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: 14,
                color: "var(--dash-muted)",
                pointerEvents: "none",
              }}
            >
              takefyy.com/
            </span>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => {
                setSlugEdited(true);
                setForm((f) => ({ ...f, slug: e.target.value.toLowerCase() }));
              }}
              placeholder="mi-restaurante"
              required
              pattern="[a-z0-9-]+"
              title="Solo letras minúsculas, números y guiones"
              style={{
                ...inputStyle,
                paddingLeft: 112,
                fontFamily: "var(--font-mono)",
                borderColor:
                  slugState === "taken" || slugState === "invalid"
                    ? "#ef4444"
                    : slugState === "available"
                      ? "#22c55e"
                      : "var(--dash-border)",
              }}
              onFocus={(e) =>
                (e.currentTarget.style.borderColor = "var(--accent)")
              }
              onBlur={(e) =>
                (e.currentTarget.style.borderColor = "var(--dash-border)")
              }
            />
          </div>
          <p
            style={{
              fontSize: 11,
              color: slugHint[slugState].color,
              marginTop: 4,
            }}
          >
            {slugHint[slugState].text}
          </p>
        </div>

        {/* WhatsApp */}
        <div>
          <label style={labelStyle}>Número de WhatsApp *</label>
          <input
            type="text"
            value={form.whatsapp_number}
            onChange={(e) =>
              setForm((f) => ({ ...f, whatsapp_number: e.target.value }))
            }
            placeholder="549261XXXXXXX"
            required
            style={inputStyle}
            onFocus={(e) =>
              (e.currentTarget.style.borderColor = "var(--accent)")
            }
            onBlur={(e) =>
              (e.currentTarget.style.borderColor = "var(--dash-border)")
            }
          />
          <p style={{ fontSize: 11, color: "var(--dash-muted)", marginTop: 4 }}>
            Con código de país sin +. Ej: 549261XXXXXXX
          </p>
        </div>

        {/* Tagline */}
        <div>
          <label style={labelStyle}>Descripción / Tagline</label>
          <input
            type="text"
            value={form.tagline}
            onChange={(e) =>
              setForm((f) => ({ ...f, tagline: e.target.value }))
            }
            placeholder="Ej: Amor a primera mordida 🍔"
            style={inputStyle}
            onFocus={(e) =>
              (e.currentTarget.style.borderColor = "var(--accent)")
            }
            onBlur={(e) =>
              (e.currentTarget.style.borderColor = "var(--dash-border)")
            }
          />
        </div>

        {/* Logo URL */}
        <div>
          <label style={labelStyle}>URL del logo</label>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {form.logo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={form.logo_url}
                alt=""
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  objectFit: "cover",
                  border: "1.5px solid var(--dash-border)",
                  flexShrink: 0,
                }}
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            )}
            <input
              type="url"
              value={form.logo_url}
              onChange={(e) =>
                setForm((f) => ({ ...f, logo_url: e.target.value }))
              }
              placeholder="https://…/logo.png"
              style={inputStyle}
              onFocus={(e) =>
                (e.currentTarget.style.borderColor = "var(--accent)")
              }
              onBlur={(e) =>
                (e.currentTarget.style.borderColor = "var(--dash-border)")
              }
            />
          </div>
        </div>

        {/* Address */}
        <div>
          <label style={labelStyle}>Dirección</label>
          <input
            type="text"
            value={form.address}
            onChange={(e) =>
              setForm((f) => ({ ...f, address: e.target.value }))
            }
            placeholder="Av. San Martín 1234, Mendoza"
            style={inputStyle}
            onFocus={(e) =>
              (e.currentTarget.style.borderColor = "var(--accent)")
            }
            onBlur={(e) =>
              (e.currentTarget.style.borderColor = "var(--dash-border)")
            }
          />
        </div>

        {/* Schedule */}
        <div>
          <label style={labelStyle}>Horarios</label>
          <input
            type="text"
            value={form.schedule}
            onChange={(e) =>
              setForm((f) => ({ ...f, schedule: e.target.value }))
            }
            placeholder="Lun a Dom de 20 a 00hs"
            style={inputStyle}
            onFocus={(e) =>
              (e.currentTarget.style.borderColor = "var(--accent)")
            }
            onBlur={(e) =>
              (e.currentTarget.style.borderColor = "var(--dash-border)")
            }
          />
        </div>

        {/* Plan */}
        <div>
          <label style={labelStyle}>Plan</label>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 10,
            }}
          >
            {PLAN_OPTIONS.map((opt) => {
              const selected = form.plan === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, plan: opt.value }))}
                  style={{
                    padding: "12px 10px",
                    borderRadius: 10,
                    border: `2px solid ${selected ? "var(--accent)" : "var(--dash-border)"}`,
                    background: selected
                      ? "color-mix(in srgb, var(--accent) 12%, transparent)"
                      : "var(--dash-surface-2)",
                    color: selected ? "var(--accent)" : "var(--dash-text)",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.15s",
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 700 }}>
                    {opt.label}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      marginTop: 2,
                      color: "var(--dash-muted)",
                    }}
                  >
                    {opt.sub}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Owner access */}
        <div
          style={{ borderTop: "1px solid var(--dash-border)", paddingTop: 18 }}
        >
          <p
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "var(--dash-text)",
              marginBottom: 4,
            }}
          >
            Acceso del dueño
          </p>
          <p
            style={{
              fontSize: 12,
              color: "var(--dash-muted)",
              marginBottom: 14,
            }}
          >
            Con estos datos el dueño podrá entrar a{" "}
            <code>takefyy.com/{form.slug || "slug"}/admin</code>.
          </p>

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Email del dueño *</label>
            <input
              type="email"
              value={form.owner_email}
              onChange={(e) =>
                setForm((f) => ({ ...f, owner_email: e.target.value }))
              }
              placeholder="dueno@restaurante.com"
              required
              style={inputStyle}
              onFocus={(e) =>
                (e.currentTarget.style.borderColor = "var(--accent)")
              }
              onBlur={(e) =>
                (e.currentTarget.style.borderColor = "var(--dash-border)")
              }
            />
          </div>

          <div>
            <label style={labelStyle}>Contraseña del dueño *</label>
            <input
              type="password"
              value={form.owner_password}
              onChange={(e) =>
                setForm((f) => ({ ...f, owner_password: e.target.value }))
              }
              placeholder="mínimo 8 caracteres"
              required
              minLength={8}
              style={{ ...inputStyle, fontFamily: "var(--font-mono)" }}
              onFocus={(e) =>
                (e.currentTarget.style.borderColor = "var(--accent)")
              }
              onBlur={(e) =>
                (e.currentTarget.style.borderColor = "var(--dash-border)")
              }
            />
            <p
              style={{ fontSize: 11, color: "var(--dash-muted)", marginTop: 4 }}
            >
              Compartísela con el dueño. Si el email ya existe en Takefyy, se
              reutiliza esa cuenta.
            </p>
          </div>
        </div>

        {/* Active toggle */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "var(--dash-surface-2)",
            border: "1px solid var(--dash-border)",
            borderRadius: 10,
            padding: "12px 14px",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: "var(--dash-text)",
              }}
            >
              Restaurante activo
            </div>
            <div
              style={{ fontSize: 12, color: "var(--dash-muted)", marginTop: 2 }}
            >
              Visible para los clientes al crear
            </div>
          </div>
          <button
            type="button"
            onClick={() => setForm((f) => ({ ...f, active: !f.active }))}
            style={{
              width: 48,
              height: 26,
              borderRadius: 13,
              background: form.active ? "var(--accent)" : "var(--dash-border)",
              border: "none",
              cursor: "pointer",
              position: "relative",
              transition: "background 0.2s",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                position: "absolute",
                top: 3,
                left: form.active ? 26 : 4,
                width: 20,
                height: 20,
                borderRadius: "50%",
                background: "#fff",
                transition: "left 0.2s",
              }}
            />
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              background: "rgba(239,68,68,0.12)",
              border: "1px solid rgba(239,68,68,0.25)",
              color: "#ef4444",
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: 10, paddingTop: 4 }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              flex: 1,
              padding: "11px 0",
              borderRadius: 10,
              background: "var(--accent)",
              color: "#fff",
              fontWeight: 600,
              fontSize: 14,
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              transition: "filter 0.15s",
              fontFamily: "var(--font-sans)",
            }}
            onMouseEnter={(e) => {
              if (!loading) e.currentTarget.style.filter = "brightness(1.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.filter = "";
            }}
          >
            {loading ? "Creando..." : "Crear restaurante"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            style={{
              padding: "11px 20px",
              borderRadius: 10,
              background: "var(--dash-surface-2)",
              color: "var(--dash-muted)",
              fontWeight: 500,
              fontSize: 14,
              border: "1px solid var(--dash-border)",
              cursor: "pointer",
              fontFamily: "var(--font-sans)",
            }}
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
