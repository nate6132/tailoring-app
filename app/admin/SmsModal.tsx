'use client'

import { useState } from 'react'
import type { Order, OrderItem, JobAssignment } from '@/types'

type EnrichedItem = OrderItem & {
  job_assignments?: JobAssignment | JobAssignment[] | null
}

type EnrichedOrder = Order & {
  order_items?: EnrichedItem[]
}

export default function SmsModal({
  order,
  onClose,
}: {
  order: EnrichedOrder
  onClose: () => void
}) {
  const items = order.order_items || []
  const doneItems = items.filter(i => i.status === 'done')
  const totalItems = items.length
  const trackingUrl = process.env.NEXT_PUBLIC_APP_URL + '/track/' + order.tracking_token

  const presets = [
    {
      label: 'Order received',
      message: 'Hi ' + order.customer_name + ', your tailoring order ' + (order.shopify_order_number ?? '') + ' has been received! Track your order here: ' + trackingUrl,
    },
    {
      label: doneItems.length + ' of ' + totalItems + ' items ready',
      message: 'Hi ' + order.customer_name + ', ' + doneItems.length + ' of ' + totalItems + ' items in your tailoring order are ready. Track progress here: ' + trackingUrl,
    },
    {
      label: 'Full order ready',
      message: 'Hi ' + order.customer_name + ', your full tailoring order is ready for pickup! ' + trackingUrl,
    },
    {
      label: 'Custom message',
      message: '',
    },
  ]

  const [selected, setSelected] = useState(0)
  const [message, setMessage] = useState(presets[0].message)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  function selectPreset(idx: number) {
    setSelected(idx)
    if (presets[idx].message) {
      setMessage(presets[idx].message)
    } else {
      setMessage('')
    }
  }

  async function sendSms() {
    setSending(true)
    await fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: order.id,
        phone: order.customer_phone,
        message,
      }),
    })
    setSending(false)
    setSent(true)
    setTimeout(() => onClose(), 1500)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-0.5">Send SMS</h2>
        <p className="text-sm text-gray-400 mb-4">To: {order.customer_phone}</p>

        <div className="grid grid-cols-2 gap-2 mb-4">
          {presets.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => selectPreset(idx)}
              className={`text-xs px-3 py-2 rounded-xl border text-left transition ${
                selected === idx
                  ? 'border-blue-600 bg-blue-50 text-blue-700 font-medium'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <textarea
          value={message}
          onChange={e => { setMessage(e.target.value); setSelected(3) }}
          rows={4}
          placeholder="Type a custom message..."
          className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 resize-none"
        />

        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-gray-600">
            Cancel
          </button>
          <button
            onClick={sendSms}
            disabled={sending || sent || !message}
            className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-40"
          >
            {sent ? 'Sent!' : sending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  )
}