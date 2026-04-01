'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function PinEntry({ locationId }: { locationId: string }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

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
        className="w-full bg-white text-[#0a0a0f] py-3.5 rounded-2xl font-semibold text-sm hover:bg-gray-100 disabled:opacity-40 transition"
      >
        {loading ? 'Signing in...' : 'Sign in'}
      </button>
    </div>
  )
}