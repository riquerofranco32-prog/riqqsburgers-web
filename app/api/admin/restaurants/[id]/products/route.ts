import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

function isAuthorized(req: NextRequest) {
  const token = req.cookies.get('admin_token')?.value
  return !!process.env.ADMIN_SECRET && token === process.env.ADMIN_SECRET
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const supabase = createServerClient()
  const { data } = await supabase
    .from('products')
    .select('*')
    .eq('tenant_id', id)
    .order('sort_order')
  return NextResponse.json(data ?? [])
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const body = await req.json()
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('products')
    .insert({ ...body, tenant_id: id })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
