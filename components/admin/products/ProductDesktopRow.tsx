"use client";

import { ChevronUp, ChevronDown, Copy } from "lucide-react";
import type { Category, Product } from "@/types/supabase";
import { ProductImageCell } from "./ProductImageCell";

export function ProductDesktopRow({
  product,
  cat,
  tenantSlug,
  selected,
  onToggleSelect,
  onUploaded,
  confirmDeleteId,
  deletingId,
  onToggle,
  onEdit,
  onDelete,
  onConfirmDelete,
  onCancelDelete,
  onDuplicate,
  duplicatingId,
  onMove,
  canMoveUp,
  canMoveDown,
  reorderBusy,
  onRestock,
}: {
  product: Product;
  cat: Category | undefined;
  tenantSlug: string;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  onUploaded: (productId: string, url: string) => void;
  confirmDeleteId: string | null;
  deletingId: string | null;
  onToggle: (p: Product) => void;
  onEdit: (p: Product) => void;
  onDelete: (p: Product) => void;
  onConfirmDelete: (p: Product) => void;
  onCancelDelete: () => void;
  onDuplicate?: (p: Product) => void;
  duplicatingId?: string | null;
  onMove?: (p: Product, dir: -1 | 1) => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  reorderBusy?: boolean;
  onRestock?: (p: Product) => void;
}) {
  return (
    <div
      className={`bg-zinc-900 rounded-2xl border flex items-center gap-3 p-3 transition-opacity ${selected ? "border-yellow-400/60" : "border-zinc-800"} ${product.available ? "" : "opacity-50"}`}
    >
      {onMove && (
        <div className="flex flex-col flex-shrink-0 -my-1">
          <button
            onClick={() => onMove(product, -1)}
            disabled={!canMoveUp || reorderBusy}
            title="Subir"
            className="w-7 h-6 flex items-center justify-center text-zinc-600 hover:text-white disabled:opacity-25 disabled:hover:text-zinc-600 transition-colors"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <button
            onClick={() => onMove(product, 1)}
            disabled={!canMoveDown || reorderBusy}
            title="Bajar"
            className="w-7 h-6 flex items-center justify-center text-zinc-600 hover:text-white disabled:opacity-25 disabled:hover:text-zinc-600 transition-colors"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      )}
      <input
        type="checkbox"
        checked={selected}
        onChange={() => onToggleSelect(product.id)}
        className="w-4 h-4 flex-shrink-0 accent-yellow-400"
      />
      <ProductImageCell
        product={product}
        tenantSlug={tenantSlug}
        categoryEmoji={cat?.emoji ?? "🍽️"}
        onUploaded={onUploaded}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-sm text-white">{product.name}</p>
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
        {product.stock_quantity !== null && (
          <div className="flex items-center gap-2">
            <p
              className={`text-xs font-semibold ${product.stock_quantity <= 3 ? "text-amber-400" : "text-zinc-600"}`}
            >
              Stock: {product.stock_quantity}
            </p>
            {product.stock_quantity === 0 && onRestock && (
              <button
                onClick={() => onRestock(product)}
                className="text-[10px] font-bold text-yellow-400 hover:text-yellow-300 underline"
              >
                Reponer stock
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={() => onToggle(product)}
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
          onClick={() => onEdit(product)}
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
        {onDuplicate && (
          <button
            onClick={() => onDuplicate(product)}
            disabled={duplicatingId !== null}
            title="Duplicar"
            style={
              {
                WebkitTapHighlightColor: "transparent",
                userSelect: "none",
              } as React.CSSProperties
            }
            className="text-zinc-600 hover:text-white min-h-[44px] px-3 rounded-xl hover:bg-zinc-800 transition-all disabled:opacity-40 flex items-center"
          >
            {duplicatingId === product.id ? (
              <span className="text-xs">…</span>
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        )}
        {confirmDeleteId === product.id ? (
          <div className="flex items-center gap-1">
            <button
              onClick={() => onConfirmDelete(product)}
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
              onClick={onCancelDelete}
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
            onClick={() => onDelete(product)}
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
}
