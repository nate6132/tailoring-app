'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import type { Order, OrderItem } from '@/types'

type JobItem = OrderItem & {
  orders: Order
  job_assignments?: { id: string; tailor_id: string; claimed_at: string }[]
}

export default function TailorPage() {
  const [view, setView] = useState<'board' | 'myjobs'>('board')
  const [jobs, setJobs] = useState<JobItem[]>([])
  const [myJobs, setMyJobs] = useState<JobItem[]>([])
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

  const loadJobs = useCallback(async () => {
    const { data, error } = await supabase
      .from('order_items')
      .select('*, orders(*), job_assignments(*)')
      .eq('status', 'pending')
      .order('created_at')
    if (error) console.error('loadJobs error:', error)
    setJobs((data || []).filter((item: JobItem) => !item.job_assignments?.length))
    setLoading(false)
  }, [supabase])

  const loadMyJobs = useCallback(async (id: string) => {
    if (!id) return
    const { data, error } = await supabase
      .from('job_assignments')
      .select('*, order_items(*, orders(*))')
      .eq('tailor_id', id)
      .is('completed_at', null)
    if (error) console.error('loadMyJobs error:', error)
    setMyJobs((data || []).map((a: { order_items: JobItem }) => a.order_items))
  }, [supabase])

  useEffect(() => {
    if (!ready) return
    loadJobs()
    if (tailorId) loadMyJobs(tailorId)
    const channel = supabase
      .channel('job-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'job_assignments' }, () => { loadJobs(); loadMyJobs(tailorId) })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, () => { loadJobs(); loadMyJobs(tailorId) })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [ready, tailorId, loadJobs, loadMyJobs, supabase])

  async function claimJob(itemId: string) {
    if (!tailorId) return
    await supabase.from('job_assignments').insert({ tailor_id: tailorId, order_item_id: itemId })
    await supabase.from('order_items').update({ status: 'in_progress' }).eq('id', itemId)
    loadJobs()
    loadMyJobs(tailorId)
    setView('myjobs')
  }

  async function claimByBarcode(e: React.FormEvent) {
    e.preventDefault()
    const { data: item } = await supabase
      .from('order_items')
      .select('*')
      .eq('barcode_id', barcodeInput.trim())
      .single()
    if (!item) return
    await claimJob(item.id)
    setBarcodeInput('')
  }

  async function markDone(itemId: string) {
    await supabase.from('order_items').update({ status: 'done', completed_at: new Date().toISOString() }).eq('id', itemId)
    await supabase.from('job_assignments').update({ completed_at: new Date().toISOString() }).eq('order_item_id', itemId)
    loadMyJobs(tailorId)
    loadJobs()
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
            <p className="text-xs text-gray-400 leading-tight">{tailorName || 'Tailor'}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="text-xs text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition"
        >
          Switch user
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-5 pb-10">
        <div className="flex bg-white border border-gray-100 rounded-2xl p-1 mb-5 shadow-sm">
          <button
            onClick={() => setView('board')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition ${
              view === 'board'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Job board
            {jobs.length > 0 && (
              <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${view === 'board' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-600'}`}>
                {jobs.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setView('myjobs')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition ${
              view === 'myjobs'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            My jobs
            {myJobs.length > 0 && (
              <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${view === 'myjobs' ? 'bg-white/20 text-white' : 'bg-green-100 text-green-600'}`}>
                {myJobs.length}
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
                className="flex-1 bg-white border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              />
              <button
                type="submit"
                disabled={!barcodeInput}
                className="bg-blue-600 text-white px-5 py-3 rounded-2xl text-sm font-medium hover:bg-blue-700 disabled:opacity-40 transition shadow-sm"
              >
                Claim
              </button>
            </form>

            {loading ? (
              <div className="text-center text-gray-400 py-16 text-sm">Loading...</div>
            ) : jobs.length === 0 ? (
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-10 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <path d="M11 7v4l2.5 2.5" stroke="#9CA3AF" strokeWidth="1.75" strokeLinecap="round"/>
                    <circle cx="11" cy="11" r="8" stroke="#9CA3AF" strokeWidth="1.75"/>
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-500">No open jobs</p>
                <p className="text-xs text-gray-400 mt-1">Check back soon</p>
              </div>
            ) : (
              jobs.map(job => (
                <div key={job.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm leading-snug">{job.alteration_type}</p>
                      <p className="text-sm text-gray-500 mt-0.5">{job.orders?.customer_name}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-lg">
                          Due {new Date(job.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                        <span className="text-xs text-gray-300 font-mono">{job.barcode_id}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => claimJob(job.id)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-blue-700 active:scale-95 transition flex-shrink-0"
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
            {myJobs.length === 0 ? (
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-10 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <path d="M7 11l3 3 5-5" stroke="#9CA3AF" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="11" cy="11" r="8" stroke="#9CA3AF" strokeWidth="1.75"/>
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-500">No claimed jobs</p>
                <p className="text-xs text-gray-400 mt-1">Claim a job from the board</p>
              </div>
            ) : (
              myJobs.map(job => (
                <div key={job.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm leading-snug">{job.alteration_type}</p>
                      <p className="text-sm text-gray-500 mt-0.5">{job.orders?.customer_name}</p>
                      <div className="mt-2">
                        <span className="text-xs bg-yellow-50 text-yellow-600 border border-yellow-100 px-2 py-0.5 rounded-lg">
                          Due {new Date(job.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => markDone(job.id)}
                      className="bg-green-500 text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-green-600 active:scale-95 transition flex-shrink-0"
                    >
                      Done
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}