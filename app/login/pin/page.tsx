import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import PinEntry from './PinEntry'
import AticaLogo from '@/components/AticaLogo'

export default async function PinPage() {
  const cookieStore = await cookies()
  const locationId = cookieStore.get('location_id')?.value
  const locationName = cookieStore.get('location_name')?.value

  if (!locationId) redirect('/login')

  return (
    <div className="min-h-screen bg-[#0d0d14] flex flex-col">
      <div className="border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <AticaLogo dark size="sm" />
        <Link href="/" className="text-white/30 text-xs tracking-widest uppercase hover:text-white/60 transition">
          Back
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="font-display text-2xl text-white mb-1">Staff login</h1>
            <p className="text-white/25 text-xs tracking-widest uppercase">{locationName}</p>
          </div>
          <div className="bg-white/5 border border-white/8 rounded-3xl p-6">
            <PinEntry locationId={locationId} />
            <div className="mt-3 text-center">
              <Link href="/login" className="text-xs text-white/20 hover:text-white/40 transition tracking-wider uppercase">
                Switch location
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}