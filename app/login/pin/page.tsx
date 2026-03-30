import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import PinEntry from './PinEntry'

export default async function PinPage() {
  const cookieStore = await cookies()
  const locationId = cookieStore.get('location_id')?.value
  const locationName = cookieStore.get('location_name')?.value

  if (!locationId) redirect('/login')

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M8 12h16M8 16h10M8 20h12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              <rect x="4" y="6" width="24" height="20" rx="3" stroke="white" strokeWidth="2"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Tailor Manager</h1>
          <p className="text-gray-500 text-sm mt-1">{locationName}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <PinEntry locationId={locationId} />
        </div>
        <div className="text-center mt-4">
          <a href="/login" className="text-sm text-gray-400 hover:text-gray-600 transition">
            Switch location
          </a>
        </div>
      </div>
    </div>
  )
}