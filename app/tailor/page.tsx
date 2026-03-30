'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { Order, OrderItem } from '@/types'

export default function TailorDashboard() {
  const [barcodeInput, setBarcodeInput] = useState('')
  const [order, setOrder] = useState<Order | null>(null)
  const [items, setItems] = useState<OrderItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  async function handleScan(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setOrder(null)

    const { data: item } = await supabase
      .from('order_items')
      .select('*, orders(*)')
      .eq('barcode_id', barcodeInput.trim())
      .single()

    if (!item) {
      setError('Barcode not found. Try again.')
      setLoading(false)
      return
    }

    const { data: allItems } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', item.order_id)
      .order('created_at')

    setOrder(item.orders as Order)
    setItems(allItems || [])
    setBarcodeInput('')
    setLoading(false)
  }

  async function markDone(itemId: string) {
    await supabase
      .from('order_items')
      .update({ status: 'done', completed_at: new Date().toISOString() })
      .eq('id', itemId)

    setItems(prev =>
      prev.map(i => i.id === itemId
        ? { ...i, status: 'done', completed_at: new Date().toISOString() }
        : i
      )
    )
  }

  const doneCount = items.filter(i => i.status === 'done').length
  const totalCount = items.length

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-xl mx-auto">

        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Tailor Dashboard
        </h1>

        {/* Scan form */}
        <form onSubmit={handleScan} className="flex gap-2 mb-8">
          <input
            type="text"
            value={barcodeInput}
            onChange={e => setBarcodeInput(e.target.value)}
            placeholder="Scan or type barcode..."
            autoFocus
            className="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={loading || !barcodeInput}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Looking...' : 'Scan'}
          </button>
        </form>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Order card */}
        {order && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">

            {/* Customer info */}
            <div className="bg-blue-600 text-white px-6 py-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-blue-100 text-sm">Order {order.shopify_order_number || 'Manual'}</p>
                  <h2 className="text-xl font-bold">{order.customer_name}</h2>
                  <p className="text-blue-100">{order.customer_phone}</p>
                </div>
                <div className="text-right">
                  <span className="bg-white text-blue-600 text-sm font-bold px-3 py-1 rounded-full">
                    {doneCount}/{totalCount} done
                  </span>
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-2 bg-gray-100">
              <div
                className="h-2 bg-green-500 transition-all duration-500"
                style={{ width: `${totalCount ? (doneCount / totalCount) * 100 : 0}%` }}
              />
            </div>

            {/* Items list */}
            <div className="divide-y divide-gray-100">
              {items.map(item => (
                <div key={item.id} className="flex items-center justify-between px-6 py-4">
                  <div>
                    <p className={`font-medium ${item.status === 'done' ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                      {item.alteration_type}
                    </p>
                    <p className="text-sm text-gray-400">
                      Due {new Date(item.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      {' · '}
                      <span className="font-mono text-xs">{item.barcode_id}</span>
                    </p>
                  </div>
                  {item.status === 'done' ? (
                    <span className="text-green-500 font-medium text-sm">Done ✓</span>
                  ) : (
                    <button
                      onClick={() => markDone(item.id)}
                      className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-600 transition"
                    >
                      Mark Done
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* All done banner */}
            {doneCount === totalCount && totalCount > 0 && (
              <div className="bg-green-50 border-t border-green-100 px-6 py-4 text-center text-green-700 font-medium">
                All items complete — ready for pickup!
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  )
}