import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const full = req.nextUrl.searchParams.get('full') === 'true'
  const res = NextResponse.json({ success: true })
  res.cookies.delete('role')
  res.cookies.delete('tailor_id')
  res.cookies.delete('tailor_name')
  if (full) {
    res.cookies.delete('location_id')
    res.cookies.delete('location_name')
  }
  return res
}