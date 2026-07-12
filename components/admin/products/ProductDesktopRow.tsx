"use client";

import { ChevronUp, ChevronDown, Copy, GripVertical } from "lucide-react";
import type { DragControls } from "framer-motion";
import type { Category, Product } from "@/types/supabase";
import { ProductImageCell } from "./ProductImageCell";
import { InlineConfirm } from "@/components/ui/admin/InlineConfirm";

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
  dragControls,
  onRestock,
  inlinePriceId,
  inlinePriceVal,
  inlinePriceRef,
  inlinePriceEscaped,
  onInlinePriceStart,
  onInlinePriceSave,
  onInlinePriceValChange,
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
  /** Si está presente, muestra un handle de arrastre (drag-and-drop con framer-motion Reorder). */
  dragControls?: DragControls;
  onRestock?: (p: Product) => void;
  inlinePriceId: string | null;
  inlinePriceVal: string;
  inlinePriceRef: React.RefObject<HTMLInputElement>;
  inlinePriceEscaped: React.MutableRefObject<boolean>;
  onInlinePriceStart: (p: Product) => void;
  onInlinePriceSave: (p: Product) => void;
  onInlinePriceValChange: (val: string) => void;
}) {
  const isEditingPrice = inlinePriceId === product.id;
  return (
    <div
      style={{ padding: "var(--row-py, 12px)" }}
      className={`bg-[var(--dash-surface)] rounded-2xl border flex items-center gap-3 transition-opacity ${selected ? "border-[var(--accent)]/60" : "border-[var(--dash-border)]"} ${product.available ? "" : "opacity-50"}`}
    >
      {dragControls && (
        <div
          onPointerDown={(e) => dragControls.start(e)}
          title="Arrastrar para reordenar"
          className="flex-shrink-0 text-[var(--dash-muted)] cursor-grab active:cursor-grabbing flex items-center touch-none"
        >
          <GripVertical className="w-4 h-4" />
        </div>
      )}
      {onMove && (
        <div className="flex flex-col flex-shrink-0 -my-1">
          <button
            onClick={() => onMove(product, -1)}
            disabled={!canMoveUp || reorderBusy}
            title="Subir"
            className="w-7 h-6 flex items-center justify-center text-[var(--dash-muted)] hover:text-[var(--dash-text)] disabled:opacity-25 disabled:hover:text-[var(--dash-muted)] transition-colors"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <button
            onClick={() => onMove(product, 1)}
            disabled={!canMoveDown || reorderBusy}
            title="Bajar"
            className="w-7 h-6 flex items-center justify-center text-[var(--dash-muted)] hover:text-[var(--dash-text)] disabled:opacity-25 disabled:hover:text-[var(--dash-muted)] transition-colors"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      )}
      <input
        type="checkbox"
        checked={selected}
        onChange={() => onToggleSelect(product.id)}
        className="w-4 h-4 flex-shrink-0 accent-[var(--accent)]"
      />
      <ProductImageCell
        product={product}
        tenantSlug={tenantSlug}
        categoryEmoji={cat?.emoji ?? "🍽️"}
        onUploaded={onUploaded}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-sm text-[var(--dash-text)]">
            {product.name}
          </p>
          {product.is_featured && (
            <span className="text-[10px] bg-orange-500/15 text-orange-400 border border-orange-500/30 px-1.5 py-0.5 rounded-full font-bold">
              ⭐ PROMO
            </span>
          )}
          {product.badge && (
            <span className="text-[10px] bg-[var(--accent)] text-black px-1.5 py-0.5 rounded-full font-bold">
              {product.badge.replace(/^\S+\s/, "")}
            </span>
          )}
          {!product.available && (
            <span className="text-[10px] bg-[var(--dash-surface-3)] text-[var(--dash-muted)] px-1.5 py-0.5 rounded-full font-bold">
              Agotado
            </span>
          )}
        </div>
        {isEditingPrice ? (
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
            style={{ fontSize: 14 }}
            className="w-28 bg-[var(--dash-surface-2)] border border-[var(--accent)] rounded-lg px-2 py-1 text-[var(--accent)] font-bold outline-none"
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
            className="flex items-baseline gap-1.5 text-left group"
            title="Click para editar el precio"
          >
            <span className="text-[var(--accent)] text-sm font-bold">
              ${product.price.toLocaleString("es-AR")}
            </span>
            <span className="text-[10px] text-[var(--dash-muted)] opacity-0 group-hover:opacity-100 transition-opacity">
              editar
            </span>
          </button>
        )}
        {cat && (
          <p className="text-[var(--dash-muted)] text-xs">
            {cat.emoji} {cat.name}
          </p>
        )}
        {product.stock_quantity !== null && (
          <div className="flex items-center gap-2">
            <p
              className={`text-xs font-semibold ${product.stock_quantity <= 3 ? "text-amber-400" : "text-[var(--dash-muted)]"}`}
            >
              Stock: {product.stock_quantity}
            </p>
            {product.stock_quantity === 0 && onRestock && (
              <button
                onClick={() => onRestock(product)}
                className="text-[10px] font-bold text-[var(--accent)] hover:text-[var(--accent-hover)] underline"
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
            className={`w-10 h-6 rounded-full transition-colors relative ${product.available ? "bg-[var(--accent)]" : "bg-[var(--dash-surface-3)]"}`}
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
          className="text-xs text-[var(--dash-muted)] hover:text-[var(--dash-text)] min-h-[44px] px-3 rounded-xl hover:bg-[var(--dash-surface-2)] transition-all flex items-center"
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
            className="text-[var(--dash-muted)] hover:text-[var(--dash-text)] min-h-[44px] px-3 rounded-xl hover:bg-[var(--dash-surface-2)] transition-all disabled:opacity-40 flex items-center"
          >
            {duplicatingId === product.id ? (
              <span className="text-xs">…</span>
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        )}
        <InlineConfirm
          active={confirmDeleteId === product.id}
          itemKey={product.id}
          confirm={
            <div className="flex items-center gap-1">
              <button
                onClick={() => onConfirmDelete(product)}
                style={
                  {
                    WebkitTapHighlightColor: "transparent",
                    userSelect: "none",
                  } as React.CSSProperties
                }
                className="text-xs text-[var(--dash-text)] bg-red-600 hover:bg-red-500 min-h-[36px] px-3 rounded-xl transition-all font-semibold"
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
                className="text-xs text-[var(--dash-muted)] hover:text-[var(--dash-text)] min-h-[36px] px-3 rounded-xl hover:bg-[var(--dash-surface-2)] transition-all"
              >
                No
              </button>
            </div>
          }
          trigger={
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
              className="text-xs text-[var(--dash-muted)] hover:text-red-400 min-h-[44px] px-3 rounded-xl hover:bg-[var(--dash-surface-2)] transition-all disabled:opacity-40 flex items-center"
            >
              {deletingId === product.id ? "…" : "🗑"}
            </button>
          }
        />
      </div>
    </div>
  );
}
