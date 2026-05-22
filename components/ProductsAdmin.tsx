'use client'

import { useState, useMemo, useRef } from 'react'
import Image from 'next/image'
import { Search, SlidersHorizontal, Camera, Loader2, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Toast } from '@/components/admin/Toast'
import type { Tenant, Category, Product } from '@/types/supabase'

// ── Image upload ──────────────────────────────────────────────────────────────

async function uploadImage(file: File, tenantSlug: string): Promise<string> {
  const ext = file.name.split('.').pop()
  const path = `${tenantSlug}/${Date.now()}.${ext}`
  const { error } = await supabase.storage
    .from('product-images')
    .upload(path, file, { upsert: true })
  if (error) throw error
  const { data: { publicUrl } } = supabase.storage
    .from('product-images')
    .getPublicUrl(path)
  return publicUrl
}

// ── Inline image cell ─────────────────────────────────────────────────────────

type UploadState = 'idle' | 'uploading' | 'success' | 'error'

function ProductImageCell({
  product,
  tenantSlug,
  categoryEmoji,
  onUploaded,
}: {
  product: Product
  tenantSlug: string
  categoryEmoji: string
  onUploaded: (productId: string, url: string) => void
}) {
  const [preview, setPreview] = useState<string | null>(null)
  const [state, setState] = useState<UploadState>('idle')
  const inputRef = useRef<HTMLInputElement>(null)

  const displayUrl = preview ?? product.image_url ?? null

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const localUrl = URL.createObjectURL(file)
    setPreview(localUrl)
    setState('uploading')
    try {
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `${tenantSlug}/${product.id}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(path, file, { upsert: true })
      if (uploadError) throw uploadError
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(path)
      await supabase.from('products').update({ image_url: publicUrl }).eq('id', product.id)
      onUploaded(product.id, publicUrl)
      setState('success')
      setTimeout(() => setState('idle'), 2000)
    } catch {
      setState('error')
      setTimeout(() => setState('idle'), 2500)
    }
  }

  return (
    <div className="relative w-14 h-14 flex-shrink-0 group/img">
      <div className="w-14 h-14 rounded-xl overflow-hidden bg-zinc-800">
        {displayUrl ? (
          <Image src={displayUrl} alt={product.name} width={56} height={56} className="object-cover w-full h-full" unoptimized />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl">{categoryEmoji}</div>
        )}
      </div>

      {/* Upload overlay */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={state === 'uploading'}
        className="absolute inset-0 rounded-xl flex items-center justify-center bg-black/0 group-hover/img:bg-black/55 transition-all"
      >
        {state === 'uploading' && (
          <Loader2 className="w-5 h-5 text-white animate-spin" />
        )}
        {state === 'success' && (
          <Check className="w-5 h-5 text-emerald-400" />
        )}
        {state === 'error' && (
          <span className="text-[9px] text-red-400 font-bold text-center px-1">Error</span>
        )}
        {state === 'idle' && (
          <Camera className="w-4 h-4 text-white opacity-0 group-hover/img:opacity-100 transition-opacity" />
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
  )
}

// ── Form types ────────────────────────────────────────────────────────────────

interface ProductForm {
  name: string
  description: string
  price: string
  category_id: string
  badge: string
  image_url: string
  available: boolean
}

const emptyForm: ProductForm = {
  name: '', description: '', price: '', category_id: '', badge: '', image_url: '', available: true,
}

// ── Product Modal ─────────────────────────────────────────────────────────────

function ProductModal({
  product,
  categories,
  tenantSlug,
  onSave,
  onClose,
}: {
  product: Product | null
  categories: Category[]
  tenantSlug: string
  onSave: (data: ProductForm) => Promise<void>
  onClose: () => void
}) {
  const [form, setForm] = useState<ProductForm>(
    product
      ? {
          name: product.name,
          description: product.description ?? '',
          price: String(product.price),
          category_id: product.category_id ?? '',
          badge: product.badge ?? '',
          image_url: product.image_url ?? '',
          available: product.available,
        }
      : emptyForm
  )
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [nameError, setNameError] = useState('')
  const [priceError, setPriceError] = useState('')

  function set<K extends keyof ProductForm>(key: K, val: ProductForm[K]) {
    setForm(f => ({ ...f, [key]: val }))
    if (key === 'name') setNameError('')
    if (key === 'price') setPriceError('')
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadError('')
    setUploading(true)
    try {
      const url = await uploadImage(file, tenantSlug)
      set('image_url', url)
    } catch {
      setUploadError('Error al subir imagen. Podés pegar una URL manualmente.')
    } finally {
      setUploading(false)
    }
  }

  function validate() {
    let ok = true
    if (!form.name.trim()) { setNameError('El nombre es obligatorio'); ok = false }
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) < 0) {
      setPriceError('Ingresá un precio válido'); ok = false
    }
    return ok
  }

  async function doSave() {
    if (!validate()) return
    setSaving(true)
    await onSave(form)
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-zinc-950 w-full max-w-lg rounded-t-3xl md:rounded-3xl flex flex-col max-h-[92dvh] shadow-2xl border border-zinc-800">

        <div className="flex justify-center pt-3 pb-1 flex-shrink-0 md:hidden">
          <div className="w-10 h-1 rounded-full bg-zinc-700" />
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 flex-shrink-0">
          <h2 className="font-bold font-[family-name:var(--font-syne)]">
            {product ? 'Editar producto' : 'Nuevo producto'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
          >
            ×
          </button>
        </div>

        <form
          onSubmit={e => { e.preventDefault(); doSave() }}
          className="flex-1 overflow-y-auto px-5 py-4"
        >
          <div className="flex flex-col gap-4 pb-4">

            <div>
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide block mb-1.5">Nombre *</label>
              <input
                value={form.name}
                onChange={e => set('name', e.target.value)}
                placeholder="Ej: AMERICAN"
                className={`w-full bg-zinc-900 border rounded-xl px-4 py-3 text-white text-sm placeholder-zinc-600 outline-none focus:border-yellow-400 transition-colors ${nameError ? 'border-red-500' : 'border-zinc-700'}`}
              />
              {nameError && <p className="text-red-400 text-xs mt-1">{nameError}</p>}
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide block mb-1.5">Descripción</label>
              <textarea
                value={form.description}
                onChange={e => set('description', e.target.value)}
                placeholder="Ingredientes o descripción"
                rows={2}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm placeholder-zinc-600 outline-none focus:border-yellow-400 transition-colors resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide block mb-1.5">Precio (ARS) *</label>
                <input
                  type="number"
                  value={form.price}
                  onChange={e => set('price', e.target.value)}
                  min={0}
                  placeholder="9500"
                  className={`w-full bg-zinc-900 border rounded-xl px-4 py-3 text-white text-sm placeholder-zinc-600 outline-none focus:border-yellow-400 transition-colors ${priceError ? 'border-red-500' : 'border-zinc-700'}`}
                />
                {priceError && <p className="text-red-400 text-xs mt-1">{priceError}</p>}
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide block mb-1.5">Categoría</label>
                <select
                  value={form.category_id}
                  onChange={e => set('category_id', e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-yellow-400 transition-colors"
                >
                  <option value="">Sin categoría</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide block mb-1.5">Badge (opcional)</label>
              <input
                value={form.badge}
                onChange={e => set('badge', e.target.value)}
                placeholder="🔥 Popular"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm placeholder-zinc-600 outline-none focus:border-yellow-400 transition-colors"
              />
            </div>

            {/* Image */}
            <div>
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide block mb-1.5">Imagen</label>
              <div className="flex gap-3 items-start">
                {form.image_url && (
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-zinc-700">
                    <Image src={form.image_url} alt="preview" fill className="object-cover" unoptimized />
                  </div>
                )}
                <div className="flex-1 flex flex-col gap-2">
                  <label className="flex items-center justify-center gap-2 border border-dashed border-zinc-700 rounded-xl px-4 py-3 text-zinc-500 text-sm hover:border-yellow-400 hover:text-white transition-colors cursor-pointer min-h-[48px]">
                    {uploading ? 'Subiendo...' : '📁 Subir desde archivo'}
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" disabled={uploading} />
                  </label>
                  <input
                    value={form.image_url}
                    onChange={e => set('image_url', e.target.value)}
                    placeholder="O pegá una URL de imagen"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm placeholder-zinc-600 outline-none focus:border-yellow-400 transition-colors"
                  />
                  {uploadError && <p className="text-red-400 text-xs">{uploadError}</p>}
                </div>
              </div>
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => set('available', !form.available)}
                className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${form.available ? 'bg-yellow-400' : 'bg-zinc-700'}`}
              >
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.available ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
              <span className="text-sm text-white">Disponible</span>
            </label>
          </div>
        </form>

        <div className="px-5 py-4 border-t border-zinc-800 flex-shrink-0">
          <button
            onClick={doSave}
            disabled={saving || uploading}
            className="w-full bg-yellow-400 text-black font-bold py-3.5 rounded-2xl hover:bg-amber-400 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {saving ? 'Guardando...' : product ? 'Guardar cambios' : 'Crear producto'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

type SortKey = 'default' | 'name' | 'price-asc' | 'price-desc'

export default function ProductsAdmin({ tenant, categories, initialProducts }: {
  tenant: Tenant
  categories: Category[]
  initialProducts: Product[]
}) {
  const [products, setProducts] = useState(initialProducts)
  const [showModal, setShowModal] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [filterCat, setFilterCat] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortKey>('default')
  const [toast, setToast] = useState<string | null>(null)

  const filtered = useMemo(() => {
    let list = filterCat === 'all' ? products : products.filter(p => p.category_id === filterCat)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q))
    }
    if (sort === 'name') list = [...list].sort((a, b) => a.name.localeCompare(b.name))
    if (sort === 'price-asc') list = [...list].sort((a, b) => a.price - b.price)
    if (sort === 'price-desc') list = [...list].sort((a, b) => b.price - a.price)
    return list
  }, [products, filterCat, search, sort])

  const activeCount = products.filter(p => p.available).length
  const inactiveCount = products.length - activeCount

  function openNew() {
    setEditProduct(null)
    setShowModal(true)
  }

  function openEdit(product: Product) {
    setEditProduct(product)
    setShowModal(true)
  }

  async function handleSave(form: ProductForm) {
    const payload = {
      tenant_id: tenant.id,
      name: form.name.trim(),
      description: form.description.trim() || null,
      price: parseInt(form.price, 10),
      category_id: form.category_id || null,
      badge: form.badge.trim() || null,
      image_url: form.image_url.trim() || null,
      available: form.available,
    }

    if (editProduct) {
      const { data, error } = await supabase
        .from('products')
        .update(payload)
        .eq('id', editProduct.id)
        .select()
        .single()
      if (!error && data) {
        setProducts(prev => prev.map(p => p.id === editProduct.id ? data : p))
        setToast('Producto actualizado')
      }
    } else {
      const { data, error } = await supabase
        .from('products')
        .insert({ ...payload, sort_order: products.length })
        .select()
        .single()
      if (!error && data) {
        setProducts(prev => [...prev, data])
        setToast('Producto creado')
      }
    }
    setShowModal(false)
  }

  function handleImageUploaded(productId: string, url: string) {
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, image_url: url } : p))
  }

  async function toggleAvailable(product: Product) {
    const newVal = !product.available
    await supabase.from('products').update({ available: newVal }).eq('id', product.id)
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, available: newVal } : p))
  }

  return (
    <div className="p-5 md:p-8 flex flex-col gap-5 max-w-5xl">

      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold font-[family-name:var(--font-syne)]">Productos</h1>
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
        <button
          onClick={openNew}
          className="bg-yellow-400 text-black text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-amber-400 transition-colors flex-shrink-0"
        >
          + Nuevo
        </button>
      </div>

      {/* Search + Sort */}
      <div className="flex gap-2 flex-wrap">
        <div className="flex-1 min-w-[180px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar producto..."
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-9 pr-4 py-2.5 text-white text-sm placeholder-zinc-600 outline-none focus:border-yellow-400 transition-colors"
          />
        </div>
        <div className="relative flex-shrink-0">
          <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
          <select
            value={sort}
            onChange={e => setSort(e.target.value as SortKey)}
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
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5">
        <button
          onClick={() => setFilterCat('all')}
          className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold border transition-all ${filterCat === 'all' ? 'bg-yellow-400 text-black border-yellow-400' : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:text-white'}`}
        >
          Todos ({products.length})
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setFilterCat(cat.id)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold border transition-all ${filterCat === cat.id ? 'bg-yellow-400 text-black border-yellow-400' : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:text-white'}`}
          >
            {cat.emoji} {cat.name} ({products.filter(p => p.category_id === cat.id).length})
          </button>
        ))}
      </div>

      {/* Product list */}
      {filtered.length === 0 ? (
        <div className="text-center py-14 text-zinc-500">
          <p className="text-3xl mb-2">🍽️</p>
          <p className="text-sm">{search ? 'Sin resultados para esa búsqueda' : 'No hay productos. Creá el primero.'}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filtered.map(product => {
            const cat = categories.find(c => c.id === product.category_id)
            return (
              <div
                key={product.id}
                className={`bg-zinc-900 rounded-2xl border flex items-center gap-3 p-3 transition-opacity ${product.available ? 'border-zinc-800' : 'border-zinc-800 opacity-50'}`}
              >
                <ProductImageCell
                  product={product}
                  tenantSlug={tenant.slug}
                  categoryEmoji={cat?.emoji ?? '🍽️'}
                  onUploaded={handleImageUploaded}
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm text-white">{product.name}</p>
                    {product.badge && (
                      <span className="text-[10px] bg-yellow-400 text-black px-1.5 py-0.5 rounded-full font-bold">
                        {product.badge.replace(/^\S+\s/, '')}
                      </span>
                    )}
                  </div>
                  <p className="text-yellow-400 text-sm font-bold">
                    ${product.price.toLocaleString('es-AR')}
                  </p>
                  {cat && <p className="text-zinc-500 text-xs">{cat.emoji} {cat.name}</p>}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => toggleAvailable(product)}
                    title={product.available ? 'Deshabilitar' : 'Habilitar'}
                    className={`w-10 h-6 rounded-full transition-colors relative ${product.available ? 'bg-yellow-400' : 'bg-zinc-700'}`}
                  >
                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${product.available ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </button>
                  <button
                    onClick={() => openEdit(product)}
                    className="text-xs text-zinc-500 hover:text-white px-2 py-1.5 rounded-lg hover:bg-zinc-800 transition-all"
                  >
                    Editar
                  </button>
                </div>
              </div>
            )
          })}
        </div>
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

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  )
}
