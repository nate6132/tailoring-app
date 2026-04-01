import Link from 'next/link'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Image from 'next/image'

export default async function Home() {
  const cookieStore = await cookies()
  const role = cookieStore.get('role')?.value
  if (role === 'admin') redirect('/admin')
  if (role === 'tailor') redirect('/tailor')

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        <div className="mb-16">
          <Image
            src="/atica-logo.png"
            alt="Atica New York"
            width={320}
            height={120}
            className="brightness-0 invert opacity-90"
            priority
          />
        </div>

        <div className="flex flex-col items-center gap-3 w-full max-w-xs">
          <Link
            href="/track"
            className="w-full text-center bg-white text-[#0a0a0f] py-4 rounded-2xl text-sm font-semibold tracking-wide hover:bg-gray-100 transition-all duration-200"
          >
            Track My Order
          </Link>
          <Link
            href="/login"
            className="w-full text-center bg-transparent border border-white/20 text-white/70 py-4 rounded-2xl text-sm font-medium tracking-wide hover:border-white/40 hover:text-white transition-all duration-200"
          >
            Staff Login
          </Link>
        </div>
      </div>

      <div className="text-center pb-8">
        <p className="text-white/20 text-xs tracking-widest uppercase">New York</p>
      </div>
    </div>
  )
}