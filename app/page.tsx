import Link from 'next/link'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function Home() {
  const cookieStore = await cookies()
  const role = cookieStore.get('role')?.value
  if (role === 'admin') redirect('/admin')
  if (role === 'tailor') redirect('/tailor')

  return (
    <div className="min-h-screen bg-[#0d0d14] flex flex-col relative overflow-hidden">
      <div className="relative flex-1 flex flex-col items-center justify-center px-6 py-20">
        <div className="mb-16 text-center">
          <div className="flex flex-col items-center select-none">
            <span className="font-display tracking-[0.25em] font-semibold leading-none text-5xl text-white">
              ATICA
            </span>
            <span className="tracking-[0.4em] font-light mt-1 text-xs text-white/40">
              TAILORING
            </span>
          </div>
          <div className="mt-6 w-16 h-px bg-white/10 mx-auto" />
          <p className="mt-4 text-white/25 text-[10px] tracking-[0.3em] uppercase">New York</p>
        </div>

        <div className="flex flex-col items-center gap-3 w-full max-w-[260px]">
          <Link
            href="/track"
            className="w-full text-center bg-white text-[#0d0d14] py-4 rounded-xl text-xs font-semibold tracking-[0.15em] uppercase hover:bg-gray-100 transition-all duration-300"
          >
            Track My Order
          </Link>
          <Link
            href="/login"
            className="w-full text-center border border-white/15 text-white/50 py-4 rounded-xl text-xs font-medium tracking-[0.15em] uppercase hover:border-white/30 hover:text-white/80 transition-all duration-300"
          >
            Staff Login
          </Link>
        </div>
      </div>

      <div className="relative text-center pb-8">
        <p className="text-white/10 text-[10px] tracking-[0.4em] uppercase">Est. New York</p>
      </div>
    </div>
  )
}