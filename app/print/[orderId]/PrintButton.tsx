'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

export default function PrintButton() {
  const searchParams = useSearchParams()
  const auto = searchParams.get('auto')

  useEffect(() => {
    if (auto === 'true') {
      const timer = setTimeout(() => {
        window.print()
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [auto])

  return (
    <button
      onClick={() => window.print()}
      className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition"
    >
      Print ticket
    </button>
  )
}