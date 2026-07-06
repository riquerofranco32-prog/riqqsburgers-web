"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import type { Category, Product } from "@/types/supabase";
import { uploadImage } from "./utils";

export interface ProductForm {
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
  addons: Array<{ name: string; price: string }>;
  stock_quantity: string;
  ingredients: string[];
}

export const emptyForm: ProductForm = {
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
  addons: [],
  stock_quantity: "",
  ingredients: [],
};

export function ProductModal({
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
          addons: (product.addons ?? []).map(
            (e: { name: string; price: number }) => ({
              name: e.name,
              price: String(e.price),
            }),
          ),
          stock_quantity:
            product.stock_quantity === null
              ? ""
              : String(product.stock_quantity),
          ingredients: product.ingredients ?? [],
        }
      : emptyForm,
  );
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [nameError, setNameError] = useState("");
  const [priceError, setPriceError] = useState("");
  const [stockError, setStockError] = useState("");
  // Local blob URL shown immediately on file pick, before upload completes
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  function set<K extends keyof ProductForm>(key: K, val: ProductForm[K]) {
    setForm((f) => ({ ...f, [key]: val }));
    if (key === "name") setNameError("");
    if (key === "price") setPriceError("");
    if (key === "stock_quantity") setStockError("");
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
    if (
      form.stock_quantity.trim() &&
      (isNaN(Number(form.stock_quantity)) || Number(form.stock_quantity) < 0)
    ) {
      setStockError("Ingresá una cantidad válida");
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

            <div>
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide block mb-1.5">
                Stock (opcional)
              </label>
              <input
                type="number"
                value={form.stock_quantity}
                onChange={(e) => set("stock_quantity", e.target.value)}
                placeholder="Sin control de stock"
                min={0}
                style={{ fontSize: 16 }}
                className={`w-full bg-zinc-900 border rounded-xl px-4 py-3 text-white placeholder-zinc-600 outline-none focus:border-yellow-400 transition-colors ${stockError ? "border-red-500" : "border-zinc-700"}`}
              />
              {stockError && (
                <p className="text-red-400 text-xs mt-1">{stockError}</p>
              )}
              <p className="text-xs text-zinc-600 mt-1">
                Si cargás una cantidad, se descuenta en cada pedido y al llegar
                a 0 se marca automáticamente como agotado.
              </p>
            </div>

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

            {/* Extras — agregados aparte, se suman al precio */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                  Extras
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      addons: [...f.addons, { name: "", price: "" }],
                    }))
                  }
                  className="text-xs text-yellow-400 font-semibold hover:text-yellow-300 transition-colors"
                >
                  + Agregar
                </button>
              </div>
              <p className="text-xs text-zinc-600 mb-2">
                Agregados que el cliente puede sumar aparte, además de la opción
                de tamaño. Ej: &quot;Bacon&quot;, &quot;Cheddar extra&quot;.
              </p>
              <div className="flex flex-col gap-2">
                {form.addons.map((addon, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input
                      value={addon.name}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          addons: f.addons.map((ad, idx) =>
                            idx === i ? { ...ad, name: e.target.value } : ad,
                          ),
                        }))
                      }
                      placeholder="Ej: Bacon"
                      style={{ fontSize: 16 }}
                      className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-white placeholder-zinc-600 outline-none focus:border-yellow-400 transition-colors"
                    />
                    <input
                      type="number"
                      value={addon.price}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          addons: f.addons.map((ad, idx) =>
                            idx === i ? { ...ad, price: e.target.value } : ad,
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
                          addons: f.addons.filter((_, idx) => idx !== i),
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

            {/* Ingredientes removibles — el cliente puede sacarlos sin costo */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                  Ingredientes
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      ingredients: [...f.ingredients, ""],
                    }))
                  }
                  className="text-xs text-yellow-400 font-semibold hover:text-yellow-300 transition-colors"
                >
                  + Agregar
                </button>
              </div>
              <p className="text-xs text-zinc-600 mb-2">
                Ingredientes que vienen incluidos y el cliente puede sacar sin
                costo. Ej: &quot;Lechuga&quot;, &quot;Cebolla&quot;,
                &quot;Panceta&quot;.
              </p>
              <div className="flex flex-col gap-2">
                {form.ingredients.map((ing, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input
                      value={ing}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          ingredients: f.ingredients.map((v, idx) =>
                            idx === i ? e.target.value : v,
                          ),
                        }))
                      }
                      placeholder="Ej: Cebolla"
                      style={{ fontSize: 16 }}
                      className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-white placeholder-zinc-600 outline-none focus:border-yellow-400 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          ingredients: f.ingredients.filter(
                            (_, idx) => idx !== i,
                          ),
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
