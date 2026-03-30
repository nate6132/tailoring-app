import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

const SUPER_ADMIN_PIN = process.env.SUPER_ADMIN_PIN || '0000'

export async function POST(req: NextRequest) {
  try {
    const { pin, locationId } = await req.json()

    console.log('PIN received:', pin)
    console.log('Location ID:', locationId)
    console.log('Super admin PIN:', SUPER_ADMIN_PIN)
    console.log('PIN match:', pin === SUPER_ADMIN_PIN)

    if (pin === SUPER_ADMIN_PIN) {
      const res = NextResponse.json({ success: true, role: 'admin' })
      res.cookies.set('role', 'admin', { httpOnly: true, path: '/', maxAge: 60 * 60 * 8 })
      res.cookies.set('location_id', locationId, { httpOnly: true, path: '/', maxAge: 60 * 60 * 8 })
      return res
    }

    const supabase = createServerClient()

    const { data: tailor, error } = await supabase
      .from('tailors')
      .select('*')
      .eq('pin', pin)
      .eq('location_id', locationId)
      .eq('active', true)
      .single()

    console.log('Tailor found:', tailor)
    console.log('Tailor error:', error)

    if (!tailor) {
      return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 })
    }

    const res = NextResponse.json({ success: true, role: 'tailor', tailorName: tailor.name })
    res.cookies.set('role', 'tailor', { httpOnly: true, path: '/', maxAge: 60 * 60 * 8 })
    res.cookies.set('tailor_id', tailor.id, { httpOnly: true, path: '/', maxAge: 60 * 60 * 8 })
    res.cookies.set('tailor_name', tailor.name, { httpOnly: true, path: '/', maxAge: 60 * 60 * 8 })
    res.cookies.set('location_id', locationId, { httpOnly: true, path: '/', maxAge: 60 * 60 * 8 })
    return res

  } catch (err) {
    console.error('Auth error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}