"use client";

import { useState } from "react";
import { Loader2, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Category, Product } from "@/types/supabase";

interface ParsedRow {
  include: boolean;
  name: string;
  description: string | null;
  price: string;
  category_id: string;
  badge: string | null;
}

function guessCategoryId(name: string | null, categories: Category[]): string {
  if (!name) return "";
  const norm = name.trim().toLowerCase();
  const match = categories.find(
    (c) =>
      c.name.toLowerCase() === norm ||
      c.name.toLowerCase().includes(norm) ||
      norm.includes(c.name.toLowerCase()),
  );
  return match?.id ?? "";
}

export function AIBulkUploadModal({
  categories,
  tenantSlug,
  onDone,
  onClose,
}: {
  categories: Category[];
  tenantSlug: string;
  onDone: (products: Product[]) => void;
  onClose: () => void;
}) {
  const [text, setText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [rows, setRows] = useState<ParsedRow[] | null>(null);
  const [saving, setSaving] = useState(false);

  function handleImagePick(file: File | null) {
    setImageFile(file);
    if (!file) {
      setImagePreview(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleProcess() {
    if (!text.trim() && !imageFile) {
      toast.error("Pegá una lista de productos o subí una foto del menú");
      return;
    }
    setProcessing(true);
    try {
      const payload: {
        slug: string;
        text?: string;
        imageBase64?: string;
        imageMediaType?: string;
      } = { slug: tenantSlug };
      if (text.trim()) payload.text = text.trim();
      if (imageFile) {
        const dataUrl = imagePreview ?? (await fileToDataUrl(imageFile));
        payload.imageBase64 = dataUrl.split(",")[1];
        payload.imageMediaType = imageFile.type;
      }

      const res = await fetch("/api/products/parse-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "No se pudo procesar");
        return;
      }
      const parsed = (
        data.products as Array<{
          name: string;
          description: string | null;
          price: number;
          category_name: string | null;
          badge: string | null;
        }>
      ).map((p) => ({
        include: true,
        name: p.name,
        description: p.description,
        price: String(p.price),
        category_id: guessCategoryId(p.category_name, categories),
        badge: p.badge,
      }));
      setRows(parsed);
      toast.success(
        `${parsed.length} productos detectados. Revisá y confirmá.`,
      );
    } catch {
      toast.error("Error de red al procesar");
    } finally {
      setProcessing(false);
    }
  }

  async function handleConfirm() {
    if (!rows) return;
    const toCreate = rows.filter((r) => r.include);
    if (toCreate.length === 0) {
      toast.error("Seleccioná al menos un producto");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: tenantSlug,
          products: toCreate.map((r) => ({
            name: r.name,
            description: r.description || null,
            price: Number(r.price),
            category_id: r.category_id || null,
            badge: r.badge || null,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "No se pudo guardar");
        return;
      }
      toast.success(`${data.products.length} productos cargados`);
      onDone(data.products as Product[]);
    } catch {
      toast.error("Error de red al guardar");
    } finally {
      setSaving(false);
    }
  }

  function updateRow(i: number, patch: Partial<ParsedRow>) {
    setRows((prev) =>
      prev ? prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)) : prev,
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-zinc-950 w-full max-w-2xl rounded-t-3xl md:rounded-3xl flex flex-col max-h-[92dvh] shadow-2xl border border-zinc-800">
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0 md:hidden">
          <div className="w-10 h-1 rounded-full bg-zinc-700" />
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 flex-shrink-0">
          <h2 className="font-bold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-yellow-400" />
            Carga masiva con IA
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
          >
            ×
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          {!rows && (
            <>
              <div>
                <label className="text-xs font-bold text-zinc-400 mb-1.5 block">
                  Pegá tu lista de productos
                </label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={
                    "Ej:\nHamburguesa clásica - $8500\nPapas fritas - $3200 - con cheddar y bacon"
                  }
                  rows={8}
                  style={{ fontSize: 16 }}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2.5 text-white placeholder-zinc-600 outline-none focus:border-yellow-400 transition-colors resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-400 mb-1.5 block">
                  O subí una foto del menú
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => handleImagePick(e.target.files?.[0] ?? null)}
                  className="text-sm text-zinc-300 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-zinc-800 file:text-white file:text-xs file:font-bold"
                />
                {imagePreview && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imagePreview}
                    alt="Menú"
                    className="mt-2 max-h-48 rounded-xl border border-zinc-800"
                  />
                )}
              </div>
            </>
          )}

          {rows && (
            <div className="space-y-2">
              <p className="text-xs text-zinc-500">
                Revisá, editá o desmarcá antes de confirmar la carga.
              </p>
              {rows.map((row, i) => (
                <div
                  key={i}
                  className={`rounded-xl border p-3 space-y-2 transition-opacity ${
                    row.include
                      ? "border-zinc-700 bg-zinc-900"
                      : "border-zinc-800 bg-zinc-900/40 opacity-50"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={row.include}
                      onChange={(e) =>
                        updateRow(i, { include: e.target.checked })
                      }
                      className="mt-2.5 w-4 h-4 accent-yellow-400"
                    />
                    <input
                      value={row.name}
                      onChange={(e) => updateRow(i, { name: e.target.value })}
                      style={{ fontSize: 16 }}
                      className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-2.5 py-2 text-sm text-white outline-none focus:border-yellow-400"
                    />
                    <div className="relative w-28 flex-shrink-0">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">
                        $
                      </span>
                      <input
                        value={row.price}
                        onChange={(e) =>
                          updateRow(i, { price: e.target.value })
                        }
                        inputMode="decimal"
                        style={{ fontSize: 16 }}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-5 pr-2 py-2 text-sm text-white outline-none focus:border-yellow-400"
                      />
                    </div>
                    <button
                      onClick={() =>
                        setRows((prev) =>
                          prev ? prev.filter((_, idx) => idx !== i) : prev,
                        )
                      }
                      className="w-8 h-8 flex-shrink-0 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <select
                    value={row.category_id}
                    onChange={(e) =>
                      updateRow(i, { category_id: e.target.value })
                    }
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2.5 py-2 text-sm text-white outline-none focus:border-yellow-400 ml-6"
                    style={{ width: "calc(100% - 24px)" }}
                  >
                    <option value="">Sin categoría</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.emoji} {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-zinc-800 flex-shrink-0">
          {!rows ? (
            <button
              onClick={handleProcess}
              disabled={processing}
              className="w-full bg-yellow-400 text-black text-sm font-bold px-4 py-3 rounded-xl hover:bg-amber-400 transition-colors min-h-[48px] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Procesando...
                </>
              ) : (
                "Procesar con IA"
              )}
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setRows(null)}
                disabled={saving}
                className="flex-shrink-0 bg-zinc-800 text-zinc-300 text-sm font-bold px-4 py-3 rounded-xl hover:bg-zinc-700 transition-colors min-h-[48px] disabled:opacity-50"
              >
                Volver
              </button>
              <button
                onClick={handleConfirm}
                disabled={saving}
                className="flex-1 bg-yellow-400 text-black text-sm font-bold px-4 py-3 rounded-xl hover:bg-amber-400 transition-colors min-h-[48px] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Guardando...
                  </>
                ) : (
                  `Confirmar carga (${rows.filter((r) => r.include).length})`
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
