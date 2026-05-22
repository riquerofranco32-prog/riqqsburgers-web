import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

async function isSuperAdmin(): Promise<boolean> {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return false

  const { data } = await supabase
    .from('tenant_users')
    .select('role')
    .eq('user_id', session.user.id)
    .eq('role', 'superadmin')
    .maybeSingle()

  return !!data
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!await isSuperAdmin()) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

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
  if (!await isSuperAdmin()) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const supabase = createServerClient()

  const { error } = await supabase.from('tenants').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
