import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import PinEntry from './PinEntry'

export default async function PinPage() {
  const cookieStore = await cookies()
  const locationId = cookieStore.get('location_id')?.value
  const locationName = cookieStore.get('location_name')?.value

  if (!locationId) redirect('/login')

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col">
      <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
        <Link href="/">
          <Image
            src="/atica-logo.png"
            alt="Atica New York"
            width={100}
            height={38}
            className="brightness-0 invert opacity-80"
          />
        </Link>
        <Link href="/" className="text-white/40 text-sm hover:text-white/70 transition">
          Back
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-xl font-semibold text-white">Staff login</h1>
            <p className="text-white/30 text-sm mt-1">{locationName}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
            <PinEntry locationId={locationId} />
            <button
              onClick={() => {}}
              className="w-full text-center text-sm text-white/25 hover:text-white/50 transition py-3 mt-2"
            >
              <Link href="/login">Switch location</Link>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}