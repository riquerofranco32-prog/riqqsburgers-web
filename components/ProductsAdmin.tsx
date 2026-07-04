"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { Toast } from "@/components/admin/Toast";
import {
  ProductModal,
  type ProductForm,
} from "@/components/admin/products/ProductModal";
import { ProductMobileCard } from "@/components/admin/products/ProductMobileCard";
import { ProductDesktopRow } from "@/components/admin/products/ProductDesktopRow";
import { vibrate } from "@/components/admin/products/utils";
import type { Tenant, Category, Product } from "@/types/supabase";

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
      addons: form.addons
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
                <ProductDesktopRow
                  key={product.id}
                  product={product}
                  cat={cat}
                  tenantSlug={tenant.slug}
                  selected={selectedIds.has(product.id)}
                  onToggleSelect={toggleSelect}
                  onUploaded={handleImageUploaded}
                  confirmDeleteId={confirmDeleteId}
                  deletingId={deletingId}
                  onToggle={toggleAvailable}
                  onEdit={openEdit}
                  onDelete={requestDelete}
                  onConfirmDelete={handleDelete}
                  onCancelDelete={() => setConfirmDeleteId(null)}
                />
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
