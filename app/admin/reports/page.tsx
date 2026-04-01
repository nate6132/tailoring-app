export const dynamic = 'force-dynamic'
'use client'

import { useState, useEffect, useCallback } from 'react'

type Assignment = {
  id: string
  claimed_at: string
  completed_at: string | null
  tailor_id: string
  tailors: { name: string }
  order_items: {
    alteration_type: string
    status: string
    orders: {
      shopify_order_number: string | null
      customer_name: string
    }
  }
}

type TailorStats = {
  name: string
  totalDone: number
  totalInProgress: number
  avgMinutes: number
  byType: Record<string, { count: number; avgMinutes: number }>
  currentJobs: { alteration_type: string; customer: string; claimedAt: string }[]
}

export default function ReportsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState<'today' | 'week' | 'month' | 'all'>('week')

  const load = useCallback(async () => {
    const res = await fetch('/api/reports')
    const data = await res.json()
    setAssignments(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(load, 10000)
    return () => clearInterval(interval)
  }, [load])

  function inRange(dateStr: string) {
    const date = new Date(dateStr)
    const now = new Date()
    if (range === 'today') {
      return date.toDateString() === now.toDateString()
    }
    if (range === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      return date >= weekAgo
    }
    if (range === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      return date >= monthAgo
    }
    return true
  }

  const filtered = assignments.filter(a => inRange(a.claimed_at))

  const tailorMap: Record<string, TailorStats> = {}

  for (const a of filtered) {
    const name = a.tailors?.name || 'Unknown'
    if (!tailorMap[name]) {
      tailorMap[name] = {
        name,
        totalDone: 0,
        totalInProgress: 0,
        avgMinutes: 0,
        byType: {},
        currentJobs: [],
      }
    }

    const t = tailorMap[name]
    const altType = a.order_items?.alteration_type || 'Unknown'

    if (a.completed_at) {
      t.totalDone++
      const mins = (new Date(a.completed_at).getTime() - new Date(a.claimed_at).getTime()) / 60000

      if (!t.byType[altType]) t.byType[altType] = { count: 0, avgMinutes: 0 }
      const bt = t.byType[altType]
      bt.avgMinutes = (bt.avgMinutes * bt.count + mins) / (bt.count + 1)
      bt.count++
    } else {
      t.totalInProgress++
      t.currentJobs.push({
        alteration_type: altType,
        customer: a.order_items?.orders?.customer_name || 'Unknown',
        claimedAt: a.claimed_at,
      })
    }
  }

  for (const t of Object.values(tailorMap)) {
    const doneTimes = filtered
      .filter(a => a.tailors?.name === t.name && a.completed_at)
      .map(a => (new Date(a.completed_at!).getTime() - new Date(a.claimed_at).getTime()) / 60000)
    t.avgMinutes = doneTimes.length ? doneTimes.reduce((a, b) => a + b, 0) / doneTimes.length : 0
  }

  const tailors = Object.values(tailorMap).sort((a, b) => b.totalDone - a.totalDone)

  const allByType: Record<string, { count: number; avgMinutes: number; tailors: string[] }> = {}
  for (const a of filtered) {
    if (!a.completed_at) continue
    const type = a.order_items?.alteration_type || 'Unknown'
    const mins = (new Date(a.completed_at).getTime() - new Date(a.claimed_at).getTime()) / 60000
    if (!allByType[type]) allByType[type] = { count: 0, avgMinutes: 0, tailors: [] }
    const bt = allByType[type]
    bt.avgMinutes = (bt.avgMinutes * bt.count + mins) / (bt.count + 1)
    bt.count++
    const tailorName = a.tailors?.name
    if (tailorName && !bt.tailors.includes(tailorName)) bt.tailors.push(tailorName)
  }

  const typeStats = Object.entries(allByType).sort((a, b) => b[1].count - a[1].count)

  function formatMins(mins: number) {
    if (mins < 60) return Math.round(mins) + 'm'
    return Math.floor(mins / 60) + 'h ' + Math.round(mins % 60) + 'm'
  }

  function timeAgo(dateStr: string) {
    const mins = (Date.now() - new Date(dateStr).getTime()) / 60000
    if (mins < 60) return Math.round(mins) + 'm ago'
    return Math.floor(mins / 60) + 'h ago'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-400 text-sm">Loading...</p>
      </div>
    )
  }

  return (
    <div className="px-4 md:px-8 py-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-400 mt-0.5">Tailor performance and job tracking</p>
        </div>
        <div className="flex bg-gray-100 rounded-xl p-1">
          {(['today', 'week', 'month', 'all'] as const).map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                range === r ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {r === 'all' ? 'All time' : r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-2xl font-bold text-gray-900">{filtered.filter(a => a.completed_at).length}</p>
          <p className="text-xs text-gray-400 mt-0.5">Jobs completed</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-2xl font-bold text-yellow-600">{filtered.filter(a => !a.completed_at).length}</p>
          <p className="text-xs text-gray-400 mt-0.5">In progress</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-2xl font-bold text-blue-600">{tailors.length}</p>
          <p className="text-xs text-gray-400 mt-0.5">Active tailors</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        {tailors.map(tailor => (
          <div key={tailor.name} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-gray-900">{tailor.name}</h2>
                <div className="flex items-center gap-2">
                  {tailor.totalInProgress > 0 && (
                    <span className="text-xs bg-yellow-50 text-yellow-600 border border-yellow-100 px-2 py-0.5 rounded-full">
                      {tailor.totalInProgress} active
                    </span>
                  )}
                  <span className="text-xs bg-green-50 text-green-600 border border-green-100 px-2 py-0.5 rounded-full">
                    {tailor.totalDone} done
                  </span>
                </div>
              </div>
              {tailor.avgMinutes > 0 && (
                <p className="text-xs text-gray-400 mt-1">
                  Avg completion time: {formatMins(tailor.avgMinutes)}
                </p>
              )}
            </div>

            {tailor.currentJobs.length > 0 && (
              <div className="px-5 py-3 border-b border-gray-100 bg-yellow-50/50">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Currently working on</p>
                <div className="space-y-1.5">
                  {tailor.currentJobs.map((job, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{job.alteration_type}</p>
                        <p className="text-xs text-gray-400">{job.customer}</p>
                      </div>
                      <span className="text-xs text-gray-400">{timeAgo(job.claimedAt)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {Object.keys(tailor.byType).length > 0 && (
              <div className="px-5 py-3">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">By alteration type</p>
                <div className="space-y-1.5">
                  {Object.entries(tailor.byType)
                    .sort((a, b) => b[1].count - a[1].count)
                    .map(([type, stats]) => (
                      <div key={type} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-gray-700">{type}</p>
                          <span className="text-xs text-gray-400">×{stats.count}</span>
                        </div>
                        <span className="text-xs text-gray-500 font-medium">{formatMins(stats.avgMinutes)}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Average time by alteration type</h2>
          <p className="text-xs text-gray-400 mt-0.5">Across all tailors</p>
        </div>
        {typeStats.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-sm text-gray-400">No completed jobs in this period</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {typeStats.map(([type, stats]) => (
              <div key={type} className="px-5 py-3.5 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{type}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {stats.tailors.join(', ')} · {stats.count} completed
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold text-gray-900">{formatMins(stats.avgMinutes)}</p>
                  <p className="text-xs text-gray-400">avg time</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}