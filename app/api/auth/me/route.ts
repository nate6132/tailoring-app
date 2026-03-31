import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const tailorId = req.cookies.get('tailor_id')?.value || ''
  const tailorName = req.cookies.get('tailor_name')?.value || ''
  const role = req.cookies.get('role')?.value || ''
  const locationId = req.cookies.get('location_id')?.value || ''
  return NextResponse.json({ tailorId, tailorName, role, locationId })
}