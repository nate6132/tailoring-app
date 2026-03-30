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
          <p className="text-gray-500 text-sm mt-1">
            {step === 'location' ? 'Sign in to your location' : locationName}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">

          {step === 'location' && (
            <form onSubmit={handleLocationSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Location password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your store password"
                  autoFocus
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button
                type="submit"
                disabled={loading || !password}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium text-sm hover:bg-blue-700 disabled:opacity-40 transition"
              >
                {loading ? 'Verifying...' : 'Continue'}
              </button>
            </form>
          )}

          {step === 'pin' && (
            <div>
              <p className="text-sm font-medium text-gray-700 text-center mb-6">
                Enter your PIN
              </p>

              <div className="flex justify-center gap-3 mb-8">
                {[0, 1, 2, 3].map(i => (
                  <div
                    key={i}
                    className={`w-14 h-14 rounded-xl border-2 flex items-center justify-center text-2xl font-bold transition ${
                      pin.length > i
                        ? 'border-blue-600 bg-blue-50 text-blue-600'
                        : 'border-gray-200 bg-gray-50 text-gray-300'
                    }`}
                  >
                    {pin.length > i ? '•' : ''}
                  </div>
                ))}
              </div>

              {error && (
                <p className="text-red-500 text-sm text-center mb-4">{error}</p>
              )}

              <div className="grid grid-cols-3 gap-3 mb-4">
                {['1','2','3','4','5','6','7','8','9','','0','del'].map((key, idx) => (
                  <button
                    key={idx}
                    onClick={() => key && handlePinKey(key)}
                    disabled={loading}
                    className={`h-14 rounded-xl text-lg font-medium transition ${
                      key === ''
                        ? 'cursor-default pointer-events-none'
                        : key === 'del'
                        ? 'bg-gray-100 text-gray-600 hover:bg-gray-200 active:bg-gray-300'
                        : 'bg-gray-50 border border-gray-200 text-gray-800 hover:bg-blue-50 hover:border-blue-300 active:bg-blue-100'
                    }`}
                  >
                    {key === 'del' ? '←' : key}
                  </button>
                ))}
              </div>

              <button
                onClick={handlePinSubmit}
                disabled={loading || pin.length < 4}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium text-sm hover:bg-blue-700 disabled:opacity-40 transition mb-3"
              >
                {loading ? 'Verifying...' : 'Sign in'}
              </button>

              <button
                onClick={() => { setStep('location'); setPin(''); setError('') }}
                className="w-full text-center text-sm text-gray-400 hover:text-gray-600 transition"
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