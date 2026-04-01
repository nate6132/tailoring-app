'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

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
      setError('Incorrect password.')
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
      setError('Incorrect PIN.')
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
            <p className="text-white/30 text-sm mt-1">
              {step === 'location' ? 'Enter your location password' : locationName}
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-6">

            {step === 'location' && (
              <form onSubmit={handleLocationSubmit} className="space-y-4">
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Location password"
                  autoFocus
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-white text-sm placeholder-white/30 focus:outline-none focus:border-white/30 transition"
                />
                {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                <button
                  type="submit"
                  disabled={loading || !password}
                  className="w-full bg-white text-[#0a0a0f] py-3.5 rounded-2xl font-semibold text-sm hover:bg-gray-100 disabled:opacity-40 transition"
                >
                  {loading ? 'Verifying...' : 'Continue'}
                </button>
              </form>
            )}

            {step === 'pin' && (
              <div>
                <p className="text-xs font-medium text-white/40 uppercase tracking-widest text-center mb-6">
                  Enter your PIN
                </p>

                <div className="flex justify-center gap-3 mb-6">
                  {[0, 1, 2, 3].map(i => (
                    <div
                      key={i}
                      className={`w-12 h-12 rounded-2xl border flex items-center justify-center transition-all ${
                        pin.length > i
                          ? 'border-white bg-white/10'
                          : 'border-white/10 bg-white/5'
                      }`}
                    >
                      {pin.length > i && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                    </div>
                  ))}
                </div>

                {error && <p className="text-red-400 text-sm text-center mb-4">{error}</p>}

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
                          ? 'bg-white/5 text-white/50 hover:bg-white/10'
                          : 'bg-white/5 border border-white/10 text-white hover:bg-white/10 active:scale-95'
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
                  className="w-full bg-white text-[#0a0a0f] py-3.5 rounded-2xl font-semibold text-sm hover:bg-gray-100 disabled:opacity-40 transition mb-3"
                >
                  {loading ? 'Signing in...' : 'Sign in'}
                </button>

                <button
                  onClick={() => { setStep('location'); setPin(''); setError('') }}
                  className="w-full text-center text-sm text-white/25 hover:text-white/50 transition py-1"
                >
                  Switch location
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}