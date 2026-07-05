"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Camera, Loader2, Check, Copy } from "lucide-react";
import type { Category, Product } from "@/types/supabase";
import { uploadImage, type UploadState } from "./utils";

export function ProductMobileCard({
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
  onDuplicate,
  duplicatingId,
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
  onDuplicate?: (p: Product) => void;
  duplicatingId?: string | null;
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
        {/* Duplicar — espejo del botón de cámara */}
        {onDuplicate && (
          <button
            onClick={() => onDuplicate(product)}
            disabled={duplicatingId !== null}
            title="Duplicar"
            style={
              { WebkitTapHighlightColor: "transparent" } as React.CSSProperties
            }
            className="absolute bottom-2 left-2 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center disabled:opacity-40"
          >
            {duplicatingId === product.id ? (
              <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-white" />
            )}
          </button>
        )}
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

        {product.stock_quantity !== null && (
          <p
            className={`text-xs font-semibold ${product.stock_quantity <= 3 ? "text-amber-400" : "text-zinc-500"}`}
          >
            Stock: {product.stock_quantity}
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
