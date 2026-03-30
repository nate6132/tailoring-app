import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const password = body.password

    if (!password) {
      return NextResponse.json({ error: 'Password required' }, { status: 400 })
    }

    const supabase = createServerClient()

    const { data: locations } = await supabase
      .from('locations')
      .select('*')

    const location = locations?.find(l => l.password_hash === password)

    if (!location) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
    }

    const res = NextResponse.json({
      success: true,
      locationId: location.id,
      locationName: location.name,
    })

    res.cookies.set('location_id', location.id, { path: '/', maxAge: 60 * 60 * 24 })
    res.cookies.set('location_name', location.name, { path: '/', maxAge: 60 * 60 * 24 })
    res.cookies.set('role', 'location', { path: '/', maxAge: 60 * 60 * 24 })

    return res
  } catch (err) {
    console.error('Location auth error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}