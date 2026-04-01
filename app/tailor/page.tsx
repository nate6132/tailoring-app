export const dynamic = 'force-dynamic'
'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import type { Order, OrderItem, JobAssignment } from '@/types'
import AticaLogo from '@/components/AticaLogo'

type EnrichedItem = OrderItem & {
  job_assignments?: JobAssignment | JobAssignment[] | null
}

type EnrichedOrder = Order & {
  order_items?: EnrichedItem[]
}

export default function TailorPage() {
  const [view, setView] = useState<'board' | 'myjobs'>('board')
  const [orders, setOrders] = useState<EnrichedOrder[]>([])
  const [myOrders, setMyOrders] = useState<EnrichedOrder[]>([])
  const [tailorId, setTailorId] = useState('')
  const [tailorName, setTailorName] = useState('')
  const [ready, setReady] = useState(false)
  const [loading, setLoading] = useState(true)
  const [barcodeInput, setBarcodeInput] = useState('')
  const supabase = createClient()

  useEffect(() => {
    async function getMe() {
      const res = await fetch('/api/auth/me')
      const data = await res.json()
      setTailorId(data.tailorId)
      setTailorName(data.tailorName)
      setReady(true)
    }
    getMe()
  }, [])

  const loadBoard = useCallback(async () => {
    const res = await fetch('/api/orders')
    const data: EnrichedOrder[] = await res.json()
    const unclaimed = data.filter(order =>
      (order.order_items || []).some(i => i.status === 'pending' && !i.job_assignments)
    )
    setOrders(unclaimed)
    setLoading(false)
  }, [])

  const loadMyOrders = useCallback(async (id: string) => {
    if (!id) return
    const res = await fetch('/api/orders')
    const data: EnrichedOrder[] = await res.json()
    const mine = data.filter(order =>
      (order.order_items || []).some(i => {
        const ja = i.job_assignments
        if (!ja) return false
        if (Array.isArray(ja)) return ja.some(a => a.tailor_id === id && !a.completed_at)
        return ja.tailor_id === id && !ja.completed_at
      })
    )
    setMyOrders(mine)
  }, [])

  useEffect(() => {
    if (!ready) return
    loadBoard()
    if (tailorId) loadMyOrders(tailorId)
    const interval = setInterval(() => {
      loadBoard()
      if (tailorId) loadMyOrders(tailorId)
    }, 5000)
    return () => clearInterval(interval)
  }, [ready, tailorId, loadBoard, loadMyOrders])

  async function claimOrder(order: EnrichedOrder) {
    if (!tailorId) return
    const pendingItems = (order.order_items || []).filter(i => i.status === 'pending')
    for (const item of pendingItems) {
      await supabase.from('job_assignments').insert({ tailor_id: tailorId, order_item_id: item.id })
      await supabase.from('order_items').update({ status: 'in_progress' }).eq('id', item.id)
    }
    loadBoard()
    loadMyOrders(tailorId)
    setView('myjobs')
  }

  async function claimByBarcode(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/orders')
    const data: EnrichedOrder[] = await res.json()
    const order = data.find(o =>
      (o.order_items || []).some(i => i.barcode_id === barcodeInput.trim())
    )
    if (!order) return
    await claimOrder(order)
    setBarcodeInput('')
  }

  async function markOrderDone(order: EnrichedOrder) {
    const myItems = (order.order_items || []).filter(i => {
      const ja = i.job_assignments
      if (!ja) return false
      if (Array.isArray(ja)) return ja.some(a => a.tailor_id === tailorId)
      return ja.tailor_id === tailorId
    })
    for (const item of myItems) {
      await supabase.from('order_items').update({ status: 'done', completed_at: new Date().toISOString() }).eq('id', item.id)
      await supabase.from('job_assignments').update({ completed_at: new Date().toISOString() }).eq('order_item_id', item.id)
    }
    loadMyOrders(tailorId)
    loadBoard()
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login/pin'
  }

  if (!ready) {
    return (
      <div className="min-h-screen bg-[#f8f9fb] flex items-center justify-center">
        <p className="text-gray-400 text-sm">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8f9fb] flex flex-col">
      <div className="bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <AticaLogo size="sm" />
          <div className="w-px h-6 bg-gray-100" />
          <p className="text-sm text-gray-500">{tailorName || 'Tailor'}</p>
        </div>
        <button
          onClick={logout}
          className="text-xs text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition"
        >
          Switch user
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="max-w-2xl mx-auto px-4 pt-5 pb-10">
          <div className="flex bg-white border border-gray-100 rounded-2xl p-1 mb-5 shadow-sm">
            <button
              onClick={() => setView('board')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition ${
                view === 'board' ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Job board
              {orders.length > 0 && (
                <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${view === 'board' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                  {orders.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setView('myjobs')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition ${
                view === 'myjobs' ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              My jobs
              {myOrders.length > 0 && (
                <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${view === 'myjobs' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                  {myOrders.length}
                </span>
              )}
            </button>
          </div>

          {view === 'board' && (
            <div className="space-y-3">
              <form onSubmit={claimByBarcode} className="flex gap-2">
                <input
                  type="text"
                  value={barcodeInput}
                  onChange={e => setBarcodeInput(e.target.value)}
                  placeholder="Scan barcode to claim..."
                  className="flex-1 bg-white border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 shadow-sm"
                />
                <button
                  type="submit"
                  disabled={!barcodeInput}
                  className="bg-gray-900 text-white px-5 py-3 rounded-2xl text-sm font-medium hover:bg-gray-800 disabled:opacity-40 transition shadow-sm"
                >
                  Claim
                </button>
              </form>

              {loading ? (
                <div className="text-center text-gray-400 py-16 text-sm">Loading...</div>
              ) : orders.length === 0 ? (
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-10 text-center">
                  <p className="text-sm font-medium text-gray-400">No open jobs</p>
                  <p className="text-xs text-gray-300 mt-1">Check back soon</p>
                </div>
              ) : (
                orders.map(order => (
                  <div key={order.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm">{order.customer_name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{order.shopify_order_number ?? 'Manual order'}</p>
                        <div className="mt-2 space-y-1">
                          {(order.order_items || []).filter(i => i.status === 'pending').map(item => (
                            <div key={item.id} className="flex items-center gap-2">
                              <div className="w-1 h-1 rounded-full bg-gray-300 flex-shrink-0" />
                              <p className="text-xs text-gray-500">{item.alteration_type}</p>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-lg">
                            {(order.order_items || []).filter(i => i.status === 'pending').length} items
                          </span>
                          {(order.order_items || [])[0]?.due_date && (
                            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-lg">
                              Due {new Date((order.order_items || [])[0].due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => claimOrder(order)}
                        className="bg-gray-900 text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-gray-800 active:scale-95 transition flex-shrink-0"
                      >
                        Claim
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {view === 'myjobs' && (
            <div className="space-y-3">
              {myOrders.length === 0 ? (
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-10 text-center">
                  <p className="text-sm font-medium text-gray-400">No claimed jobs</p>
                  <p className="text-xs text-gray-300 mt-1">Claim a job from the board</p>
                </div>
              ) : (
                myOrders.map(order => {
                  const myItems = (order.order_items || []).filter(i => {
                    const ja = i.job_assignments
                    if (!ja) return false
                    if (Array.isArray(ja)) return ja.some(a => a.tailor_id === tailorId)
                    return ja.tailor_id === tailorId
                  })
                  const allDone = myItems.every(i => i.status === 'done')
                  return (
                    <div key={order.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm">{order.customer_name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{order.shopify_order_number ?? 'Manual order'}</p>
                          <div className="mt-2 space-y-1">
                            {myItems.map(item => (
                              <div key={item.id} className="flex items-center gap-2">
                                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${item.status === 'done' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                                <p className={`text-xs ${item.status === 'done' ? 'line-through text-gray-300' : 'text-gray-600'}`}>
                                  {item.alteration_type}
                                </p>
                              </div>
                            ))}
                          </div>
                          {myItems[0]?.due_date && (
                            <div className="mt-2.5">
                              <span className="text-xs bg-amber-50 text-amber-600 border border-amber-100 px-2 py-0.5 rounded-lg">
                                Due {new Date(myItems[0].due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                          )}
                        </div>
                        {!allDone ? (
                          <button
                            onClick={() => markOrderDone(order)}
                            className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-emerald-600 active:scale-95 transition flex-shrink-0"
                          >
                            All done
                          </button>
                        ) : (
                          <span className="text-xs bg-emerald-50 text-emerald-600 border border-emerald-100 px-3 py-2 rounded-xl flex-shrink-0 font-medium">
                            Complete
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}