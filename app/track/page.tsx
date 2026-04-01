'use client'
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { Order } from '@/types'

export default function TrackSearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setSearched(true)
    const res = await fetch('/api/track?q=' + encodeURIComponent(query.trim()))
    const data = await res.json()
    setResults(data || [])
    setLoading(false)
  }

  const statusLabels: Record<string, string> = {
    received: 'Received',
    in_progress: 'In progress',
    ready: 'Ready for pickup',
    picked_up: 'Picked up',
  }

  const statusColors: Record<string, string> = {
    received: 'text-gray-400',
    in_progress: 'text-yellow-400',
    ready: 'text-green-400',
    picked_up: 'text-blue-400',
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

      <div className="flex-1 px-6 py-10 max-w-lg mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-white mb-2">Track your order</h1>
          <p className="text-white/40 text-sm">Enter your name, phone number, or order number</p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2 mb-8">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Name, phone, or order #..."
            autoFocus
            className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-white text-sm placeholder-white/30 focus:outline-none focus:border-white/30 transition"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="bg-white text-[#0a0a0f] px-5 py-3.5 rounded-2xl text-sm font-semibold hover:bg-gray-100 disabled:opacity-40 transition flex-shrink-0"
          >
            {loading ? '...' : 'Search'}
          </button>
        </form>

        {loading && (
          <div className="text-center text-white/30 text-sm py-10">Searching...</div>
        )}

        {!loading && searched && results.length === 0 && (
          <div className="text-center py-10">
            <p className="text-white/40 text-sm">No orders found</p>
            <p className="text-white/20 text-xs mt-1">Try your phone number or order number</p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="space-y-3">
            {results.map(order => {
              const items = order.order_items || []
              const done = items.filter((i: { status: string }) => i.status === 'done').length
              const total = items.length
              const percent = total ? Math.round((done / total) * 100) : 0
              return (
                <Link
                  key={order.id}
                  href={'/track/' + order.tracking_token}
                  className="block bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/8 hover:border-white/20 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-white font-semibold text-sm">{order.customer_name}</p>
                      <p className="text-white/40 text-xs mt-0.5">{order.shopify_order_number ?? 'Manual order'}</p>
                    </div>
                    <span className={'text-xs font-medium ' + statusColors[order.status]}>
                      {statusLabels[order.status]}
                    </span>
                  </div>
                  <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-1 bg-white rounded-full transition-all"
                      style={{ width: percent + '%' }}
                    />
                  </div>
                  <p className="text-white/30 text-xs mt-2">{done}/{total} items complete</p>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}