"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { toast } from "sonner";
import type { Tenant } from "@/types/supabase";

interface Props {
  tenant: Tenant;
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

const sectionTitleStyle = {
  fontSize: 13,
  fontWeight: 700,
  color: "var(--dash-text)",
  textTransform: "uppercase" as const,
  letterSpacing: "0.08em",
  marginBottom: 4,
};

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [hex, setHex] = useState(value);

  function handleColorPicker(v: string) {
    setHex(v);
    onChange(v);
  }

  function handleHexInput(v: string) {
    setHex(v);
    if (/^#[0-9A-Fa-f]{6}$/.test(v)) onChange(v);
  }

  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <input
          type="color"
          value={/^#[0-9A-Fa-f]{6}$/.test(hex) ? hex : "#000000"}
          onChange={(e) => handleColorPicker(e.target.value)}
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            border: "1.5px solid var(--dash-border)",
            background: "none",
            cursor: "pointer",
            padding: 2,
            flexShrink: 0,
          }}
        />
        <input
          type="text"
          value={hex}
          onChange={(e) => handleHexInput(e.target.value)}
          placeholder="#FF6B35"
          maxLength={7}
          style={{ ...inputStyle, fontFamily: "var(--font-mono)", width: 120 }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
          onBlur={(e) =>
            (e.currentTarget.style.borderColor = "var(--dash-border)")
          }
        />
      </div>
    </div>
  );
}

type UploadField = "logo_url" | "banner_url";

async function uploadRestaurantImage(
  file: File,
  tenantSlug: string,
  field: UploadField,
): Promise<string> {
  const body = new FormData();
  body.append("file", file);
  body.append("field", field);

  const res = await fetch(`/api/tenant/${tenantSlug}/upload`, {
    method: "POST",
    body,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? `Error ${res.status}`);
  }

  const { url } = await res.json();
  return url;
}

