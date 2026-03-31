import { NextRequest, NextResponse } from 'next/server'

export function proxy(req: NextRequest) {
  const role = req.cookies.get('role')?.value
  const locationId = req.cookies.get('location_id')?.value
  const { pathname } = req.nextUrl

  if (pathname.startsWith('/admin')) {
    if (role !== 'admin') {
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }

  if (pathname.startsWith('/tailor')) {
    if (role !== 'tailor' && role !== 'admin') {
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }

  if (pathname.startsWith('/login') && role && locationId) {
    if (role === 'admin') {
      return NextResponse.redirect(new URL('/admin', req.url))
    }
    if (role === 'tailor') {
      return NextResponse.redirect(new URL('/tailor', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/tailor/:path*', '/login/:path*', '/login'],
}