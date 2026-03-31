import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { alteration_type, due_date } = await req.json()
  const supabase = createServerClient()
  const barcodeId = 'BC-' + Math.random().toString(36).substring(2, 10).toUpperCase()
  const { data: item, error } = await supabase
    .from('order_items')
    .insert({ order_id: id, alteration_type, barcode_id: barcodeId, due_date })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, item })
}