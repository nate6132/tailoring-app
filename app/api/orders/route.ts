import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function GET() {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*, job_assignments(*, tailors(*)))')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const supabase = createServerClient()
  const { customer_name, customer_phone, shopify_order_number, items } = await req.json()

  if (!customer_name || !customer_phone || !items?.length) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({ customer_name, customer_phone, shopify_order_number })
    .select()
    .single()

  if (orderError || !order) {
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }

  const orderItems = items.map((alteration_type: string) => ({
    order_id: order.id,
    alteration_type,
    barcode_id: 'BC-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  }))

  const { error: itemsError } = await supabase.from('order_items').insert(orderItems)

  if (itemsError) {
    return NextResponse.json({ error: 'Failed to create items' }, { status: 500 })
  }

  return NextResponse.json({ success: true, order })
}