import { MercadoPagoConfig, Preference } from 'mercadopago'
import { NextRequest, NextResponse } from 'next/server'

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
})

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'

interface MPItem {
  title: string
  quantity: number
  unit_price: number
}

export async function POST(req: NextRequest) {
  try {
    const { items, slug } = (await req.json()) as { items: MPItem[]; slug: string }

    const preference = new Preference(client)
    const result = await preference.create({
      body: {
        items: items.map((i, idx) => ({
          id: String(idx + 1),
          title: i.title,
          quantity: Number(i.quantity),
          unit_price: Number(i.unit_price),
          currency_id: 'ARS',
        })),
        back_urls: {
          success: `${BASE_URL}/success`,
          failure: `${BASE_URL}/${slug}`,
          pending: `${BASE_URL}/${slug}`,
        },
        auto_return: 'approved',
      },
    })

    return NextResponse.json({ init_point: result.init_point })
  } catch (err) {
    console.error('[create-preference]', err)
    return NextResponse.json({ error: 'Error al crear preferencia' }, { status: 500 })
  }
}
