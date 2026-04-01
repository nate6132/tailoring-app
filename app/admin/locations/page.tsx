'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Location } from '@/types'

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editingIp, setEditingIp] = useState<string | null>(null)
  const [ipValue, setIpValue] = useState('')
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

  async function saveIp(id: string) {
    await fetch('/api/locations/' + id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ printer_ip: ipValue }),
    })
    setEditingIp(null)
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
          <p className="text-sm text-gray-400 mt-0.5">Manage store locations, passwords and printer IPs</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="bg-blue-600 text-white text-sm px-4 py-2 rounded-xl hover:bg-blue-700 transition font-medium"
        >
          + Add location
        </button>
      </div>

      <div className="space-y-3">
        {locations.map(location => (
          <div key={location.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <p className="text-sm font-semibold text-gray-900">{location.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">Password: {location.password_hash}</p>
              </div>
              <button
                onClick={() => deleteLocation(location.id)}
                className="text-xs bg-red-50 text-red-500 px-3 py-1.5 rounded-xl hover:bg-red-100 transition flex-shrink-0"
              >
                Delete
              </button>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Printer IP address</p>
              {editingIp === location.id ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={ipValue}
                    onChange={e => setIpValue(e.target.value)}
                    placeholder="e.g. 192.168.1.100"
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => saveIp(location.id)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingIp(null)}
                    className="bg-gray-100 text-gray-600 px-4 py-2 rounded-xl text-sm hover:bg-gray-200 transition"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${location.printer_ip ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <p className="text-sm text-gray-700 font-mono">
                      {location.printer_ip || 'No printer IP set'}
                    </p>
                  </div>
                  <button
                    onClick={() => { setEditingIp(location.id); setIpValue(location.printer_ip || '') }}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {location.printer_ip ? 'Change' : 'Set IP'}
                  </button>
                </div>
              )}
            </div>
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