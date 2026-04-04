import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useClients } from '../hooks/useClients'
import { ClientForm } from '../components/clients/ClientForm'
import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import { TILE_URL, TILE_ATTRIBUTION } from '../utils/constants'
import { locationPinIcon } from '../components/map/mapIcons'
import type { Client } from '../types'

export function ClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { updateClient, deleteClient } = useClients()
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    if (!id) return
    supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        setClient(data)
        setLoading(false)
      })
  }, [id])

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!client) {
    return (
      <div className="p-4 text-center py-12">
        <p className="text-slate-400">Cliente no encontrado</p>
        <button onClick={() => navigate('/clients')} className="text-primary mt-2 text-sm font-semibold">
          Volver
        </button>
      </div>
    )
  }

  if (editing) {
    return (
      <ClientForm
        initial={client}
        onSubmit={async (data, photo) => {
          const updated = await updateClient(client.id, data, photo)
          setClient(updated)
          setEditing(false)
        }}
        onCancel={() => setEditing(false)}
      />
    )
  }

  async function handleDelete() {
    if (!confirm('Eliminar este cliente?')) return
    await deleteClient(client!.id)
    navigate('/clients', { replace: true })
  }

  return (
    <div className="p-4 space-y-4">
      <button onClick={() => navigate('/clients')} className="flex items-center gap-1 text-sm text-slate-400">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
          <path fillRule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
        </svg>
        Volver
      </button>

      {client.photo_url && (
        <img
          src={client.photo_url}
          alt={client.name}
          className="w-full h-48 object-cover rounded-2xl"
        />
      )}

      <div>
        <h1 className="text-xl font-bold text-navy">{client.name}</h1>
        {client.owner_name && (
          <p className="text-slate-500">{client.owner_name}</p>
        )}
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3 text-sm border border-slate-100">
        {client.phone && (
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Telefono</span>
            <a href={`tel:${client.phone}`} className="text-primary font-semibold">
              {client.phone}
            </a>
          </div>
        )}
        {client.address && (
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Direccion</span>
            <span className="text-navy text-right max-w-[60%] truncate">{client.address}</span>
          </div>
        )}
        {client.zone && (
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Zona</span>
            <span className="bg-navy/5 text-navy-mid px-2.5 py-0.5 rounded-full text-xs font-medium">
              {client.zone}
            </span>
          </div>
        )}
        {client.notes && (
          <div className="pt-3 border-t border-slate-100">
            <p className="text-slate-400 mb-1 text-xs uppercase tracking-wide">Notas</p>
            <p className="text-navy">{client.notes}</p>
          </div>
        )}
      </div>

      <MapContainer
        center={[client.lat, client.lng]}
        zoom={17}
        className="w-full h-40 rounded-2xl z-0"
        scrollWheelZoom={false}
        dragging={false}
        zoomControl={false}
      >
        <TileLayer attribution={TILE_ATTRIBUTION} url={TILE_URL} />
        <Marker position={[client.lat, client.lng]} icon={locationPinIcon} />
      </MapContainer>

      <div className="flex gap-3">
        <button
          onClick={() => setEditing(true)}
          className="flex-1 py-2.5 bg-navy text-white rounded-xl font-semibold text-sm active:scale-[0.98] transition-transform"
        >
          Editar
        </button>
        <button
          onClick={handleDelete}
          className="py-2.5 px-5 bg-red-50 text-red-500 rounded-xl font-semibold text-sm active:scale-[0.98] transition-transform"
        >
          Eliminar
        </button>
      </div>
    </div>
  )
}
