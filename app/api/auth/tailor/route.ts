import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

const SUPER_ADMIN_PIN = process.env.SUPER_ADMIN_PIN || '0000'

export async function POST(req: NextRequest) {
  try {
    const { pin, locationId } = await req.json()

    console.log('PIN:', pin, 'LocationId:', locationId, 'AdminPIN:', SUPER_ADMIN_PIN)

    if (pin === SUPER_ADMIN_PIN) {
      const res = NextResponse.json({ success: true, role: 'admin' })
      res.cookies.set('role', 'admin', { path: '/', maxAge: 60 * 60 * 8 })
      res.cookies.set('location_id', locationId, { path: '/', maxAge: 60 * 60 * 8 })
      return res
    }

    const supabase = createServerClient()

    const { data: tailors, error } = await supabase
      .from('tailors')
      .select('*')
      .eq('location_id', locationId)
      .eq('active', true)

    console.log('All tailors at location:', tailors, 'Error:', error)

    const tailor = tailors?.find(t => t.pin === pin)

    console.log('Matched tailor:', tailor)

    if (!tailor) {
      return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 })
    }

    const res = NextResponse.json({ success: true, role: 'tailor', tailorName: tailor.name })
    res.cookies.set('role', 'tailor', { path: '/', maxAge: 60 * 60 * 8 })
    res.cookies.set('tailor_id', tailor.id, { path: '/', maxAge: 60 * 60 * 8 })
    res.cookies.set('tailor_name', tailor.name, { path: '/', maxAge: 60 * 60 * 8 })
    res.cookies.set('location_id', locationId, { path: '/', maxAge: 60 * 60 * 8 })
    return res

  } catch (err) {
    console.error('Auth error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}