export default function RestaurantSettingsForm({ tenant }: Props) {
  const [loading, setLoading] = useState(false);
  const [uploadingField, setUploadingField] = useState<UploadField | null>(
    null,
  );
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: tenant.name ?? "",
    tagline: tenant.tagline ?? "",
    whatsapp_number: tenant.whatsapp_number ?? "",
    instagram_handle: tenant.instagram_handle ?? "",
    address: tenant.address ?? "",
    schedule: tenant.schedule ?? "",
    delivery_cost: tenant.delivery_cost ?? 0,
    primary_color: tenant.primary_color ?? "#FF6B35",
    secondary_color: tenant.secondary_color ?? "#2D1B0E",
    background_color: tenant.background_color ?? "#FFFAF7",
    logo_url: tenant.logo_url ?? "",
    banner_url: tenant.banner_url ?? "",
    hero_video_url:
      (tenant as { hero_video_url?: string | null }).hero_video_url ?? "",
    is_open: tenant.is_open,
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleImageUpload(
    e: React.ChangeEvent<HTMLInputElement>,
    field: UploadField,
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingField(field);
    try {
      const url = await uploadRestaurantImage(file, tenant.slug, field);
      set(field, url);
      toast.success(
        field === "logo_url"
          ? "Logo subido correctamente"
          : "Banner subido correctamente",
      );
    } catch (err) {
      console.error("[uploadRestaurantImage] error:", err);
      const msg = err instanceof Error ? err.message : "Error desconocido";
      toast.error(`Error al subir la imagen: ${msg}`);
    } finally {
      setUploadingField(null);
      // Reset input para permitir re-seleccionar el mismo archivo
      e.target.value = "";
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    if (!form.whatsapp_number.trim()) {
      toast.error("El número de WhatsApp es obligatorio");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/tenant/${tenant.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        toast.success("Cambios guardados");
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Error al guardar los cambios");
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 20,
        maxWidth: 680,
      }}
    >
      {/* Info básica */}
      <div className="bg-dash-surface border border-dash-border rounded-xl p-4 md:p-5 flex flex-col gap-4">
        <p style={sectionTitleStyle}>Info básica</p>

        <div>
          <label style={labelStyle}>Nombre del restaurante *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
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

        <div>
          <label style={labelStyle}>Tagline</label>
          <input
            type="text"
            value={form.tagline}
            onChange={(e) => set("tagline", e.target.value)}
            placeholder="Ej: Amor a primera mordida"
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
          <label style={labelStyle}>Número de WhatsApp *</label>
          <input
            type="text"
            value={form.whatsapp_number}
            onChange={(e) => set("whatsapp_number", e.target.value)}
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

        <div>
          <label style={labelStyle}>Costo de envío (delivery)</label>
          <input
            type="number"
            min={0}
            step={1}
            value={form.delivery_cost}
            onChange={(e) => set("delivery_cost", Number(e.target.value))}
            placeholder="0"
            style={inputStyle}
            onFocus={(e) =>
              (e.currentTarget.style.borderColor = "var(--accent)")
            }
            onBlur={(e) =>
              (e.currentTarget.style.borderColor = "var(--dash-border)")
            }
          />
          <p style={{ fontSize: 11, color: "var(--dash-muted)", marginTop: 4 }}>
            En pesos ARS. Poné 0 para delivery gratuito.
          </p>
        </div>

        {/* Toggle is_open */}
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
              Restaurante abierto
            </div>
            <div
              style={{ fontSize: 12, color: "var(--dash-muted)", marginTop: 2 }}
            >
              {form.is_open
                ? "Visible y aceptando pedidos"
                : "Aparece como cerrado en el menú"}
            </div>
          </div>
          <button
            type="button"
            onClick={() => set("is_open", !form.is_open)}
            style={{
              width: 48,
              height: 26,
              borderRadius: 13,
              background: form.is_open ? "var(--accent)" : "var(--dash-border)",
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
                left: form.is_open ? 26 : 4,
                width: 20,
                height: 20,
                borderRadius: "50%",
                background: "#fff",
                transition: "left 0.2s",
              }}
            />
          </button>
        </div>
      </div>

      {/* Presencia */}
      <div className="bg-dash-surface border border-dash-border rounded-xl p-4 md:p-5 flex flex-col gap-4">
        <p style={sectionTitleStyle}>Presencia</p>

        <div>
          <label style={labelStyle}>Instagram</label>
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
              @
            </span>
            <input
              type="text"
              value={form.instagram_handle}
              onChange={(e) => set("instagram_handle", e.target.value)}
              placeholder="mirestaurante"
              style={{ ...inputStyle, paddingLeft: 30 }}
              onFocus={(e) =>
                (e.currentTarget.style.borderColor = "var(--accent)")
              }
              onBlur={(e) =>
                (e.currentTarget.style.borderColor = "var(--dash-border)")
              }
            />
          </div>
        </div>

        <div>
          <label style={labelStyle}>Dirección</label>
          <input
            type="text"
            value={form.address}
            onChange={(e) => set("address", e.target.value)}
            placeholder="Ej: Av. San Martín 1234, Mendoza"
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
          <label style={labelStyle}>Horarios</label>
          <textarea
            value={form.schedule}
            onChange={(e) => set("schedule", e.target.value)}
            placeholder={"Ej: Lun-Vie 11:00–23:00\nSáb-Dom 12:00–00:00"}
            rows={3}
            style={{
              ...inputStyle,
              resize: "vertical",
              minHeight: 80,
              lineHeight: 1.5,
            }}
            onFocus={(e) =>
              (e.currentTarget.style.borderColor = "var(--accent)")
            }
            onBlur={(e) =>
              (e.currentTarget.style.borderColor = "var(--dash-border)")
            }
          />
        </div>
      </div>

      {/* Visual */}
      <div className="bg-dash-surface border border-dash-border rounded-xl p-4 md:p-5 flex flex-col gap-4">
        <p style={sectionTitleStyle}>Visual</p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: 16,
          }}
        >
          <ColorField
            label="Color principal"
            value={form.primary_color}
            onChange={(v) => set("primary_color", v)}
          />
          <ColorField
            label="Color secundario"
            value={form.secondary_color}
            onChange={(v) => set("secondary_color", v)}
          />
          <ColorField
            label="Color de fondo"
            value={form.background_color}
            onChange={(v) => set("background_color", v)}
          />
        </div>
      </div>

      {/* Imágenes */}
      <div className="bg-dash-surface border border-dash-border rounded-xl p-4 md:p-5 flex flex-col gap-4">
        <p style={sectionTitleStyle}>Imágenes</p>

        {/* Logo */}
        <div>
          <label style={labelStyle}>Logo</label>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            {/* Preview */}
            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              disabled={uploadingField === "logo_url"}
              title="Clic para subir logo"
              style={{
                width: 64,
                height: 64,
                borderRadius: 12,
                border: "1.5px dashed var(--dash-border)",
                background: "var(--dash-surface-2)",
                overflow: "hidden",
                cursor:
                  uploadingField === "logo_url" ? "not-allowed" : "pointer",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
              }}
            >
              {form.logo_url ? (
                <Image
                  src={form.logo_url}
                  alt="Logo preview"
                  fill
                  style={{ objectFit: "cover" }}
                  unoptimized
                />
              ) : (
                <span style={{ fontSize: 24, lineHeight: 1 }}>🖼️</span>
              )}
            </button>

            {/* URL + upload button */}
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                disabled={uploadingField === "logo_url"}
                style={{
                  padding: "9px 16px",
                  borderRadius: 8,
                  border: "1.5px dashed var(--dash-border)",
                  background: "var(--dash-surface-2)",
                  color:
                    uploadingField === "logo_url"
                      ? "var(--dash-muted)"
                      : "var(--dash-text)",
                  fontSize: 13,
                  fontWeight: 500,
                  cursor:
                    uploadingField === "logo_url" ? "not-allowed" : "pointer",
                  fontFamily: "var(--font-sans)",
                  textAlign: "left" as const,
                }}
              >
                {uploadingField === "logo_url"
                  ? "Subiendo..."
                  : "📁 Subir desde archivo"}
              </button>
              <input
                type="url"
                value={form.logo_url}
                onChange={(e) => set("logo_url", e.target.value)}
                placeholder="O pegá una URL de imagen"
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
          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleImageUpload(e, "logo_url")}
            style={{ display: "none" }}
          />
        </div>

        {/* Banner */}
        <div>
          <label style={labelStyle}>Banner</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {form.banner_url && (
              <div
                style={{
                  width: "100%",
                  height: 80,
                  borderRadius: 10,
                  overflow: "hidden",
                  border: "1px solid var(--dash-border)",
                  position: "relative",
                }}
              >
                <Image
                  src={form.banner_url}
                  alt="Banner preview"
                  fill
                  style={{ objectFit: "cover" }}
                  unoptimized
                />
              </div>
            )}
            <button
              type="button"
              onClick={() => bannerInputRef.current?.click()}
              disabled={uploadingField === "banner_url"}
              style={{
                padding: "9px 16px",
                borderRadius: 8,
                border: "1.5px dashed var(--dash-border)",
                background: "var(--dash-surface-2)",
                color:
                  uploadingField === "banner_url"
                    ? "var(--dash-muted)"
                    : "var(--dash-text)",
                fontSize: 13,
                fontWeight: 500,
                cursor:
                  uploadingField === "banner_url" ? "not-allowed" : "pointer",
                fontFamily: "var(--font-sans)",
                textAlign: "left" as const,
              }}
            >
              {uploadingField === "banner_url"
                ? "Subiendo..."
                : "📁 Subir banner desde archivo"}
            </button>
            <input
              type="url"
              value={form.banner_url}
              onChange={(e) => set("banner_url", e.target.value)}
              placeholder="O pegá una URL de banner"
              style={inputStyle}
              onFocus={(e) =>
                (e.currentTarget.style.borderColor = "var(--accent)")
              }
              onBlur={(e) =>
                (e.currentTarget.style.borderColor = "var(--dash-border)")
              }
            />
            <input
              ref={bannerInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(e, "banner_url")}
              style={{ display: "none" }}
            />
          </div>
        </div>
      </div>

      {/* Video del hero */}
      <div>
        <label style={labelStyle}>Video del hero (URL)</label>
        <input
          type="url"
          value={form.hero_video_url}
          onChange={(e) => set("hero_video_url", e.target.value)}
          placeholder="https://... .mp4"
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid var(--dash-border)",
            background: "var(--dash-surface-2)",
            color: "var(--dash-text)",
            fontSize: 13,
            boxSizing: "border-box",
          }}
        />
        <p style={{ fontSize: 11, color: "var(--dash-muted)", marginTop: 4 }}>
          Si se define, reemplaza al banner. Usá una URL directa a un .mp4.
        </p>
      </div>

      {/* Acciones */}
      <div style={{ display: "flex", gap: 10 }}>
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "11px 28px",
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
          {loading ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}
