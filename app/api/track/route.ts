import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim()

  if (!q) return NextResponse.json([])

  const supabase = createServerClient()

  const { data } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .or(
      'customer_name.ilike.%' + q + '%,' +
      'customer_phone.ilike.%' + q + '%,' +
      'shopify_order_number.ilike.%' + q + '%'
    )
    .order('created_at', { ascending: false })
    .limit(10)

  return NextResponse.json(data || [])
}