'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import type { Order, OrderItem } from '@/types'
import NewOrderForm from './NewOrderForm'

const STATUS_COLORS: Record<string, string> = {
  received: 'bg-gray-100 text-gray-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  ready: 'bg-green-100 text-green-700',
  picked_up: 'bg-blue-100 text-blue-700',
}

export default function AdminPanel() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [smsModal, setSmsModal] = useState<Order | null>(null)
  const [smsMessage, setSmsMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const supabase = createClient()

  const loadOrders = useCallback(async () => {
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false })
    setOrders(data || [])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    loadOrders()
    const channel = supabase
      .channel('orders-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => loadOrders())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, () => loadOrders())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [loadOrders, supabase])

  function openSms(order: Order) {
    setSmsModal(order)
    setSmsMessage('Hi ' + order.customer_name + ', your tailoring order is ready for pickup!')
    setSent(false)
  }

  async function sendSms() {
    if (!smsModal) return
    setSending(true)
    await fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: smsModal.id,
        phone: smsModal.customer_phone,
        message: smsMessage,
      }),
    })
    setSending(false)
    setSent(true)
    setTimeout(() => setSmsModal(null), 1500)
  }

  function getProgress(order: Order) {
    const items = order.order_items || []
    const done = items.filter((i: OrderItem) => i.status === 'done').length
    return { done, total: items.length }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500">
        Loading orders...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Admin Panel</h1>
          <div className="flex items-center gap-3">
            <NewOrderForm onCreated={loadOrders} />
            <span className="text-gray-500 text-sm">{orders.length} orders</span>
          </div>
        </div>
        <div className="space-y-4">
          {orders.map(order => {
            const { done, total } = getProgress(order)
            return (
              <div key={order.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-800">{order.customer_name}</span>
                      <span className="text-gray-400 text-sm">{order.shopify_order_number ?? 'Manual'}</span>
                    </div>
                    <p className="text-sm text-gray-500">{order.customer_phone}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">{done}/{total} done</span>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLORS[order.status]}`}>
                      {order.status.replace('_', ' ')}
                    </span>
                    <button onClick={() => openSms(order)} className="bg-blue-600 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-blue-700 transition">
                      Send SMS
                    </button>
                    <a href={'/print/' + order.id} target="_blank" rel="noreferrer" className="bg-gray-100 text-gray-700 text-sm px-3 py-1.5 rounded-lg hover:bg-gray-200 transition">
                      Print
                    </a>
                    <a href={'/track/' + order.tracking_token} target="_blank" rel="noreferrer" className="bg-gray-100 text-gray-700 text-sm px-3 py-1.5 rounded-lg hover:bg-gray-200 transition">
                      Track
                    </a>
                  </div>
                </div>
                <div className="h-1 bg-gray-100">
                  <div className="h-1 bg-green-500 transition-all duration-500" style={{ width: total ? (done / total) * 100 + '%' : '0%' }} />
                </div>
                <div className="px-6 py-3 flex flex-wrap gap-2">
                  {(order.order_items || []).map((item: OrderItem) => (
                    <span key={item.id} className={`text-xs px-2 py-1 rounded-full ${item.status === 'done' ? 'bg-green-100 text-green-700 line-through' : 'bg-gray-100 text-gray-600'}`}>
                      {item.alteration_type}
                    </span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
      {smsModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-1">Send SMS</h2>
            <p className="text-sm text-gray-500 mb-4">To: {smsModal.customer_phone}</p>
            <textarea value={smsMessage} onChange={e => setSmsMessage(e.target.value)} rows={4} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4" />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setSmsModal(null)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
                Cancel
              </button>
              <button onClick={sendSms} disabled={sending || sent} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                {sent ? 'Sent!' : sending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}