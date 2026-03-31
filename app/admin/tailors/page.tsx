'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Tailor, Location } from '@/types'

export default function TailorsPage() {
  const [tailors, setTailors] = useState<Tailor[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [name, setName] = useState('')
  const [pin, setPin] = useState('')
  const [locationId, setLocationId] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    const [tRes, lRes] = await Promise.all([
      fetch('/api/tailors'),
      fetch('/api/locations'),
    ])
    const [t, l] = await Promise.all([tRes.json(), lRes.json()])
    setTailors(t || [])
    setLocations(l || [])
    if (l?.length && !locationId) setLocationId(l[0].id)
    setLoading(false)
  }, [locationId])

  useEffect(() => { load() }, [load])

  async function addTailor() {
    if (!name || !pin || !locationId) return
    setSaving(true)
    await fetch('/api/tailors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, pin, location_id: locationId }),
    })
    setSaving(false)
    setShowAdd(false)
    setName('')
    setPin('')
    load()
  }

  async function toggleActive(tailor: Tailor) {
    await fetch('/api/tailors/' + tailor.id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !tailor.active }),
    })
    load()
  }

  async function deleteTailor(id: string) {
    await fetch('/api/tailors/' + id, { method: 'DELETE' })
    load()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-400 text-sm">Loading...</p>
      </div>
    )
  }

  return (
    <div className="px-4 md:px-8 py-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Tailors</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage tailor accounts and PINs</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="bg-blue-600 text-white text-sm px-4 py-2 rounded-xl hover:bg-blue-700 transition font-medium"
        >
          + Add tailor
        </button>
      </div>

      <div className="space-y-2">
        {tailors.map(tailor => {
          const location = locations.find(l => l.id === tailor.location_id)
          return (
            <div key={tailor.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-900">{tailor.name}</p>
                  {!tailor.active && (
                    <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">Inactive</span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  PIN: {tailor.pin} · {location?.name ?? 'Unknown location'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleActive(tailor)}
                  className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-xl hover:bg-gray-200 transition"
                >
                  {tailor.active ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => deleteTailor(tailor.id)}
                  className="text-xs bg-red-50 text-red-500 px-3 py-1.5 rounded-xl hover:bg-red-100 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Add tailor</h2>
            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Moshe" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">4-digit PIN</label>
                <input value={pin} onChange={e => setPin(e.target.value.slice(0, 4))} placeholder="e.g. 1234" maxLength={4} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Location</label>
                <select value={locationId} onChange={e => setLocationId(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {locations.map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-gray-600">Cancel</button>
              <button onClick={addTailor} disabled={saving || !name || pin.length < 4} className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-40">
                {saving ? 'Adding...' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}