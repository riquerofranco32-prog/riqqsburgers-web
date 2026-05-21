'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
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

// ── Form modal ────────────────────────────────────────────────────────────────

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

  function set<K extends keyof ProductForm>(key: K, val: ProductForm[K]) {
    setForm(f => ({ ...f, [key]: val }))
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

  async function doSave() {
    if (!form.name.trim() || !form.price) return
    setSaving(true)
    await onSave(form)
    setSaving(false)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    doSave()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#1a1714] w-full max-w-lg rounded-t-3xl md:rounded-3xl flex flex-col max-h-[92dvh] shadow-2xl">

        <div className="flex justify-center pt-3 pb-1 flex-shrink-0 md:hidden">
          <div className="w-10 h-1 rounded-full bg-[#333]" />
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2a2a2a] flex-shrink-0">
          <h2 className="font-bold font-[family-name:var(--font-syne)]">
            {product ? 'Editar producto' : 'Nuevo producto'}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#111] flex items-center justify-center text-[#888] hover:text-white">×</button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-4">
          <div className="flex flex-col gap-4 pb-4">

            {/* Nombre */}
            <div>
              <label className="text-xs font-semibold text-[#888] uppercase tracking-wide block mb-1.5">Nombre *</label>
              <input
                value={form.name}
                onChange={e => set('name', e.target.value)}
                required
                placeholder="Ej: AMERICAN"
                className="w-full bg-[#111] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white text-sm placeholder-[#444] outline-none focus:border-[#f5c518] transition-colors"
              />
            </div>

            {/* Descripción */}
            <div>
              <label className="text-xs font-semibold text-[#888] uppercase tracking-wide block mb-1.5">Descripción</label>
              <textarea
                value={form.description}
                onChange={e => set('description', e.target.value)}
                placeholder="Ingredientes o descripción"
                rows={2}
                className="w-full bg-[#111] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white text-sm placeholder-[#444] outline-none focus:border-[#f5c518] transition-colors resize-none"
              />
            </div>

            {/* Precio y Categoría */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-[#888] uppercase tracking-wide block mb-1.5">Precio (ARS) *</label>
                <input
                  type="number"
                  value={form.price}
                  onChange={e => set('price', e.target.value)}
                  required
                  min={0}
                  placeholder="9500"
                  className="w-full bg-[#111] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white text-sm placeholder-[#444] outline-none focus:border-[#f5c518] transition-colors"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#888] uppercase tracking-wide block mb-1.5">Categoría</label>
                <select
                  value={form.category_id}
                  onChange={e => set('category_id', e.target.value)}
                  className="w-full bg-[#111] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#f5c518] transition-colors"
                >
                  <option value="">Sin categoría</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Badge */}
            <div>
              <label className="text-xs font-semibold text-[#888] uppercase tracking-wide block mb-1.5">Badge (opcional)</label>
              <input
                value={form.badge}
                onChange={e => set('badge', e.target.value)}
                placeholder="🔥 Popular"
                className="w-full bg-[#111] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white text-sm placeholder-[#444] outline-none focus:border-[#f5c518] transition-colors"
              />
            </div>

            {/* Imagen */}
            <div>
              <label className="text-xs font-semibold text-[#888] uppercase tracking-wide block mb-1.5">Imagen</label>
              <div className="flex gap-3 items-start">
                {form.image_url && (
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-[#2a2a2a]">
                    <Image src={form.image_url} alt="preview" fill className="object-cover" unoptimized />
                  </div>
                )}
                <div className="flex-1 flex flex-col gap-2">
                  <label className="flex items-center justify-center gap-2 border border-dashed border-[#2a2a2a] rounded-xl px-4 py-3 text-[#555] text-sm hover:border-[#f5c518] hover:text-white transition-colors cursor-pointer min-h-[48px]">
                    {uploading ? 'Subiendo...' : '📁 Subir desde archivo'}
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" disabled={uploading} />
                  </label>
                  <input
                    value={form.image_url}
                    onChange={e => set('image_url', e.target.value)}
                    placeholder="O pegá una URL de imagen"
                    className="w-full bg-[#111] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white text-sm placeholder-[#444] outline-none focus:border-[#f5c518] transition-colors"
                  />
                  {uploadError && <p className="text-red-400 text-xs">{uploadError}</p>}
                </div>
              </div>
            </div>

            {/* Disponible */}
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => set('available', !form.available)}
                className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${form.available ? 'bg-[#f5c518]' : 'bg-[#2a2a2a]'}`}
              >
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.available ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
              <span className="text-sm text-white">Disponible</span>
            </label>
          </div>
        </form>

        <div className="px-5 py-4 border-t border-[#2a2a2a] flex-shrink-0">
          <button
            onClick={() => doSave()}
            disabled={saving || uploading}
            className="w-full bg-[#f5c518] text-black font-bold py-3.5 rounded-2xl hover:bg-amber-400 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {saving ? 'Guardando...' : product ? 'Guardar cambios' : 'Crear producto'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ProductsAdmin({ tenant, categories, initialProducts }: {
  tenant: Tenant
  categories: Category[]
  initialProducts: Product[]
}) {
  const [products, setProducts] = useState(initialProducts)
  const [showModal, setShowModal] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [filterCat, setFilterCat] = useState<string>('all')

  const filtered = filterCat === 'all'
    ? products
    : products.filter(p => p.category_id === filterCat)

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
      }
    } else {
      const { data, error } = await supabase
        .from('products')
        .insert({ ...payload, sort_order: products.length })
        .select()
        .single()
      if (!error && data) {
        setProducts(prev => [...prev, data])
      }
    }
    setShowModal(false)
  }

  async function toggleAvailable(product: Product) {
    const newVal = !product.available
    await supabase.from('products').update({ available: newVal }).eq('id', product.id)
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, available: newVal } : p))
  }

  return (
    <div className="min-h-screen bg-[#0f0d0b] text-white">

      {/* Header */}
      <header className="border-b border-[#2a2a2a] px-4 py-3 flex items-center justify-between max-w-4xl mx-auto">
        <div className="flex items-center gap-3">
          <Link href={`/${tenant.slug}/admin`} className="text-[#555] hover:text-white transition-colors text-sm">
            ← Admin
          </Link>
          <h1 className="font-bold font-[family-name:var(--font-syne)]">Productos</h1>
        </div>
        <button
          onClick={openNew}
          className="bg-[#f5c518] text-black text-sm font-bold px-4 py-2 rounded-xl hover:bg-amber-400 transition-colors"
        >
          + Nuevo
        </button>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">

        {/* Filtro por categoría */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 mb-5">
          <button
            onClick={() => setFilterCat('all')}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold border transition-all ${filterCat === 'all' ? 'bg-[#f5c518] text-black border-[#f5c518]' : 'bg-[#2a2520] text-[#999] border-[#2a2520] hover:text-white'}`}
          >
            Todos ({products.length})
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setFilterCat(cat.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold border transition-all ${filterCat === cat.id ? 'bg-[#f5c518] text-black border-[#f5c518]' : 'bg-[#2a2520] text-[#999] border-[#2a2520] hover:text-white'}`}
            >
              {cat.emoji} {cat.name} ({products.filter(p => p.category_id === cat.id).length})
            </button>
          ))}
        </div>

        {/* Lista de productos */}
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-[#555]">
            <p className="text-4xl mb-2">🍽️</p>
            <p className="text-sm">No hay productos. Creá el primero.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map(product => {
              const cat = categories.find(c => c.id === product.category_id)
              return (
                <div
                  key={product.id}
                  className={`bg-[#1a1a1a] rounded-2xl border flex items-center gap-3 p-3 transition-opacity ${product.available ? 'border-[#2a2a2a]' : 'border-[#2a2a2a] opacity-50'}`}
                >
                  {/* Imagen */}
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-[#111]">
                    {product.image_url ? (
                      <Image src={product.image_url} alt={product.name} fill className="object-cover" unoptimized />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">{cat?.emoji ?? '🍽️'}</div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm">{product.name}</p>
                      {product.badge && (
                        <span className="text-[10px] bg-[#f5c518] text-black px-1.5 py-0.5 rounded-full font-bold">
                          {product.badge.replace(/^[^ ]+ /, '')}
                        </span>
                      )}
                    </div>
                    <p className="text-[#f5c518] text-sm font-bold">
                      ${product.price.toLocaleString('es-AR')}
                    </p>
                    {cat && <p className="text-[#555] text-xs">{cat.emoji} {cat.name}</p>}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Toggle disponible */}
                    <button
                      onClick={() => toggleAvailable(product)}
                      title={product.available ? 'Deshabilitar' : 'Habilitar'}
                      className={`w-10 h-6 rounded-full transition-colors relative ${product.available ? 'bg-[#f5c518]' : 'bg-[#2a2a2a]'}`}
                    >
                      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${product.available ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </button>
                    <button
                      onClick={() => openEdit(product)}
                      className="text-xs text-[#555] hover:text-white px-2 py-1.5 rounded-lg hover:bg-[#2a2a2a] transition-all"
                    >
                      Editar
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {showModal && (
        <ProductModal
          product={editProduct}
          categories={categories}
          tenantSlug={tenant.slug}
          onSave={handleSave}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}
