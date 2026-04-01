'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Order, OrderItem, JobAssignment } from '@/types'
import NewOrderForm from './NewOrderForm'
import EditOrderModal from './EditOrderModal'
import AddItemModal from './AddItemModal'
import SmsModal from './SmsModal'

type EnrichedItem = OrderItem & {
  job_assignments?: JobAssignment | JobAssignment[] | null
}

type EnrichedOrder = Order & {
  order_items?: EnrichedItem[]
}

const STATUS_COLORS: Record<string, string> = {
  received: 'bg-gray-100 text-gray-500',
  in_progress: 'bg-amber-50 text-amber-600 border border-amber-100',
  ready: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
  picked_up: 'bg-blue-50 text-blue-600 border border-blue-100',
}

function getTailor(item: EnrichedItem): string | null {
  if (!item.job_assignments) return null
  if (Array.isArray(item.job_assignments)) return item.job_assignments[0]?.tailors?.name ?? null
  return item.job_assignments.tailors?.name ?? null
}

export default function AdminPage() {
  const [orders, setOrders] = useState<EnrichedOrder[]>([])
  const [filtered, setFiltered] = useState<EnrichedOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('')
  const [smsOrder, setSmsOrder] = useState<EnrichedOrder | null>(null)
  const [editOrder, setEditOrder] = useState<EnrichedOrder | null>(null)
  const [addItemOrder, setAddItemOrder] = useState<EnrichedOrder | null>(null)
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set())
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

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
    if (statusFilter !== 'all') result = result.filter(o => o.status === statusFilter)
    if (dateFilter) result = result.filter(o => o.created_at.startsWith(dateFilter))
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

  async function deleteOrder(id: string) {
    await fetch('/api/orders/' + id, { method: 'DELETE' })
    setDeleteConfirm(null)
    loadOrders()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-400 text-sm">Loading...</p>
      </div>
    )
  }

  return (
    <div className="px-4 md:px-8 py-6 max-w-4xl mx-auto">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">Orders</h1>
        <p className="text-sm text-gray-400 mt-0.5">{orders.length} total</p>
      </div>

      <div className="space-y-2 mb-5">
        <input
          type="text"
          placeholder="Search name, order #, phone..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 shadow-sm"
        />
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="flex-1 bg-white border border-gray-200 rounded-2xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 shadow-sm"
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
            className="flex-1 bg-white border border-gray-200 rounded-2xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 shadow-sm"
          />
        </div>
        <NewOrderForm onCreated={loadOrders} />
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-12 text-center">
            <p className="text-sm text-gray-400">No orders found</p>
          </div>
        ) : (
          filtered.map(order => {
            const { done, total } = getProgress(order)
            const expanded = expandedOrders.has(order.id)
            const percent = total ? Math.round((done / total) * 100) : 0
            const dueDate = order.order_items?.[0]?.due_date
            return (
              <div key={order.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-semibold text-gray-900 text-sm">{order.customer_name}</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status]}`}>
                          {order.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">{order.shopify_order_number ?? 'No order #'}</p>
                      <p className="text-xs text-gray-400">{order.customer_phone}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <p className="text-xs text-gray-300">
                          In: {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                        {dueDate && (
                          <p className="text-xs text-gray-300">
                            Due: {new Date(dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </p>
                        )}
                        <p className="text-xs text-gray-300">{done}/{total} done</p>
                      </div>
                    </div>
                  </div>

                  <div className="h-1 bg-gray-100 rounded-full overflow-hidden mb-3">
                    <div className="h-1 bg-gray-800 rounded-full transition-all duration-500" style={{ width: percent + '%' }} />
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    <button onClick={() => setSmsOrder(order)} className="bg-gray-900 text-white text-xs px-3 py-1.5 rounded-xl hover:bg-gray-800 transition">SMS</button>
                    <a href={'/print/' + order.id} target="_blank" rel="noreferrer" className="bg-gray-100 text-gray-600 text-xs px-3 py-1.5 rounded-xl hover:bg-gray-200 transition">Print</a>
                    <a href={'/track/' + order.tracking_token} target="_blank" rel="noreferrer" className="bg-gray-100 text-gray-600 text-xs px-3 py-1.5 rounded-xl hover:bg-gray-200 transition">Track</a>
                    <button onClick={() => setEditOrder(order)} className="bg-gray-100 text-gray-600 text-xs px-3 py-1.5 rounded-xl hover:bg-gray-200 transition">Edit</button>
                    <button onClick={() => toggleExpand(order.id)} className="bg-gray-100 text-gray-600 text-xs px-3 py-1.5 rounded-xl hover:bg-gray-200 transition">
                      {expanded ? 'Hide' : 'Items'}
                    </button>
                    <button onClick={() => setDeleteConfirm(order.id)} className="bg-red-50 text-red-400 text-xs px-3 py-1.5 rounded-xl hover:bg-red-100 transition">Delete</button>
                  </div>
                </div>

                {expanded && (
                  <div className="border-t border-gray-100">
                    <div className="px-5 py-2.5 flex justify-between items-center bg-gray-50/50">
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Items</p>
                      <button onClick={() => setAddItemOrder(order)} className="text-xs text-gray-900 font-medium hover:text-gray-700">+ Add item</button>
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
                                <p className="text-xs text-gray-400">Due {new Date(item.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                                {tailor && <span className="text-xs bg-blue-50 text-blue-500 px-2 py-0.5 rounded-lg">{tailor}</span>}
                                {!tailor && item.status === 'pending' && <span className="text-xs text-gray-300">Unclaimed</span>}
                              </div>
                            </div>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${
                              item.status === 'done' ? 'bg-emerald-50 text-emerald-600' :
                              item.status === 'in_progress' ? 'bg-amber-50 text-amber-600' :
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

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 6v4M10 14h.01M19 10a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <h2 className="text-base font-bold text-gray-900 mb-1">Delete order?</h2>
            <p className="text-sm text-gray-400 mb-6">This cannot be undone.</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-200 transition">
                Cancel
              </button>
              <button onClick={() => deleteOrder(deleteConfirm)} className="flex-1 bg-red-500 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-red-600 transition">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {smsOrder && <SmsModal order={smsOrder} onClose={() => setSmsOrder(null)} />}
      {editOrder && <EditOrderModal order={editOrder} onClose={() => setEditOrder(null)} onSaved={loadOrders} />}
      {addItemOrder && <AddItemModal order={addItemOrder} onClose={() => setAddItemOrder(null)} onSaved={loadOrders} />}
    </div>
  )
}