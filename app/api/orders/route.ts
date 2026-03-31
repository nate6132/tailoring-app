import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

async function sendSms(phone: string, message: string) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const from = process.env.TWILIO_PHONE_NUMBER
  if (!accountSid || !authToken || !from) return
  const credentials = Buffer.from(accountSid + ':' + authToken).toString('base64')
  await fetch('https://api.twilio.com/2010-04-01/Accounts/' + accountSid + '/Messages.json', {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + credentials,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      To: phone.startsWith('+') ? phone : '+1' + phone,
      From: from,
      Body: message,
    }),
  })
}

export async function GET() {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*, job_assignments(*, tailors(*)))')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
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
    barcode_id: shopify_order_number ?? 'BC-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  }))

  const { error: itemsError } = await supabase.from('order_items').insert(orderItems)

  if (itemsError) {
    return NextResponse.json({ error: 'Failed to create items' }, { status: 500 })
  }

  const trackingUrl = process.env.NEXT_PUBLIC_APP_URL + '/track/' + order.tracking_token
  const smsMessage = 'Hi ' + customer_name + ', your tailoring order ' + (shopify_order_number ?? '') + ' has been received! Track your order here: ' + trackingUrl

  await sendSms(customer_phone, smsMessage)

  await supabase.from('notifications').insert({
    order_id: order.id,
    message: smsMessage,
    sent_to_phone: customer_phone,
    sent_by: 'system',
  })

  return NextResponse.json({ success: true, order })
}