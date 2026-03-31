'use client'

import { useState } from 'react'
import type { Order } from '@/types'

export default function AddItemModal({ order, onClose, onSaved }: { order: Order, onClose: () => void, onSaved: () => void }) {
  const [alteration, setAlteration] = useState('')
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
  const [saving, setSaving] = useState(false)
  const [printChoice, setPrintChoice] = useState<null | boolean>(null)

  async function handleSave(shouldPrint: boolean) {
    setSaving(true)
    const res = await fetch('/api/orders/' + order.id + '/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alteration_type: alteration, due_date: dueDate }),
    })
    const data = await res.json()
    setSaving(false)
    if (shouldPrint && data.item) {
      window.open('/print/' + order.id, '_blank')
    }
    onSaved()
    onClose()
  }

  if (printChoice === null) {
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-5">Add item to order</h2>
          <div className="space-y-3 mb-6">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Alteration type</label>
              <input
                value={alteration}
                onChange={e => setAlteration(e.target.value)}
                placeholder="e.g. Hem dress pants"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Due date</label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
            <button
              onClick={() => setPrintChoice(true)}
              disabled={!alteration}
              className="bg-gray-100 text-gray-700 px-5 py-2 rounded-xl text-sm font-medium hover:bg-gray-200 disabled:opacity-40"
            >
              Add + print
            </button>
            <button
              onClick={() => setPrintChoice(false)}
              disabled={!alteration}
              className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-40"
            >
              Just add
            </button>
          </div>
        </div>
      </div>
    )
  }

  handleSave(printChoice)
  return null
}