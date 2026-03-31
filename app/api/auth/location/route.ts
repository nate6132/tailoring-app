import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const password = body.password

    console.log('Location login attempt with password:', password)

    if (!password) {
      return NextResponse.json({ error: 'Password required' }, { status: 400 })
    }

    const supabase = createServerClient()

    const { data: locations, error } = await supabase
      .from('locations')
      .select('*')

    console.log('Locations:', locations, 'Error:', error)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const location = locations?.find(l => l.password_hash === password)

    console.log('Matched location:', location)

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