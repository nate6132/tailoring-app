import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const { orderId, phone, message } = await req.json()

  if (!orderId || !phone || !message) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const supabase = createServerClient()

  await supabase.from('notifications').insert({
    order_id: orderId,
    message,
    sent_to_phone: phone,
    sent_by: 'admin',
  })

  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const from = process.env.TWILIO_PHONE_NUMBER

  if (!accountSid || !authToken || !from) {
    return NextResponse.json({ error: 'Twilio not configured' }, { status: 500 })
  }

  const credentials = Buffer.from(accountSid + ':' + authToken).toString('base64')

  const twilioRes = await fetch(
    'https://api.twilio.com/2010-04-01/Accounts/' + accountSid + '/Messages.json',
    {
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
    }
  )

  const twilioData = await twilioRes.json()

  if (!twilioRes.ok) {
    console.error('Twilio error:', twilioData)
    return NextResponse.json({ error: twilioData.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}