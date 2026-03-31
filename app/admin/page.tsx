'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Order, OrderItem, JobAssignment } from '@/types'
import NewOrderForm from './NewOrderForm'
import EditOrderModal from './EditOrderModal'
import AddItemModal from './AddItemModal'

type EnrichedItem = OrderItem & {
  job_assignments?: JobAssignment | JobAssignment[] | null
}

type EnrichedOrder = Order & {
  order_items?: EnrichedItem[]
}

const STATUS_COLORS: Record<string, string> = {
  received: 'bg-gray-100 text-gray-500',
  in_progress: 'bg-yellow-50 text-yellow-600 border border-yellow-100',
  ready: 'bg-green-50 text-green-600 border border-green-100',
  picked_up: 'bg-blue-50 text-blue-600 border border-blue-100',
}

function getTailor(item: EnrichedItem): string | null {
  if (!item.job_assignments) return null
  if (Array.isArray(item.job_assignments)) {
    return item.job_assignments[0]?.tailors?.name ?? null
  }
  return item.job_assignments.tailors?.name ?? null
}

function isClaimed(item: EnrichedItem): boolean {
  if (!item.job_assignments) return false
  if (Array.isArray(item.job_assignments)) return item.job_assignments.length > 0
  return true
}

export default function AdminPanel() {
  const [orders, setOrders] = useState<EnrichedOrder[]>([])
  const [filtered, setFiltered] = useState<EnrichedOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('')
  const [tab, setTab] = useState<'orders' | 'jobs'>('orders')
  const [smsModal, setSmsModal] = useState<EnrichedOrder | null>(null)
  const [smsMessage, setSmsMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [editOrder, setEditOrder] = useState<EnrichedOrder | null>(null)
  const [addItemOrder, setAddItemOrder] = useState<EnrichedOrder | null>(null)
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set())

  const loadOrders = useCallback(async () => {
    const res = await fetch('/api/orders')
    const data = await res.json()
    setOrders(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    loadOrders()
    const interval = setInterval(loadOrders, 5000)
    return () => clearInterval(interval)
  }, [loadOrders])

  useEffect(() => {
    let result = [...orders]
    if (search) {
      const s = search.toLowerCase()
      result = result.filter(o =>
        o.customer_name.toLowerCase().includes(s) ||
        (o.shopify_order_number ?? '').toLowerCase().includes(s) ||
        o.customer_phone.includes(s)
      )
    }
    if (statusFilter !== 'all') {
      result = result.filter(o => o.status === statusFilter)
    }
    if (dateFilter) {
      result = result.filter(o => o.created_at.startsWith(dateFilter))
    }
    setFiltered(result)
  }, [orders, search, statusFilter, dateFilter])

  function toggleExpand(id: string) {
    setExpandedOrders(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function getProgress(order: EnrichedOrder) {
    const items = order.order_items || []
    const done = items.filter(i => i.status === 'done').length
    return { done, total: items.length }
  }

  function openSms(order: EnrichedOrder) {
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
      body: JSON.stringify({ orderId: smsModal.id, phone: smsModal.customer_phone, message: smsMessage }),
    })
    setSending(false)
    setSent(true)
    setTimeout(() => setSmsModal(null), 1500)
  }

  async function logout() {
    await fetch('/api/auth/logout?full=true', { method: 'POST' })
    window.location.href = '/login'
  }

  const allUnclaimed = orders.flatMap(o =>
    (o.order_items || [])
      .filter(i => i.status === 'pending' && !isClaimed(i))
      .map(i => ({ ...i, order: o }))
  )

  const allClaimed = orders.flatMap(o =>
    (o.order_items || [])
      .filter(i => i.status === 'in_progress' && isClaimed(i))
      .map(i => ({ ...i, order: o, tailor: getTailor(i) }))
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9fb] flex items-center justify-center">
        <p className="text-gray-400 text-sm">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <div className="bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M4.5 6.75h9M4.5 9h6M4.5 11.25h7.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              <rect x="2" y="3" width="14" height="12" rx="2.5" stroke="white" strokeWidth="1.5"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 leading-tight">Tailor Manager</p>
            <p className="text-xs text-gray-400 leading-tight">Admin</p>
          </div>
        </div>
        <button onClick={logout} className="text-xs text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition">
          Sign out
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-5 pb-10">
        <div className="flex bg-white border border-gray-100 rounded-2xl p-1 mb-5 shadow-sm">
          <button
            onClick={() => setTab('orders')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition ${tab === 'orders' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Orders
            <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${tab === 'orders' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
              {orders.length}
            </span>
          </button>
          <button
            onClick={() => setTab('jobs')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition ${tab === 'jobs' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Job board
            {allUnclaimed.length > 0 && (
              <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${tab === 'jobs' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-600'}`}>
                {allUnclaimed.length}
              </span>
            )}
          </button>
        </div>

        {tab === 'orders' && (
          <div className="space-y-3">
            <div className="flex gap-2 flex-wrap">
              <div className="flex-1 min-w-48">
                <input
                  type="text"
                  placeholder="Search name, order #, phone..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-2.5 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                />
              </div>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="bg-white border border-gray-200 rounded-2xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              >
                <option value="all">All statuses</option>
                <option value="received">Received</option>
                <option value="in_progress">In progress</option>
                <option value="ready">Ready</option>
                <option value="picked_up">Picked up</option>
              </select>
              <input
                type="date"
                value={dateFilter}
                onChange={e => setDateFilter(e.target.value)}
                className="bg-white border border-gray-200 rounded-2xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              />
              <NewOrderForm onCreated={loadOrders} />
            </div>

            {filtered.length === 0 ? (
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-10 text-center">
                <p className="text-sm text-gray-400">No orders found</p>
              </div>
            ) : (
              filtered.map(order => {
                const { done, total } = getProgress(order)
                const expanded = expandedOrders.has(order.id)
                const percent = total ? Math.round((done / total) * 100) : 0
                return (
                  <div key={order.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-5 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-gray-900 text-sm">{order.customer_name}</span>
                            <span className="text-gray-400 text-xs">{order.shopify_order_number ?? 'Manual'}</span>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status]}`}>
                              {order.status.replace('_', ' ')}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">{order.customer_phone}</p>
                          <p className="text-xs text-gray-300 mt-0.5">
                            {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            {' · '}
                            {done}/{total} done
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap justify-end">
                          <button onClick={() => openSms(order)} className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded-xl hover:bg-blue-700 transition">SMS</button>
                          <a href={'/print/' + order.id} target="_blank" rel="noreferrer" className="bg-gray-100 text-gray-600 text-xs px-3 py-1.5 rounded-xl hover:bg-gray-200 transition">Print</a>
                          <a href={'/track/' + order.tracking_token} target="_blank" rel="noreferrer" className="bg-gray-100 text-gray-600 text-xs px-3 py-1.5 rounded-xl hover:bg-gray-200 transition">Track</a>
                          <button onClick={() => setEditOrder(order)} className="bg-gray-100 text-gray-600 text-xs px-3 py-1.5 rounded-xl hover:bg-gray-200 transition">Edit</button>
                          <button onClick={() => toggleExpand(order.id)} className="bg-gray-100 text-gray-600 text-xs px-3 py-1.5 rounded-xl hover:bg-gray-200 transition">
                            {expanded ? 'Hide' : 'Items'}
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-1.5 bg-blue-600 rounded-full transition-all duration-500"
                          style={{ width: percent + '%' }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{percent}% complete</p>
                    </div>

                    {expanded && (
                      <div className="border-t border-gray-100">
                        <div className="px-5 py-2.5 flex justify-between items-center bg-gray-50">
                          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Items</p>
                          <button
                            onClick={() => setAddItemOrder(order)}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                          >
                            + Add item
                          </button>
                        </div>
                        <div className="divide-y divide-gray-100">
                          {(order.order_items || []).map(item => {
                            const tailor = getTailor(item)
                            return (
                              <div key={item.id} className="px-5 py-3 flex items-center justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm font-medium ${item.status === 'done' ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                                    {item.alteration_type}
                                  </p>
                                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                    <p className="text-xs text-gray-400">
                                      Due {new Date(item.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </p>
                                    {tailor && (
                                      <span className="text-xs bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-lg">
                                        {tailor}
                                      </span>
                                    )}
                                    {!tailor && item.status === 'pending' && (
                                      <span className="text-xs text-gray-300">Unclaimed</span>
                                    )}
                                    <p className="text-xs text-gray-200 font-mono">{item.barcode_id}</p>
                                  </div>
                                </div>
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${
                                  item.status === 'done' ? 'bg-green-50 text-green-600 border border-green-100' :
                                  item.status === 'in_progress' ? 'bg-yellow-50 text-yellow-600 border border-yellow-100' :
                                  'bg-gray-100 text-gray-400'
                                }`}>
                                  {item.status === 'done' ? 'Done' : item.status === 'in_progress' ? 'In progress' : 'Pending'}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        )}

        {tab === 'jobs' && (
          <div className="space-y-5">
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
                Unclaimed · {allUnclaimed.length} open
              </p>
              {allUnclaimed.length === 0 ? (
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 text-center">
                  <p className="text-sm text-gray-400">No unclaimed jobs</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {allUnclaimed.map(item => (
                    <div key={item.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-3.5 flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{item.alteration_type}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {item.order.customer_name}
                          {' · '}
                          {item.order.shopify_order_number ?? 'Manual'}
                          {' · '}
                          Due {new Date(item.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                      <span className="text-xs bg-gray-100 text-gray-400 px-2.5 py-1 rounded-xl flex-shrink-0">
                        Unclaimed
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
                In progress · {allClaimed.length} active
              </p>
              {allClaimed.length === 0 ? (
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 text-center">
                  <p className="text-sm text-gray-400">No active jobs</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {allClaimed.map(item => (
                    <div key={item.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-3.5 flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{item.alteration_type}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {item.order.customer_name}
                          {' · '}
                          {item.order.shopify_order_number ?? 'Manual'}
                          {' · '}
                          Due {new Date(item.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                      <span className="text-xs bg-blue-50 text-blue-600 border border-blue-100 px-2.5 py-1 rounded-xl flex-shrink-0 font-medium">
                        {item.tailor}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {smsModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-1">Send SMS</h2>
            <p className="text-sm text-gray-400 mb-4">To: {smsModal.customer_phone}</p>
            <textarea
              value={smsMessage}
              onChange={e => setSmsMessage(e.target.value)}
              rows={4}
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 resize-none"
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setSmsModal(null)} className="px-4 py-2 text-sm text-gray-400 hover:text-gray-600">Cancel</button>
              <button onClick={sendSms} disabled={sending || sent} className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-40">
                {sent ? 'Sent!' : sending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}

      {editOrder && (
        <EditOrderModal order={editOrder} onClose={() => setEditOrder(null)} onSaved={loadOrders} />
      )}

      {addItemOrder && (
        <AddItemModal order={addItemOrder} onClose={() => setAddItemOrder(null)} onSaved={loadOrders} />
      )}
    </div>
  )
}