'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import AticaLogo from '@/components/AticaLogo'

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
            <p className="text-white/25 text-xs tracking-widest uppercase">
              {step === 'location' ? 'Enter location password' : locationName}
            </p>
          </div>

          <div className="bg-white/[0.03] border border-white/8 rounded-3xl p-6">
            {step === 'location' && (
              <form onSubmit={handleLocationSubmit} className="space-y-4">
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Location password"
                  autoFocus
                  className="w-full bg-white/5 border border-white/8 rounded-xl px-4 py-3.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-white/25 transition"
                />
                {error && <p className="text-red-400/80 text-xs text-center">{error}</p>}
                <button
                  type="submit"
                  disabled={loading || !password}
                  className="w-full bg-white text-[#0d0d14] py-3.5 rounded-xl text-xs font-semibold tracking-wider uppercase hover:bg-gray-100 disabled:opacity-30 transition"
                >
                  {loading ? '...' : 'Continue'}
                </button>
              </form>
            )}

            {step === 'pin' && (
              <div>
                <p className="text-xs text-white/25 tracking-widest uppercase text-center mb-6">
                  Enter your PIN
                </p>

                <div className="flex justify-center gap-3 mb-6">
                  {[0, 1, 2, 3].map(i => (
                    <div
                      key={i}
                      className={`w-11 h-11 rounded-xl border flex items-center justify-center transition-all ${
                        pin.length > i ? 'border-white/40 bg-white/10' : 'border-white/8 bg-white/3'
                      }`}
                    >
                      {pin.length > i && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  ))}
                </div>

                {error && <p className="text-red-400/80 text-xs text-center mb-4">{error}</p>}

                <div className="grid grid-cols-3 gap-2 mb-4">
                  {['1','2','3','4','5','6','7','8','9','','0','del'].map((key, idx) => (
                    <button
                      key={idx}
                      onClick={() => key && handlePinKey(key)}
                      disabled={loading}
                      className={`h-13 rounded-xl text-sm font-medium transition-all select-none ${
                        key === '' ? 'cursor-default pointer-events-none' :
                        key === 'del' ? 'bg-white/3 text-white/30 hover:bg-white/8 hover:text-white/50' :
                        'bg-white/5 border border-white/8 text-white/70 hover:bg-white/10 hover:text-white active:scale-95'
                      }`}
                      style={{ height: '52px' }}
                    >
                      {key === 'del' ? (
                        <span className="flex items-center justify-center">
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M12 8H5M5 8L8 5M5 8L8 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </span>
                      ) : key}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handlePinSubmit}
                  disabled={loading || pin.length < 4}
                  className="w-full bg-white text-[#0d0d14] py-3.5 rounded-xl text-xs font-semibold tracking-wider uppercase hover:bg-gray-100 disabled:opacity-30 transition mb-3"
                >
                  {loading ? '...' : 'Sign in'}
                </button>

                <button
                  onClick={() => { setStep('location'); setPin(''); setError('') }}
                  className="w-full text-center text-xs text-white/20 hover:text-white/40 transition py-1 tracking-wider uppercase"
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