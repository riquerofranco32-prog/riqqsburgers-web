"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Image from "next/image";
import {
  Search,
  SlidersHorizontal,
  Camera,
  Loader2,
  Check,
} from "lucide-react";
import { Toast } from "@/components/admin/Toast";
import type { Tenant, Category, Product } from "@/types/supabase";

function vibrate(pattern: number | number[]) {
  if (typeof window !== "undefined" && "vibrate" in navigator)
    navigator.vibrate(pattern);
}

// ── Image upload ──────────────────────────────────────────────────────────────

async function uploadImage(
  file: File,
  tenantSlug: string,
  productId?: string,
): Promise<string> {
  const id = productId ?? `temp-${Date.now()}`;
  const form = new FormData();
  form.append("file", file);
  form.append("slug", tenantSlug);
  const res = await fetch(`/api/products/${id}/upload`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? "Error al subir imagen");
  }
  const { url } = (await res.json()) as { url: string };
  return url;
}

// ── Inline image cell ─────────────────────────────────────────────────────────

type UploadState = "idle" | "uploading" | "success" | "error";

function ProductImageCell({
  product,
  tenantSlug,
  categoryEmoji,
  onUploaded,
}: {
  product: Product;
  tenantSlug: string;
  categoryEmoji: string;
  onUploaded: (productId: string, url: string) => void;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [state, setState] = useState<UploadState>("idle");
  const inputRef = useRef<HTMLInputElement>(null);

  const displayUrl = preview ?? product.image_url ?? null;

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);
    setState("uploading");
    try {
      const publicUrl = await uploadImage(file, tenantSlug, product.id);
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_url: publicUrl }),
      });
      if (!res.ok) throw new Error("update failed");
      onUploaded(product.id, publicUrl);
      setState("success");
      setTimeout(() => setState("idle"), 2000);
    } catch {
      setState("error");
      setTimeout(() => setState("idle"), 2500);
    }
  }

  return (
    <div className="relative w-14 h-14 flex-shrink-0 group/img">
      <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-zinc-800">
        {displayUrl ? (
          <Image
            src={displayUrl}
            alt={product.name}
            fill
            sizes="56px"
            className="object-cover object-center"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
              const parent = e.currentTarget.parentElement;
              if (parent) {
                parent.setAttribute("data-error", "1");
              }
            }}
          />
        ) : null}
        {!displayUrl && (
          <div className="w-full h-full flex items-center justify-center text-2xl">
            {categoryEmoji}
          </div>
        )}
      </div>

      {/* Upload overlay */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={state === "uploading"}
        className="absolute inset-0 rounded-xl flex items-center justify-center bg-black/0 group-hover/img:bg-black/55 transition-all"
      >
        {state === "uploading" && (
          <Loader2 className="w-5 h-5 text-white animate-spin" />
        )}
        {state === "success" && <Check className="w-5 h-5 text-emerald-400" />}
        {state === "error" && (
          <span className="text-[9px] text-red-400 font-bold text-center px-1">
            Error
          </span>
        )}
        {state === "idle" && (
          <Camera className="w-4 h-4 text-white opacity-40 group-hover/img:opacity-100 transition-opacity" />
        )}
      </button>

      {/* "Sin foto" badge */}
      {!product.image_url && !preview && (
        <span className="absolute -top-1.5 -right-1.5 text-[8px] font-bold bg-orange-500 text-white px-1 py-0.5 rounded-full leading-none pointer-events-none">
          Sin foto
        </span>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="hidden"
      />
    </div>
  );
}

// ── Form types ────────────────────────────────────────────────────────────────

interface ProductForm {
  name: string;
  description: string;
  price: string;
  category_id: string;
  badge: string;
  image_url: string;
  available: boolean;
  is_featured: boolean;
  featured_order: string;
  extras: Array<{ name: string; price: string }>;
}

const emptyForm: ProductForm = {
  name: "",
  description: "",
  price: "",
  category_id: "",
  badge: "",
  image_url: "",
  available: true,
  is_featured: false,
  featured_order: "0",
  extras: [],
};

// ── Product Modal ─────────────────────────────────────────────────────────────

function ProductModal({
  product,
  categories,
  tenantSlug,
  onSave,
  onClose,
}: {
  product: Product | null;
  categories: Category[];
  tenantSlug: string;
  onSave: (data: ProductForm) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<ProductForm>(
    product
      ? {
          name: product.name,
          description: product.description ?? "",
          price: String(product.price),
          category_id: product.category_id ?? "",
          badge: product.badge ?? "",
          image_url: product.image_url ?? "",
          available: product.available,
          is_featured: product.is_featured ?? false,
          featured_order: String(product.featured_order ?? 0),
          extras: (product.extras ?? []).map(
            (e: { name: string; price: number }) => ({
              name: e.name,
              price: String(e.price),
            }),
          ),
        }
      : emptyForm,
  );
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [nameError, setNameError] = useState("");
  const [priceError, setPriceError] = useState("");
  // Local blob URL shown immediately on file pick, before upload completes
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  function set<K extends keyof ProductForm>(key: K, val: ProductForm[K]) {
    setForm((f) => ({ ...f, [key]: val }));
    if (key === "name") setNameError("");
    if (key === "price") setPriceError("");
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError("");
    // Show local preview immediately — no waiting for upload
    setPreviewUrl(URL.createObjectURL(file));
    setUploading(true);
    try {
      const url = await uploadImage(file, tenantSlug, product?.id);
      set("image_url", url);
      setPreviewUrl(url);
    } catch {
      setPreviewUrl(null);
      setUploadError("Error al subir imagen. Podés pegar una URL manualmente.");
    } finally {
      setUploading(false);
    }
  }

  function validate() {
    let ok = true;
    if (!form.name.trim()) {
      setNameError("El nombre es obligatorio");
      ok = false;
    }
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) < 0) {
      setPriceError("Ingresá un precio válido");
      ok = false;
    }
    return ok;
  }

  async function doSave() {
    if (!validate()) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-zinc-950 w-full max-w-lg rounded-t-3xl md:rounded-3xl flex flex-col max-h-[92dvh] shadow-2xl border border-zinc-800">
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0 md:hidden">
          <div className="w-10 h-1 rounded-full bg-zinc-700" />
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 flex-shrink-0">
          <h2 className="font-bold font-[family-name:var(--font-syne)]">
            {product ? "Editar producto" : "Nuevo producto"}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
          >
            ×
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            doSave();
          }}
          className="flex-1 overflow-y-auto px-5 py-4"
        >
          <div className="flex flex-col gap-4 pb-4">
            <div>
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide block mb-1.5">
                Nombre *
              </label>
              <input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Ej: AMERICAN"
                style={{ fontSize: 16 }}
                className={`w-full bg-zinc-900 border rounded-xl px-4 py-3 text-white placeholder-zinc-600 outline-none focus:border-yellow-400 transition-colors ${nameError ? "border-red-500" : "border-zinc-700"}`}
              />
              {nameError && (
                <p className="text-red-400 text-xs mt-1">{nameError}</p>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide block mb-1.5">
                Descripción
              </label>
              <textarea
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Ingredientes o descripción"
                rows={2}
                style={{ fontSize: 16 }}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 outline-none focus:border-yellow-400 transition-colors resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide block mb-1.5">
                  Precio (ARS) *
                </label>
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => set("price", e.target.value)}
                  min={0}
                  placeholder="9500"
                  style={{ fontSize: 16 }}
                  className={`w-full bg-zinc-900 border rounded-xl px-4 py-3 text-white placeholder-zinc-600 outline-none focus:border-yellow-400 transition-colors ${priceError ? "border-red-500" : "border-zinc-700"}`}
                />
                {priceError && (
                  <p className="text-red-400 text-xs mt-1">{priceError}</p>
                )}
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide block mb-1.5">
                  Categoría
                </label>
                <select
                  value={form.category_id}
                  onChange={(e) => set("category_id", e.target.value)}
                  style={{ fontSize: 16 }}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white outline-none focus:border-yellow-400 transition-colors"
                >
                  <option value="">Sin categoría</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide block mb-1.5">
                Badge (opcional)
              </label>
              <input
                value={form.badge}
                onChange={(e) => set("badge", e.target.value)}
                placeholder="🔥 Popular"
                style={{ fontSize: 16 }}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 outline-none focus:border-yellow-400 transition-colors"
              />
            </div>

            {/* Image */}
            <div>
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide block mb-1.5">
                Imagen
              </label>
              <div className="flex gap-3 items-start">
                {(previewUrl ?? form.image_url) && (
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-zinc-700">
                    {uploading && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                        <Loader2 className="w-4 h-4 text-white animate-spin" />
                      </div>
                    )}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewUrl ?? form.image_url}
                      alt="preview"
                      className="object-cover w-full h-full"
                    />
                  </div>
                )}
                <div className="flex-1 flex flex-col gap-2">
                  <label className="flex items-center justify-center gap-2 border border-dashed border-zinc-700 rounded-xl px-4 py-3 text-zinc-500 text-sm hover:border-yellow-400 hover:text-white transition-colors cursor-pointer min-h-[48px]">
                    {uploading ? "Subiendo..." : "📁 Subir desde archivo"}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                  <input
                    value={form.image_url}
                    onChange={(e) => set("image_url", e.target.value)}
                    placeholder="O pegá una URL de imagen"
                    style={{ fontSize: 16 }}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 outline-none focus:border-yellow-400 transition-colors"
                  />
                  {uploadError && (
                    <p className="text-red-400 text-xs">{uploadError}</p>
                  )}
                </div>
              </div>
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => set("available", !form.available)}
                className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${form.available ? "bg-yellow-400" : "bg-zinc-700"}`}
              >
                <div
                  className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.available ? "translate-x-5" : "translate-x-0.5"}`}
                />
              </div>
              <span className="text-sm text-white">Disponible</span>
            </label>

            {/* Destacado en "Lo más pedido" */}
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-3 cursor-pointer flex-1">
                <div
                  onClick={() => set("is_featured", !form.is_featured)}
                  className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${form.is_featured ? "bg-orange-500" : "bg-zinc-700"}`}
                >
                  <div
                    className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.is_featured ? "translate-x-5" : "translate-x-0.5"}`}
                  />
                </div>
                <span className="text-sm text-white">
                  ⭐ Destacado{" "}
                  <span className="text-zinc-500">
                    (aparece en &quot;Lo más pedido&quot;)
                  </span>
                </span>
              </label>
              {form.is_featured && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-zinc-500">Orden</span>
                  <input
                    type="number"
                    min="0"
                    value={form.featured_order}
                    onChange={(e) => set("featured_order", e.target.value)}
                    className="w-16 bg-zinc-800 border border-zinc-700 rounded-md px-2 py-1 text-sm text-white text-center"
                  />
                </div>
              )}
            </div>

            {/* Opciones de tamaño */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                  Opciones de tamaño
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      extras: [...f.extras, { name: "", price: "" }],
                    }))
                  }
                  className="text-xs text-yellow-400 font-semibold hover:text-yellow-300 transition-colors"
                >
                  + Agregar
                </button>
              </div>
              <p className="text-xs text-zinc-600 mb-2">
                El precio base es &quot;Simple&quot;. Agregá &quot;Doble&quot;,
                &quot;Triple&quot;, etc. con su precio adicional.
              </p>
              <div className="flex flex-col gap-2">
                {form.extras.map((extra, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input
                      value={extra.name}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          extras: f.extras.map((ex, idx) =>
                            idx === i ? { ...ex, name: e.target.value } : ex,
                          ),
                        }))
                      }
                      placeholder="Ej: Doble"
                      style={{ fontSize: 16 }}
                      className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-white placeholder-zinc-600 outline-none focus:border-yellow-400 transition-colors"
                    />
                    <input
                      type="number"
                      value={extra.price}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          extras: f.extras.map((ex, idx) =>
                            idx === i ? { ...ex, price: e.target.value } : ex,
                          ),
                        }))
                      }
                      placeholder="$+ precio"
                      min={0}
                      style={{ fontSize: 16 }}
                      className="w-28 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-white placeholder-zinc-600 outline-none focus:border-yellow-400 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          extras: f.extras.filter((_, idx) => idx !== i),
                        }))
                      }
                      className="text-zinc-500 hover:text-red-400 transition-colors text-lg px-1"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </form>

        <div className="px-5 py-4 border-t border-zinc-800 flex-shrink-0">
          <button
            onClick={doSave}
            disabled={saving || uploading}
            style={
              {
                WebkitTapHighlightColor: "transparent",
                userSelect: "none",
              } as React.CSSProperties
            }
            className="w-full bg-yellow-400 text-black font-bold py-3.5 rounded-2xl hover:bg-amber-400 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {saving
              ? "Guardando..."
              : product
                ? "Guardar cambios"
                : "Crear producto"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Mobile product card (< md) ────────────────────────────────────────────────

