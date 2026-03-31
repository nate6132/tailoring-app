'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [pin, setPin] = useState('')
  const [step, setStep] = useState<'location' | 'pin'>('location')
  const [locationId, setLocationId] = useState('')
  const [locationName, setLocationName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (searchParams.get('step') === 'pin') {
      const locId = document.cookie.match(/location_id=([^;]+)/)?.[1] || ''
      const locName = document.cookie.match(/location_name=([^;]+)/)?.[1] || ''
      if (locId) {
        setLocationId(locId)
        setLocationName(decodeURIComponent(locName))
        setStep('pin')
      }
    }
  }, [searchParams])

  async function handleLocationSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth/location', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError('Incorrect password. Try again.')
      setLoading(false)
      return
    }
    setLocationId(data.locationId)
    setLocationName(data.locationName)
    setStep('pin')
    setLoading(false)
  }

  async function handlePinSubmit() {
    if (pin.length < 4) return
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth/tailor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin, locationId }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) {
      setError('Incorrect PIN. Try again.')
      setPin('')
      return
    }
    if (data.role === 'admin') {
      router.push('/admin')
    } else {
      router.push('/tailor')
    }
  }

  function handlePinKey(val: string) {
    if (val === 'del') {
      setPin(p => p.slice(0, -1))
      return
    }
    if (pin.length >= 4) return
    setPin(p => p + val)
  }

  return (
    <div className="min-h-screen bg-[#f8f9fb] flex flex-col items-center justify-center p-5">
      <div className="w-full max-w-[360px]">

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-white rounded-2xl shadow-sm border border-gray-100 mb-4">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M7 10.5h14M7 14h9M7 17.5h11" stroke="#2563EB" strokeWidth="1.75" strokeLinecap="round"/>
              <rect x="3" y="5" width="22" height="18" rx="3.5" stroke="#2563EB" strokeWidth="1.75"/>
            </svg>
          </div>
          <h1 className="text-[22px] font-semibold text-gray-900 tracking-tight">Tailor Manager</h1>
          <p className="text-sm text-gray-400 mt-1">
            {step === 'location' ? 'Sign in to your location' : locationName}
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">

          {step === 'location' && (
            <form onSubmit={handleLocationSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2 tracking-wide uppercase">
                  Location password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password"
                  autoFocus
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
              {error && (
                <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}
              <button
                type="submit"
                disabled={loading || !password}
                className="w-full bg-blue-600 text-white py-3 rounded-2xl font-medium text-sm hover:bg-blue-700 active:bg-blue-800 disabled:opacity-40 transition"
              >
                {loading ? 'Verifying...' : 'Continue'}
              </button>
            </form>
          )}

          {step === 'pin' && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide text-center mb-5">
                Enter your PIN
              </p>

              <div className="flex justify-center gap-2.5 mb-6">
                {[0, 1, 2, 3].map(i => (
                  <div
                    key={i}
                    className={`w-12 h-12 rounded-2xl border-2 flex items-center justify-center transition-all ${
                      pin.length > i
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    {pin.length > i && (
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                    )}
                  </div>
                ))}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-2.5 mb-4">
                  <p className="text-red-600 text-sm text-center">{error}</p>
                </div>
              )}

              <div className="grid grid-cols-3 gap-2.5 mb-4">
                {['1','2','3','4','5','6','7','8','9','','0','del'].map((key, idx) => (
                  <button
                    key={idx}
                    onClick={() => key && handlePinKey(key)}
                    disabled={loading}
                    className={`h-14 rounded-2xl text-base font-medium transition-all select-none ${
                      key === ''
                        ? 'cursor-default pointer-events-none'
                        : key === 'del'
                        ? 'bg-gray-100 text-gray-500 hover:bg-gray-200 active:bg-gray-300'
                        : 'bg-gray-50 border border-gray-200 text-gray-900 hover:bg-blue-50 hover:border-blue-200 active:scale-95'
                    }`}
                  >
                    {key === 'del' ? (
                      <span className="flex items-center justify-center">
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                          <path d="M14 9H7M7 9L10 6M7 9L10 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </span>
                    ) : key}
                  </button>
                ))}
              </div>

              <button
                onClick={handlePinSubmit}
                disabled={loading || pin.length < 4}
                className="w-full bg-blue-600 text-white py-3 rounded-2xl font-medium text-sm hover:bg-blue-700 active:bg-blue-800 disabled:opacity-40 transition mb-3"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>

              <button
                onClick={() => { setStep('location'); setPin(''); setError('') }}
                className="w-full text-center text-sm text-gray-400 hover:text-gray-600 transition py-1"
              >
                Switch location
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}