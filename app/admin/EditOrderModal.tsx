'use client'

import { useState } from 'react'
import type { Order, OrderItem } from '@/types'

type EnrichedOrder = Order & {
  order_items?: OrderItem[]
}

export default function EditOrderModal({ order, onClose, onSaved }: { order: EnrichedOrder, onClose: () => void, onSaved: () => void }) {
  const [name, setName] = useState(order.customer_name)
  const [phone, setPhone] = useState(order.customer_phone)
  const [orderNumber, setOrderNumber] = useState(order.shopify_order_number ?? '')
  const [rush, setRush] = useState((order as { rush?: boolean }).rush || false)
  const [itemDates, setItemDates] = useState<Record<string, string>>(
    Object.fromEntries((order.order_items || []).map(i => [i.id, i.due_date]))
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    if (phone.replace(/\D/g, '').length < 10) {
      setError('Phone number must be 10 digits')
      return
    }
    setSaving(true)

    await fetch('/api/orders/' + order.id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer_name: name, customer_phone: phone, shopify_order_number: orderNumber, rush }),
    })

    for (const [itemId, dueDate] of Object.entries(itemDates)) {
      await fetch('/api/orders/' + order.id + '/items/' + itemId, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ due_date: dueDate }),
      })
    }

    setSaving(false)
    onSaved()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold text-gray-900 mb-5">Edit order</h2>

        <div className="space-y-3 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Customer name</label>
            <input value={name} onChange={e => setName(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-gray-50" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Phone number</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-gray-50" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Order number</label>
            <input value={orderNumber} onChange={e => setOrderNumber(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-gray-50" />
          </div>

          <div className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">Rush order</p>
              <p className="text-xs text-gray-400">Prints RUSH on ticket</p>
            </div>
            <button
              onClick={() => setRush(!rush)}
              className={`relative w-11 h-6 rounded-full transition-colors ${rush ? 'bg-red-500' : 'bg-gray-200'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${rush ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>

        {(order.order_items || []).length > 0 && (
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-500 mb-2">Due dates per item</label>
            <div className="space-y-2">
              {(order.order_items || []).map(item => (
                <div key={item.id} className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5">
                  <p className="text-xs font-medium text-gray-700 mb-1.5">{item.alteration_type}</p>
                  <input
                    type="date"
                    value={itemDates[item.id] || item.due_date}
                    onChange={e => setItemDates(prev => ({ ...prev, [item.id]: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2.5 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-800 disabled:opacity-40"
          >
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  )
}