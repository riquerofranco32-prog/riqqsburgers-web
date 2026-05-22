import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

function isAuthed(req: NextRequest) {
  const token = req.cookies.get('admin_token')?.value
  return !!process.env.ADMIN_SECRET && token === process.env.ADMIN_SECRET
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const body = (await req.json()) as { active: boolean }
  const supabase = createServerClient()

  const { error } = await supabase
    .from('tenants')
    .update({ active: body.active })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const supabase = createServerClient()

  const { error } = await supabase.from('tenants').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
