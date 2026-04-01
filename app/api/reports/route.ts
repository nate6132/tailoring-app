import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function GET() {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('job_assignments')
    .select('*, tailors(*), order_items(*, orders(*))')
    .order('claimed_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}