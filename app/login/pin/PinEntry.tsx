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
        className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium text-sm hover:bg-blue-700 disabled:opacity-40 transition"
      >
        {loading ? 'Verifying...' : 'Sign in'}
      </button>
    </div>
  )
}