function ProductMobileCard({
  product,
  cat,
  tenantSlug,
  inlinePriceId,
  inlinePriceVal,
  inlinePriceRef,
  inlinePriceEscaped,
  confirmDeleteId,
  deletingId,
  onToggle,
  onEdit,
  onDelete,
  onConfirmDelete,
  onCancelDelete,
  onInlinePriceStart,
  onInlinePriceSave,
  onInlinePriceValChange,
  onUploaded,
  selected,
  onToggleSelect,
}: {
  product: Product;
  cat: Category | undefined;
  tenantSlug: string;
  inlinePriceId: string | null;
  inlinePriceVal: string;
  inlinePriceRef: React.RefObject<HTMLInputElement>;
  inlinePriceEscaped: React.MutableRefObject<boolean>;
  confirmDeleteId: string | null;
  deletingId: string | null;
  onToggle: (p: Product) => void;
  onEdit: (p: Product) => void;
  onDelete: (p: Product) => void;
  onConfirmDelete: (p: Product) => void;
  onCancelDelete: () => void;
  onInlinePriceStart: (p: Product) => void;
  onInlinePriceSave: (p: Product) => void;
  onInlinePriceValChange: (val: string) => void;
  onUploaded: (productId: string, url: string) => void;
  selected: boolean;
  onToggleSelect: (id: string) => void;
}) {
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const displayUrl = localPreview ?? product.image_url ?? null;
  const isEditing = inlinePriceId === product.id;

  async function handleCameraFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLocalPreview(URL.createObjectURL(file));
    setUploadState("uploading");
    try {
      const publicUrl = await uploadImage(file, tenantSlug, product.id);
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_url: publicUrl }),
      });
      if (!res.ok) throw new Error("update failed");
      onUploaded(product.id, publicUrl);
      setUploadState("success");
      setTimeout(() => setUploadState("idle"), 2000);
    } catch {
      setLocalPreview(null);
      setUploadState("error");
      setTimeout(() => setUploadState("idle"), 2500);
    }
  }

  return (
    <div
      className={`bg-zinc-900 rounded-2xl border overflow-hidden flex flex-col transition-opacity ${selected ? "border-yellow-400/60" : "border-zinc-800"} ${!product.available ? "opacity-60" : ""}`}
    >
      {/* Photo */}
      <div className="relative aspect-[4/3] bg-zinc-800">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect(product.id);
          }}
          className="absolute top-2 left-2 z-10 w-6 h-6 rounded-md bg-black/60 flex items-center justify-center"
        >
          <input
            type="checkbox"
            checked={selected}
            readOnly
            className="w-4 h-4 accent-yellow-400 pointer-events-none"
          />
        </button>
        {displayUrl ? (
          <Image
            src={displayUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, 300px"
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">
            {cat?.emoji ?? "🍽️"}
          </div>
        )}
        {/* Camera — opens file picker */}
        <button
          onClick={() => cameraInputRef.current?.click()}
          disabled={uploadState === "uploading"}
          style={
            { WebkitTapHighlightColor: "transparent" } as React.CSSProperties
          }
          className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center disabled:opacity-40"
        >
          {uploadState === "uploading" && (
            <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
          )}
          {uploadState === "success" && (
            <Check className="w-3.5 h-3.5 text-emerald-400" />
          )}
          {(uploadState === "idle" || uploadState === "error") && (
            <Camera className="w-3.5 h-3.5 text-white" />
          )}
        </button>
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          onChange={handleCameraFile}
          className="hidden"
        />
        {product.badge && (
          <span className="absolute top-9 left-2 text-[10px] bg-yellow-400 text-black px-1.5 py-0.5 rounded-full font-bold pointer-events-none">
            {product.badge.replace(/^\S+\s/, "")}
          </span>
        )}
        {!product.available && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none">
            <span className="text-[10px] bg-zinc-800/90 text-zinc-300 px-2 py-0.5 rounded-full font-bold">
              Agotado
            </span>
          </div>
        )}
        {!displayUrl && (
          <span className="absolute top-2 right-2 text-[8px] font-bold bg-orange-500 text-white px-1.5 py-0.5 rounded-full pointer-events-none">
            Sin foto
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-3 flex flex-col gap-2">
        {/* Name + Toggle */}
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-white truncate leading-tight">
              {product.name}
            </p>
            {product.is_featured && (
              <span className="text-[9px] bg-orange-500/15 text-orange-400 border border-orange-500/30 px-1.5 py-0.5 rounded-full font-bold inline-block mt-0.5">
                ⭐ PROMO
              </span>
            )}
          </div>
          <button
            onClick={() => onToggle(product)}
            style={
              {
                WebkitTapHighlightColor: "transparent",
                userSelect: "none",
                width: 44,
                height: 28,
                flexShrink: 0,
              } as React.CSSProperties
            }
            className="flex items-center justify-center"
          >
            <div
              className={`w-10 h-6 rounded-full transition-colors relative ${product.available ? "bg-yellow-400" : "bg-zinc-700"}`}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${product.available ? "translate-x-4" : "translate-x-0.5"}`}
              />
            </div>
          </button>
        </div>

        {/* Price — inline edit on tap */}
        {isEditing ? (
          <input
            ref={inlinePriceRef}
            type="number"
            inputMode="numeric"
            value={inlinePriceVal}
            onChange={(e) => onInlinePriceValChange(e.target.value)}
            onBlur={() => onInlinePriceSave(product)}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
              if (e.key === "Escape") {
                inlinePriceEscaped.current = true;
                e.currentTarget.blur();
              }
            }}
            min={0}
            style={{ fontSize: 16 }}
            className="w-full bg-zinc-800 border border-yellow-400 rounded-xl px-3 py-2 text-yellow-400 font-bold outline-none"
          />
        ) : (
          <button
            onClick={() => onInlinePriceStart(product)}
            style={
              {
                WebkitTapHighlightColor: "transparent",
                userSelect: "none",
              } as React.CSSProperties
            }
            className="flex items-baseline gap-1.5 min-h-[36px] text-left"
          >
            <span className="text-yellow-400 text-sm font-bold">
              ${product.price.toLocaleString("es-AR")}
            </span>
            <span className="text-[9px] text-zinc-600">toca para editar</span>
          </button>
        )}

        {/* Category */}
        {cat && (
          <p className="text-zinc-600 text-xs">
            {cat.emoji} {cat.name}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-0.5">
          <button
            onClick={() => onEdit(product)}
            style={
              {
                WebkitTapHighlightColor: "transparent",
                userSelect: "none",
              } as React.CSSProperties
            }
            className="flex-1 h-11 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            Editar
          </button>
          {confirmDeleteId === product.id ? (
            <div className="flex gap-1 flex-1">
              <button
                onClick={() => onConfirmDelete(product)}
                style={
                  {
                    WebkitTapHighlightColor: "transparent",
                    userSelect: "none",
                  } as React.CSSProperties
                }
                className="flex-1 h-11 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white text-xs font-bold rounded-xl transition-colors"
              >
                Sí, eliminar
              </button>
              <button
                onClick={onCancelDelete}
                style={
                  {
                    WebkitTapHighlightColor: "transparent",
                    userSelect: "none",
                  } as React.CSSProperties
                }
                className="w-11 h-11 bg-zinc-800 text-zinc-400 rounded-xl transition-colors flex items-center justify-center text-xs"
              >
                No
              </button>
            </div>
          ) : (
            <button
              onClick={() => onDelete(product)}
              disabled={deletingId === product.id}
              style={
                {
                  WebkitTapHighlightColor: "transparent",
                  userSelect: "none",
                } as React.CSSProperties
              }
              className="w-11 h-11 bg-zinc-800 hover:bg-red-950 active:bg-red-900 text-zinc-500 hover:text-red-400 rounded-xl transition-colors flex items-center justify-center disabled:opacity-40 text-sm"
            >
              {deletingId === product.id ? "…" : "🗑"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

type SortKey = "default" | "name" | "price-asc" | "price-desc";

export default function ProductsAdmin({
  tenant,
  categories,
  initialProducts,
  canAddMore,
  productLimit,
}: {
  tenant: Tenant;
  categories: Category[];
  initialProducts: Product[];
  canAddMore: boolean;
  productLimit: number | null;
}) {
  const [products, setProducts] = useState(initialProducts);
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [filterCat, setFilterCat] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("default");
  const [toast, setToast] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [inlinePriceId, setInlinePriceId] = useState<string | null>(null);
  const [inlinePriceVal, setInlinePriceVal] = useState("");
  const inlinePriceRef = useRef<HTMLInputElement>(null);
  const inlinePriceEscaped = useRef(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkWorking, setBulkWorking] = useState(false);
  const [bulkConfirmDelete, setBulkConfirmDelete] = useState(false);

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function clearSelection() {
    setSelectedIds(new Set());
    setBulkConfirmDelete(false);
  }

  async function bulkSetAvailable(nextAvailable: boolean) {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setBulkWorking(true);
    const results = await Promise.allSettled(
      ids.map((id) =>
        fetch(`/api/products/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ available: nextAvailable }),
        }).then((res) => {
          if (!res.ok) throw new Error();
          return id;
        }),
      ),
    );
    const okIds = new Set(
      results
        .filter(
          (r): r is PromiseFulfilledResult<string> => r.status === "fulfilled",
        )
        .map((r) => r.value),
    );
    setProducts((prev) =>
      prev.map((p) =>
        okIds.has(p.id) ? { ...p, available: nextAvailable } : p,
      ),
    );
    const failed = ids.length - okIds.size;
    vibrate(failed > 0 ? [50, 30, 50] : 30);
    setToast(
      failed > 0
        ? `${okIds.size} actualizados, ${failed} fallaron`
        : nextAvailable
          ? `${okIds.size} marcados disponibles`
          : `${okIds.size} marcados agotados`,
    );
    setBulkWorking(false);
    clearSelection();
  }

  async function bulkDelete() {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setBulkWorking(true);
    const results = await Promise.allSettled(
      ids.map((id) =>
        fetch(`/api/products/${id}`, { method: "DELETE" }).then((res) => {
          if (!res.ok) throw new Error();
          return id;
        }),
      ),
    );
    const okIds = new Set(
      results
        .filter(
          (r): r is PromiseFulfilledResult<string> => r.status === "fulfilled",
        )
        .map((r) => r.value),
    );
    setProducts((prev) => prev.filter((p) => !okIds.has(p.id)));
    const failed = ids.length - okIds.size;
    vibrate(failed > 0 ? [50, 30, 50] : [60, 40, 60]);
    setToast(
      failed > 0
        ? `${okIds.size} eliminados, ${failed} fallaron`
        : `${okIds.size} productos eliminados`,
    );
    setBulkWorking(false);
    clearSelection();
  }

  useEffect(() => {
    if (inlinePriceId && inlinePriceRef.current) {
      inlinePriceRef.current.focus();
      inlinePriceRef.current.select();
    }
  }, [inlinePriceId]);

  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showModal]);

  const filtered = useMemo(() => {
    let list =
      filterCat === "all"
        ? products
        : filterCat === "unavailable"
          ? products.filter((p) => !p.available)
          : products.filter((p) => p.category_id === filterCat);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q),
      );
    }
    if (sort === "name")
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "price-asc")
      list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "price-desc")
      list = [...list].sort((a, b) => b.price - a.price);
    return list;
  }, [products, filterCat, search, sort]);

  const activeCount = products.filter((p) => p.available).length;
  const inactiveCount = products.length - activeCount;

  function openNew() {
    setEditProduct(null);
    setShowModal(true);
  }

  function openEdit(product: Product) {
    setEditProduct(product);
    setShowModal(true);
  }

  async function handleSave(form: ProductForm) {
    const fields = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      price: parseInt(form.price, 10),
      category_id: form.category_id || null,
      badge: form.badge.trim() || null,
      image_url: form.image_url.trim() || null,
      available: form.available,
      is_featured: form.is_featured,
      featured_order: parseInt(form.featured_order, 10) || 0,
      extras: form.extras
        .filter(
          (e) =>
            e.name.trim() &&
            e.price !== "" &&
            !isNaN(Number(e.price)) &&
            Number(e.price) >= 0,
        )
        .map((e) => ({ name: e.name.trim(), price: Number(e.price) })),
    };

    if (editProduct) {
      // Edit via the authz'd API route (service role) — keeps writes
      // consistent with create/toggle and avoids RLS/anon-key pitfalls.
      try {
        const res = await fetch(`/api/products/${editProduct.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(fields),
        });
        if (res.ok) {
          vibrate(40);
          const updated: Product = { ...editProduct, ...fields };
          setProducts((prev) =>
            prev.map((p) => {
              if (p.id === editProduct.id) return updated;
              // Si este producto queda como PROMO, desactivar is_featured en los demás
              if (fields.is_featured) return { ...p, is_featured: false };
              return p;
            }),
          );
          setToast("Producto actualizado");
          setShowModal(false);
        } else {
          vibrate([50, 30, 50]);
          const data = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          setToast(data.error ?? "Error al actualizar producto");
        }
      } catch {
        vibrate([50, 30, 50]);
        setToast("Error al actualizar producto");
      }
    } else {
      try {
        const res = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...fields,
            slug: tenant.slug,
            sort_order: products.length,
          }),
        });
        if (res.ok) {
          const data: Product = (await res.json()) as Product;
          vibrate(40);
          setProducts((prev) => [
            ...prev.map((p) =>
              fields.is_featured ? { ...p, is_featured: false } : p,
            ),
            data,
          ]);
          setToast("Producto creado");
          setShowModal(false);
        } else {
          vibrate([50, 30, 50]);
          const errData = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          setToast(errData.error ?? "Error al crear producto");
        }
      } catch {
        vibrate([50, 30, 50]);
        setToast("Error al crear producto");
      }
    }
  }

  function requestDelete(product: Product) {
    setConfirmDeleteId(product.id);
    setTimeout(() => {
      setConfirmDeleteId((prev) => (prev === product.id ? null : prev));
    }, 3000);
  }

  async function handleDelete(product: Product) {
    setConfirmDeleteId(null);
    setDeletingId(product.id);
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        vibrate(40);
        setProducts((prev) => prev.filter((p) => p.id !== product.id));
        setToast("Producto eliminado");
      } else {
        vibrate([50, 30, 50]);
        setToast("Error al eliminar producto");
      }
    } catch {
      vibrate([50, 30, 50]);
      setToast("Error al eliminar producto");
    } finally {
      setDeletingId(null);
    }
  }

  function handleImageUploaded(productId: string, url: string) {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, image_url: url } : p)),
    );
  }

  async function saveInlinePrice(product: Product) {
    if (inlinePriceEscaped.current) {
      inlinePriceEscaped.current = false;
      setInlinePriceId(null);
      return;
    }
    const price = parseInt(inlinePriceVal.replace(/\D/g, ""), 10);
    setInlinePriceId(null);
    if (isNaN(price) || price < 0 || price === product.price) return;
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, price } : p)),
    );
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ price }),
      });
      if (!res.ok) throw new Error("update failed");
      vibrate(40);
      setToast("Precio actualizado");
    } catch {
      vibrate([50, 30, 50]);
      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id ? { ...p, price: product.price } : p,
        ),
      );
      setToast("Error al actualizar precio");
    }
  }

  async function toggleAvailable(product: Product) {
    const newVal = !product.available;
    vibrate(40);
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, available: newVal } : p)),
    );
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ available: newVal }),
      });
      if (!res.ok) throw new Error("Failed");
    } catch {
      vibrate([50, 30, 50]);
      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id ? { ...p, available: product.available } : p,
        ),
      );
    }
  }

  return (
    <div className="p-5 md:p-8 flex flex-col gap-5 w-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold font-[family-name:var(--font-syne)]">
            Productos
          </h1>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
              {activeCount} activos
            </span>
            {inactiveCount > 0 && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700 font-medium">
                {inactiveCount} inactivos
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <button
            onClick={canAddMore ? openNew : undefined}
            disabled={!canAddMore}
            style={
              {
                WebkitTapHighlightColor: "transparent",
                userSelect: "none",
              } as React.CSSProperties
            }
            className="bg-yellow-400 text-black text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-amber-400 transition-colors min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-yellow-400"
          >
            {productLimit !== null && canAddMore
              ? `+ Nuevo (${products.length}/${productLimit})`
              : !canAddMore
                ? `Límite alcanzado (${products.length}/${productLimit})`
                : "+ Nuevo"}
          </button>
          {!canAddMore && (
            <p className="text-xs text-zinc-500">Límite del plan alcanzado</p>
          )}
          {canAddMore &&
            productLimit !== null &&
            products.length >= Math.floor(productLimit * 0.8) && (
              <p className="text-xs text-amber-400">
                {products.length}/{productLimit} productos
              </p>
            )}
        </div>
      </div>

      {/* Search + Sort */}
      <div className="flex gap-2 flex-wrap">
        <div className="flex-1 min-w-[180px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar producto..."
            style={{ fontSize: 16 }}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-9 pr-4 py-2.5 text-white placeholder-zinc-600 outline-none focus:border-yellow-400 transition-colors"
          />
        </div>
        <div className="relative flex-shrink-0">
          <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="bg-zinc-900 border border-zinc-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white outline-none focus:border-yellow-400 transition-colors appearance-none cursor-pointer"
          >
            <option value="default">Orden original</option>
            <option value="name">Nombre A-Z</option>
            <option value="price-asc">Precio: menor → mayor</option>
            <option value="price-desc">Precio: mayor → menor</option>
          </select>
        </div>
      </div>

      {/* Category filter */}
      <div
        style={{ WebkitOverflowScrolling: "touch" }}
        className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-0.5"
      >
        <button
          onClick={() => setFilterCat("all")}
          className={`flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-bold border transition-all ${filterCat === "all" ? "bg-yellow-400/10 text-yellow-400 border-yellow-400/35" : "bg-zinc-900 text-zinc-400 border-zinc-700/80 hover:text-white hover:border-zinc-500"}`}
        >
          Todos ({products.length})
        </button>
        {inactiveCount > 0 && (
          <button
            onClick={() => setFilterCat("unavailable")}
            className={`flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-bold border transition-all ${filterCat === "unavailable" ? "bg-red-500/10 text-red-400 border-red-500/35" : "bg-zinc-900 text-zinc-400 border-zinc-700/80 hover:text-white hover:border-zinc-500"}`}
          >
            Agotados ({inactiveCount})
          </button>
        )}
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setFilterCat(cat.id)}
            className={`flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-bold border transition-all ${filterCat === cat.id ? "bg-yellow-400/10 text-yellow-400 border-yellow-400/35" : "bg-zinc-900 text-zinc-400 border-zinc-700/80 hover:text-white hover:border-zinc-500"}`}
          >
            {cat.emoji} {cat.name} (
            {products.filter((p) => p.category_id === cat.id).length})
          </button>
        ))}
      </div>

      {/* Product list */}
      {filtered.length === 0 ? (
        <div className="text-center py-14 text-zinc-500">
          <p className="text-3xl mb-2">🍽️</p>
          <p className="text-sm">
            {search
              ? "Sin resultados para esa búsqueda"
              : "No hay productos. Creá el primero."}
          </p>
        </div>
      ) : (
        <>
          {/* Mobile: 2-column vertical cards */}
          <div className="grid grid-cols-2 gap-3 md:hidden">
            {filtered.map((product) => {
              const cat = categories.find((c) => c.id === product.category_id);
              return (
                <ProductMobileCard
                  key={product.id}
                  product={product}
                  cat={cat}
                  tenantSlug={tenant.slug}
                  inlinePriceId={inlinePriceId}
                  inlinePriceVal={inlinePriceVal}
                  inlinePriceRef={inlinePriceRef}
                  inlinePriceEscaped={inlinePriceEscaped}
                  confirmDeleteId={confirmDeleteId}
                  deletingId={deletingId}
                  onToggle={toggleAvailable}
                  onEdit={openEdit}
                  onDelete={requestDelete}
                  onConfirmDelete={handleDelete}
                  onCancelDelete={() => setConfirmDeleteId(null)}
                  onInlinePriceStart={(p) => {
                    setInlinePriceVal(String(p.price));
                    setInlinePriceId(p.id);
                  }}
                  onInlinePriceSave={saveInlinePrice}
                  onInlinePriceValChange={setInlinePriceVal}
                  onUploaded={handleImageUploaded}
                  selected={selectedIds.has(product.id)}
                  onToggleSelect={toggleSelect}
                />
              );
            })}
          </div>

          {/* Desktop: horizontal rows */}
          <div className="hidden md:flex flex-col gap-2.5">
            {filtered.map((product) => {
              const cat = categories.find((c) => c.id === product.category_id);
              return (
                <div
                  key={product.id}
                  className={`bg-zinc-900 rounded-2xl border flex items-center gap-3 p-3 transition-opacity ${selectedIds.has(product.id) ? "border-yellow-400/60" : "border-zinc-800"} ${product.available ? "" : "opacity-50"}`}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(product.id)}
                    onChange={() => toggleSelect(product.id)}
                    className="w-4 h-4 flex-shrink-0 accent-yellow-400"
                  />
                  <ProductImageCell
                    product={product}
                    tenantSlug={tenant.slug}
                    categoryEmoji={cat?.emoji ?? "🍽️"}
                    onUploaded={handleImageUploaded}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm text-white">
                        {product.name}
                      </p>
                      {product.is_featured && (
                        <span className="text-[10px] bg-orange-500/15 text-orange-400 border border-orange-500/30 px-1.5 py-0.5 rounded-full font-bold">
                          ⭐ PROMO
                        </span>
                      )}
                      {product.badge && (
                        <span className="text-[10px] bg-yellow-400 text-black px-1.5 py-0.5 rounded-full font-bold">
                          {product.badge.replace(/^\S+\s/, "")}
                        </span>
                      )}
                      {!product.available && (
                        <span className="text-[10px] bg-zinc-700 text-zinc-400 px-1.5 py-0.5 rounded-full font-bold">
                          Agotado
                        </span>
                      )}
                    </div>
                    <p className="text-yellow-400 text-sm font-bold">
                      ${product.price.toLocaleString("es-AR")}
                    </p>
                    {cat && (
                      <p className="text-zinc-500 text-xs">
                        {cat.emoji} {cat.name}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => toggleAvailable(product)}
                      title={product.available ? "Deshabilitar" : "Habilitar"}
                      style={
                        {
                          width: 44,
                          height: 44,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          flexShrink: 0,
                          WebkitTapHighlightColor: "transparent",
                          userSelect: "none",
                        } as React.CSSProperties
                      }
                    >
                      <div
                        className={`w-10 h-6 rounded-full transition-colors relative ${product.available ? "bg-yellow-400" : "bg-zinc-700"}`}
                      >
                        <div
                          className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${product.available ? "translate-x-4" : "translate-x-0.5"}`}
                        />
                      </div>
                    </button>
                    <button
                      onClick={() => openEdit(product)}
                      style={
                        {
                          WebkitTapHighlightColor: "transparent",
                          userSelect: "none",
                        } as React.CSSProperties
                      }
                      className="text-xs text-zinc-500 hover:text-white min-h-[44px] px-3 rounded-xl hover:bg-zinc-800 transition-all flex items-center"
                    >
                      Editar
                    </button>
                    {confirmDeleteId === product.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDelete(product)}
                          style={
                            {
                              WebkitTapHighlightColor: "transparent",
                              userSelect: "none",
                            } as React.CSSProperties
                          }
                          className="text-xs text-white bg-red-600 hover:bg-red-500 min-h-[36px] px-3 rounded-xl transition-all font-semibold"
                        >
                          Sí, eliminar
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          style={
                            {
                              WebkitTapHighlightColor: "transparent",
                              userSelect: "none",
                            } as React.CSSProperties
                          }
                          className="text-xs text-zinc-400 hover:text-white min-h-[36px] px-3 rounded-xl hover:bg-zinc-800 transition-all"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => requestDelete(product)}
                        disabled={deletingId === product.id}
                        title="Eliminar"
                        style={
                          {
                            WebkitTapHighlightColor: "transparent",
                            userSelect: "none",
                          } as React.CSSProperties
                        }
                        className="text-xs text-zinc-600 hover:text-red-400 min-h-[44px] px-3 rounded-xl hover:bg-zinc-800 transition-all disabled:opacity-40 flex items-center"
                      >
                        {deletingId === product.id ? "…" : "🗑"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {showModal && (
        <ProductModal
          product={editProduct}
          categories={categories}
          tenantSlug={tenant.slug}
          onSave={handleSave}
          onClose={() => setShowModal(false)}
        />
      )}

      {selectedIds.size > 0 && (
        <div className="fixed bottom-20 lg:bottom-4 left-1/2 -translate-x-1/2 z-[70] bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl px-4 py-3 flex items-center gap-2 flex-nowrap overflow-x-auto max-w-[95vw]">
          <span className="text-sm font-bold text-white px-2 flex-shrink-0">
            {selectedIds.size} seleccionado
            {selectedIds.size !== 1 ? "s" : ""}
          </span>
          <button
            onClick={() => void bulkSetAvailable(false)}
            disabled={bulkWorking}
            className="text-xs font-bold px-3 py-2 rounded-xl bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-40 flex-shrink-0 whitespace-nowrap"
          >
            Marcar agotado
          </button>
          <button
            onClick={() => void bulkSetAvailable(true)}
            disabled={bulkWorking}
            className="text-xs font-bold px-3 py-2 rounded-xl bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-40 flex-shrink-0 whitespace-nowrap"
          >
            Marcar disponible
          </button>
          {bulkConfirmDelete ? (
            <>
              <span className="text-xs text-red-400 font-semibold px-1 flex-shrink-0 whitespace-nowrap">
                ¿Eliminar {selectedIds.size}?
              </span>
              <button
                onClick={() => void bulkDelete()}
                disabled={bulkWorking}
                className="text-xs font-bold px-3 py-2 rounded-xl bg-red-600 text-white hover:bg-red-500 disabled:opacity-40 flex-shrink-0 whitespace-nowrap"
              >
                Sí, eliminar
              </button>
              <button
                onClick={() => setBulkConfirmDelete(false)}
                disabled={bulkWorking}
                className="text-xs font-bold px-3 py-2 rounded-xl bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-40 flex-shrink-0 whitespace-nowrap"
              >
                Cancelar
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setBulkConfirmDelete(true)}
                disabled={bulkWorking}
                className="text-xs font-bold px-3 py-2 rounded-xl bg-red-950 text-red-400 hover:bg-red-900 disabled:opacity-40 flex-shrink-0 whitespace-nowrap"
              >
                Eliminar
              </button>
              <button
                onClick={clearSelection}
                disabled={bulkWorking}
                className="text-xs font-bold px-3 py-2 rounded-xl text-zinc-500 hover:text-zinc-300 disabled:opacity-40 flex-shrink-0 whitespace-nowrap"
              >
                Cancelar
              </button>
            </>
          )}
        </div>
      )}

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}
