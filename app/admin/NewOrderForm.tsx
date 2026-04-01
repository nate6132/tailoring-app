'use client'

import { useState } from 'react'

function getDefaultDueDate(): string {
  const date = new Date()
  const day = date.getDay()
  const daysToAdd: Record<number, number> = {
    0: 5,
    1: 6,
    2: 6,
    3: 6,
    4: 6,
    5: 6,
    6: 6,
  }
  date.setDate(date.getDate() + daysToAdd[day])
  return date.toISOString().split('T')[0]
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })
}

export default function NewOrderForm({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [orderNumber, setOrderNumber] = useState('')
  const [itemInput, setItemInput] = useState('')
  const [items, setItems] = useState<string[]>([])
  const [rush, setRush] = useState(false)
  const [dueDate, setDueDate] = useState(() => getDefaultDueDate())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function handleOpen() {
    setDueDate(getDefaultDueDate())
    setRush(false)
    setOpen(true)
  }

  function addItem() {
    if (!itemInput.trim()) return
    setItems(prev => [...prev, itemInput.trim()])
    setItemInput('')
  }

  function removeItem(index: number) {
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  function handleRushToggle(val: boolean) {
    setRush(val)
    if (!val) setDueDate(getDefaultDueDate())
  }

  async function handleSubmit() {
    setError('')
    if (!name || !phone || !orderNumber || items.length === 0) {
      setError('All fields are required')
      return
    }
    if (phone.replace(/\D/g, '').length < 10) {
      setError('Phone number must be 10 digits')
      return
    }
    setSaving(true)
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: name,
        customer_phone: phone,
        shopify_order_number: orderNumber,
        items,
        rush,
        due_date: dueDate,
      }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) {
      setError(data.error || 'Failed to create order')
      return
    }
    setOpen(false)
    setName('')
    setPhone('')
    setOrderNumber('')
    setItems([])
    setRush(false)
    setDueDate(getDefaultDueDate())
    onCreated()
  }

  if (!open) {
    return (
      <button
        onClick={handleOpen}
        className="w-full bg-gray-900 text-white px-4 py-3 rounded-2xl text-sm font-medium hover:bg-gray-800 transition"
      >
        + New Order
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold text-gray-900 mb-5">New order</h2>

        <div className="space-y-3 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Customer name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              placeholder="Full name"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Phone number <span className="text-red-400">*</span>
            </label>
            <input
              type="tel"
              placeholder="10-digit phone"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Order number <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. #1042"
              value={orderNumber}
              onChange={e => setOrderNumber(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-gray-50"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-500 mb-1.5">
            Alterations <span className="text-red-400">*</span>
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              placeholder="e.g. Hem dress pants"
              value={itemInput}
              onChange={e => setItemInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addItem()}
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-gray-50"
            />
            <button
              onClick={addItem}
              className="bg-gray-100 text-gray-700 px-4 py-2.5 rounded-xl text-sm hover:bg-gray-200 transition font-medium"
            >
              Add
            </button>
          </div>
          <div className="space-y-1.5">
            {items.map((item, i) => (
              <div key={i} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-xl border border-gray-100">
                <span className="text-sm text-gray-700">{item}</span>
                <button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600 text-xs font-medium">
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-4 bg-gray-50 rounded-2xl p-4 border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">Rush order</p>
              <p className="text-xs text-gray-400 mt-0.5">Prints RUSH on ticket, set custom due date</p>
            </div>
            <button
              onClick={() => handleRushToggle(!rush)}
              className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${rush ? 'bg-red-500' : 'bg-gray-200'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${rush ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Due date {rush ? <span className="text-red-400">(custom — pick any date)</span> : <span className="text-gray-400">(auto calculated)</span>}
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              disabled={!rush}
              className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 transition ${
                rush ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            />
            <p className="text-xs text-gray-400 mt-1.5">
              {rush
                ? 'Custom: ' + formatDate(dueDate)
                : 'Auto due: ' + formatDate(dueDate)
              }
            </p>
          </div>
        </div>

        <div className="mb-4 bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3">
          <p className="text-xs text-blue-600 font-medium">Order received today</p>
          <p className="text-xs text-blue-500 mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-2.5 mb-4">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <div className="flex gap-2 justify-end">
          <button
            onClick={() => { setOpen(false); setError('') }}
            className="px-4 py-2.5 text-sm text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !name || !phone || !orderNumber || items.length === 0}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium disabled:opacity-40 transition text-white ${
              rush ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-900 hover:bg-gray-800'
            }`}
          >
            {saving ? 'Creating...' : rush ? 'Create rush order' : 'Create order'}
          </button>
        </div>
      </div>
    </div>
  )
}