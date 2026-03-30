import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const hmacHeader = req.headers.get('x-shopify-hmac-sha256')
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET

  if (secret && hmacHeader) {
    const hash = crypto
      .createHmac('sha256', secret)
      .update(rawBody, 'utf8')
      .digest('base64')

    if (hash !== hmacHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const order = JSON.parse(rawBody)

  const customer_name =
    (order.billing_address?.first_name ?? '') +
    ' ' +
    (order.billing_address?.last_name ?? '')

  const customer_phone =
    order.billing_address?.phone ??
    order.phone ??
    order.customer?.phone ??
    ''

  const shopify_order_id = String(order.id)
  const shopify_order_number = order.name

  const supabase = createServerClient()

  const { data: existing } = await supabase
    .from('orders')
    .select('id')
    .eq('shopify_order_id', shopify_order_id)
    .single()

  if (existing) {
    return NextResponse.json({ message: 'Order already exists' })
  }

  const { data: newOrder, error: orderError } = await supabase
    .from('orders')
    .insert({ customer_name, customer_phone, shopify_order_id, shopify_order_number })
    .select()
    .single()

  if (orderError || !newOrder) {
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }

  const tailoringItems: { order_id: string, alteration_type: string, barcode_id: string, due_date: string }[] = []

  for (const lineItem of order.line_items || []) {
    const name = lineItem.title ?? 'Alteration'
    const quantity = lineItem.quantity ?? 1
    for (let i = 0; i < quantity; i++) {
      tailoringItems.push({
        order_id: newOrder.id,
        alteration_type: quantity > 1 ? name + ' (' + (i + 1) + ' of ' + quantity + ')' : name,
        barcode_id: 'BC-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      })
    }
  }

  await supabase.from('order_items').insert(tailoringItems)

  return NextResponse.json({ success: true })
}