import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

function isAuthed(req: NextRequest) {
  const token = req.cookies.get('admin_token')?.value
  return !!process.env.ADMIN_SECRET && token === process.env.ADMIN_SECRET
}

export async function GET(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('tenants')
    .select('id, slug, name, tagline, logo_url, whatsapp_number, instagram_handle, primary_color, active, created_at')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = (await req.json()) as {
    slug: string
    name: string
    tagline?: string
    whatsapp_number: string
    instagram?: string
    logo_url?: string
    accent_color?: string
  }

  if (!body.slug || !body.name || !body.whatsapp_number) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }

  if (!/^[a-z0-9-]+$/.test(body.slug)) {
    return NextResponse.json({ error: 'Slug inválido (solo letras minúsculas, números y guiones)' }, { status: 400 })
  }

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('tenants')
    .insert({
      slug: body.slug,
      name: body.name,
      tagline: body.tagline || null,
      whatsapp_number: body.whatsapp_number,
      instagram_handle: body.instagram || null,
      logo_url: body.logo_url || null,
      primary_color: body.accent_color || '#FF6B35',
      secondary_color: '#FFB347',
      background_color: '#FFFAF7',
      delivery_cost: 0,
      active: true,
    })
    .select('id, slug, name')
    .single()

  if (error) {
    const msg = error.code === '23505' ? 'Ya existe un restaurante con ese slug' : error.message
    return NextResponse.json({ error: msg }, { status: 400 })
  }
  return NextResponse.json(data, { status: 201 })
}
