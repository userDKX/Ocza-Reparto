import { useState } from 'react'
import { LocationPicker } from '../map/LocationPicker'
import { PhotoCapture } from './PhotoCapture'
import type { Client } from '../../types'

type ClientInput = Omit<Client, 'id' | 'created_at' | 'updated_at' | 'photo_url' | 'active'>

interface Props {
  initial?: Client
  onSubmit: (data: ClientInput, photo?: File) => Promise<void>
  onCancel: () => void
}

export function ClientForm({ initial, onSubmit, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const [ownerName, setOwnerName] = useState(initial?.owner_name ?? '')
  const [phone, setPhone] = useState(initial?.phone ?? '')
  const [address, setAddress] = useState(initial?.address ?? '')
  const [zone, setZone] = useState(initial?.zone ?? '')
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    initial ? { lat: initial.lat, lng: initial.lng } : null
  )
  const [photo, setPhoto] = useState<File | undefined>()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!coords) {
      setError('Selecciona la ubicacion en el mapa')
      return
    }

    setSaving(true)
    setError('')
    try {
      await onSubmit(
        {
          name,
          owner_name: ownerName || null,
          phone: phone || null,
          address: address || null,
          zone: zone || null,
          notes: notes || null,
          lat: coords.lat,
          lng: coords.lng,
        },
        photo
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar. Intenta de nuevo.')
      setSaving(false)
    }
  }

  const inputClass = "w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm"

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-bold text-navy">
          {initial ? 'Editar cliente' : 'Nuevo cliente'}
        </h2>
        <button type="button" onClick={onCancel} className="text-sm text-slate-400">
          Cancelar
        </button>
      </div>

      <div>
        <label className="block text-xs font-semibold text-navy-mid mb-1 uppercase tracking-wide">
          Nombre de tienda *
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className={inputClass}
          placeholder="Ej: Bodega Maria"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-navy-mid mb-1 uppercase tracking-wide">
          Dueno
        </label>
        <input
          value={ownerName}
          onChange={(e) => setOwnerName(e.target.value)}
          className={inputClass}
          placeholder="Nombre del dueno"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-navy-mid mb-1 uppercase tracking-wide">
            Telefono
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={inputClass}
            placeholder="999999999"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-navy-mid mb-1 uppercase tracking-wide">
            Zona
          </label>
          <input
            value={zone}
            onChange={(e) => setZone(e.target.value)}
            className={inputClass}
            placeholder="Ej: Centro"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-navy-mid mb-1 uppercase tracking-wide">
          Direccion
        </label>
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className={inputClass}
          placeholder="Calle y numero"
        />
      </div>

      <LocationPicker
        value={coords}
        onChange={setCoords}
        onAddressResolved={(addr) => { if (!address) setAddress(addr) }}
      />

      <PhotoCapture currentUrl={initial?.photo_url} onCapture={setPhoto} />

      <div>
        <label className="block text-xs font-semibold text-navy-mid mb-1 uppercase tracking-wide">
          Notas
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className={`${inputClass} resize-none`}
          placeholder="Notas adicionales..."
        />
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm text-center py-2 rounded-xl">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={saving}
        className="w-full py-3 bg-primary text-white rounded-xl font-semibold disabled:opacity-50 shadow-md shadow-primary/25 active:scale-[0.98] transition-transform"
      >
        {saving ? 'Guardando...' : initial ? 'Actualizar' : 'Crear cliente'}
      </button>
    </form>
  )
}
