'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Location } from '@/types'

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    const res = await fetch('/api/locations')
    const data = await res.json()
    setLocations(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function addLocation() {
    if (!name || !password) return
    setSaving(true)
    await fetch('/api/locations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, password_hash: password }),
    })
    setSaving(false)
    setShowAdd(false)
    setName('')
    setPassword('')
    load()
  }

  async function deleteLocation(id: string) {
    await fetch('/api/locations/' + id, { method: 'DELETE' })
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
          <h1 className="text-xl font-bold text-gray-900">Locations</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage store locations and passwords</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="bg-blue-600 text-white text-sm px-4 py-2 rounded-xl hover:bg-blue-700 transition font-medium"
        >
          + Add location
        </button>
      </div>

      <div className="space-y-2">
        {locations.map(location => (
          <div key={location.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">{location.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">Password: {location.password_hash}</p>
            </div>
            <button
              onClick={() => deleteLocation(location.id)}
              className="text-xs bg-red-50 text-red-500 px-3 py-1.5 rounded-xl hover:bg-red-100 transition"
            >
              Delete
            </button>
          </div>
        ))}
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Add location</h2>
            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Location name</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Downtown" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Password</label>
                <input value={password} onChange={e => setPassword(e.target.value)} placeholder="e.g. downtown123" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-gray-600">Cancel</button>
              <button onClick={addLocation} disabled={saving || !name || !password} className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-40">
                {saving ? 'Adding...' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}