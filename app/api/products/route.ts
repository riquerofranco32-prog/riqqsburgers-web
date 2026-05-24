import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    tenant_id: string
    name: string
    description?: string | null
    price: number
    category_id?: string | null
    badge?: string | null
    image_url?: string | null
    available?: boolean
    sort_order?: number
  }

  if (!body.tenant_id || !body.name || body.price === undefined) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('products')
    .insert({
      tenant_id: body.tenant_id,
      name: body.name,
      description: body.description ?? null,
      price: body.price,
      category_id: body.category_id ?? null,
      badge: body.badge ?? null,
      image_url: body.image_url ?? null,
      available: body.available ?? true,
      sort_order: body.sort_order ?? 0,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
