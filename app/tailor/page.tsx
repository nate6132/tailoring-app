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
  const [loading, setLoading] = useState(true)
  const [barcodeInput, setBarcodeInput] = useState('')
  const supabase = createClient()

  useEffect(() => {
    const id = document.cookie.match(/tailor_id=([^;]+)/)?.[1] || ''
    const name = document.cookie.match(/tailor_name=([^;]+)/)?.[1] || ''
    setTailorId(id)
    setTailorName(decodeURIComponent(name))
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
    loadJobs()
  }, [loadJobs])

  useEffect(() => {
    if (!tailorId) return
    loadMyJobs(tailorId)
    const channel = supabase
      .channel('job-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'job_assignments' }, () => { loadJobs(); loadMyJobs(tailorId) })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, () => { loadJobs(); loadMyJobs(tailorId) })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [tailorId, loadJobs, loadMyJobs, supabase])

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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Tailor Manager</h1>
          <p className="text-sm text-gray-500">Welcome, {tailorName || 'Tailor'}</p>
        </div>
        <button onClick={logout} className="text-sm text-gray-400 hover:text-gray-600 transition">
          Switch user
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
          <button
            onClick={() => setView('board')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition ${view === 'board' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Job board
            {jobs.length > 0 && (
              <span className="ml-2 bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full">{jobs.length}</span>
            )}
          </button>
          <button
            onClick={() => setView('myjobs')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition ${view === 'myjobs' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            My jobs
            {myJobs.length > 0 && (
              <span className="ml-2 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">{myJobs.length}</span>
            )}
          </button>
        </div>

        {view === 'board' && (
          <div className="space-y-4">
            <form onSubmit={claimByBarcode} className="flex gap-2">
              <input
                type="text"
                value={barcodeInput}
                onChange={e => setBarcodeInput(e.target.value)}
                placeholder="Scan barcode to claim job..."
                className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={!barcodeInput}
                className="bg-blue-600 text-white px-5 py-3 rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-40 transition"
              >
                Claim
              </button>
            </form>

            {loading ? (
              <div className="text-center text-gray-400 py-12 text-sm">Loading jobs...</div>
            ) : jobs.length === 0 ? (
              <div className="text-center text-gray-400 py-12 text-sm">No open jobs right now</div>
            ) : (
              jobs.map(job => (
                <div key={job.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{job.alteration_type}</p>
                      <p className="text-sm text-gray-500 mt-0.5">{job.orders?.customer_name}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Due {new Date(job.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        {' · '}
                        <span className="font-mono">{job.barcode_id}</span>
                      </p>
                    </div>
                    <button
                      onClick={() => claimJob(job.id)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition"
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
          <div className="space-y-4">
            {myJobs.length === 0 ? (
              <div className="text-center text-gray-400 py-12 text-sm">No jobs claimed yet</div>
            ) : (
              myJobs.map(job => (
                <div key={job.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{job.alteration_type}</p>
                      <p className="text-sm text-gray-500 mt-0.5">{job.orders?.customer_name}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Due {new Date(job.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    <button
                      onClick={() => markDone(job.id)}
                      className="bg-green-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-green-600 transition"
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