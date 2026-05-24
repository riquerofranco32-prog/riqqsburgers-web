import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const body = (await req.json()) as { status: string }

  if (!body.status) {
    return NextResponse.json({ error: 'status requerido' }, { status: 400 })
  }

  const supabase = createServerClient()
  const { error } = await supabase
    .from('orders')
    .update({ status: body.status })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
