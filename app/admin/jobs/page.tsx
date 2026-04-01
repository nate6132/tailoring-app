'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect, useCallback } from 'react'
import type { OrderItem, Order, JobAssignment } from '@/types'

type EnrichedItem = OrderItem & {
  job_assignments?: JobAssignment | JobAssignment[] | null
  order: Order
  tailor?: string | null
}

function getTailor(item: OrderItem & { job_assignments?: JobAssignment | JobAssignment[] | null }): string | null {
  if (!item.job_assignments) return null
  if (Array.isArray(item.job_assignments)) return item.job_assignments[0]?.tailors?.name ?? null
  return item.job_assignments.tailors?.name ?? null
}

function isClaimed(item: OrderItem & { job_assignments?: JobAssignment | JobAssignment[] | null }): boolean {
  if (!item.job_assignments) return false
  if (Array.isArray(item.job_assignments)) return item.job_assignments.length > 0
  return true
}

export default function JobsPage() {
  const [orders, setOrders] = useState<(Order & { order_items?: (OrderItem & { job_assignments?: JobAssignment | JobAssignment[] | null })[] })[]>([])
  const [loading, setLoading] = useState(true)

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

  const allUnclaimed: EnrichedItem[] = orders.flatMap(o =>
    (o.order_items || [])
      .filter(i => i.status === 'pending' && !isClaimed(i))
      .map(i => ({ ...i, order: o }))
  )

  const allClaimed: EnrichedItem[] = orders.flatMap(o =>
    (o.order_items || [])
      .filter(i => i.status === 'in_progress' && isClaimed(i))
      .map(i => ({ ...i, order: o, tailor: getTailor(i) }))
  )

  const allDoneToday: EnrichedItem[] = orders.flatMap(o =>
    (o.order_items || [])
      .filter(i => {
        if (i.status !== 'done') return false
        const today = new Date().toDateString()
        return i.completed_at ? new Date(i.completed_at).toDateString() === today : false
      })
      .map(i => ({ ...i, order: o, tailor: getTailor(i) }))
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-400 text-sm">Loading...</p>
      </div>
    )
  }

  return (
    <div className="px-4 md:px-8 py-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Job board</h1>
        <p className="text-sm text-gray-400 mt-0.5">Live view of all jobs across all tailors</p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-2xl font-bold text-gray-900">{allUnclaimed.length}</p>
          <p className="text-xs text-gray-400 mt-0.5">Unclaimed</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-2xl font-bold text-yellow-600">{allClaimed.length}</p>
          <p className="text-xs text-gray-400 mt-0.5">In progress</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-2xl font-bold text-green-600">{allDoneToday.length}</p>
          <p className="text-xs text-gray-400 mt-0.5">Done today</p>
        </div>
      </div>

      <div className="space-y-5">
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
            Unclaimed · {allUnclaimed.length}
          </p>
          {allUnclaimed.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
              <p className="text-sm text-gray-400">No unclaimed jobs</p>
            </div>
          ) : (
            <div className="space-y-2">
              {allUnclaimed.map(item => (
                <div key={item.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-3.5 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.alteration_type}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {item.order.customer_name} · {item.order.shopify_order_number ?? 'Manual'} · Due {new Date(item.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <span className="text-xs bg-gray-100 text-gray-400 px-2.5 py-1 rounded-xl flex-shrink-0">Unclaimed</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
            In progress · {allClaimed.length}
          </p>
          {allClaimed.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
              <p className="text-sm text-gray-400">No active jobs</p>
            </div>
          ) : (
            <div className="space-y-2">
              {allClaimed.map(item => (
                <div key={item.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-3.5 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.alteration_type}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {item.order.customer_name} · {item.order.shopify_order_number ?? 'Manual'} · Due {new Date(item.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <span className="text-xs bg-blue-50 text-blue-600 border border-blue-100 px-2.5 py-1 rounded-xl flex-shrink-0 font-medium">{item.tailor}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
            Done today · {allDoneToday.length}
          </p>
          {allDoneToday.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
              <p className="text-sm text-gray-400">Nothing completed today yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {allDoneToday.map(item => (
                <div key={item.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-3.5 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-400 line-through">{item.alteration_type}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {item.order.customer_name} · {item.tailor}
                    </p>
                  </div>
                  <span className="text-xs bg-green-50 text-green-600 border border-green-100 px-2.5 py-1 rounded-xl flex-shrink-0">Done</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}