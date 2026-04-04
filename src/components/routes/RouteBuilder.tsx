import { useState, useMemo } from 'react'
import { useClients } from '../../hooks/useClients'
import { useLastVisits } from '../../hooks/useVisits'
import { useRoutes } from '../../hooks/useRoutes'
import { useGeolocation } from '../../hooks/useGeolocation'
import { selectClientsForToday, calcUrgency } from '../../lib/clustering'
import { getRouteGeometry } from '../../lib/osrm'
import { RoutePreview } from './RoutePreview'
import { RouteSummary } from './RouteSummary'
import type { Client } from '../../types'

function PhotoViewer({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 bg-black/90 z-[9999] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6">
          <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
        </svg>
      </button>
      <img
        src={src}
        alt={alt}
        className="max-w-full max-h-[85vh] object-contain rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  )
}

export function RouteBuilder() {
  const { clients, loading: clientsLoading } = useClients()
  const { lastVisits, loading: visitsLoading } = useLastVisits()
  const { optimizeRoute, optimizing } = useRoutes()
  const { position: gpsPosition, error: gpsError } = useGeolocation()

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [useGps, setUseGps] = useState(true)
  const [search, setSearch] = useState('')
  const [optimizedResult, setOptimizedResult] = useState<{
    orderedClients: Client[]
    coordinates: [number, number][]
    distanceKm: number
    durationMin: number
  } | null>(null)
  const [step, setStep] = useState<'select' | 'preview'>('select')
  const [recalculating, setRecalculating] = useState(false)
  const [viewingPhoto, setViewingPhoto] = useState<{ src: string; alt: string } | null>(null)

  const loading = clientsLoading || visitsLoading

  const clientsWithUrgency = useMemo(() => {
    return clients.map((c) => calcUrgency(c, lastVisits[c.id] ?? null))
  }, [clients, lastVisits])

  const filteredClients = useMemo(() => {
    if (!search.trim()) return clientsWithUrgency
    const q = search.toLowerCase()
    return clientsWithUrgency.filter(
      ({ client }) =>
        client.name.toLowerCase().includes(q) ||
        client.owner_name?.toLowerCase().includes(q) ||
        client.zone?.toLowerCase().includes(q)
    )
  }, [clientsWithUrgency, search])

  function handleAutoSelect() {
    const suggested = selectClientsForToday(clientsWithUrgency)
    setSelectedIds(new Set(suggested.map((s) => s.client.id)))
  }

  function toggleClient(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function selectAll() {
    setSelectedIds(new Set(clients.map((c) => c.id)))
  }

  function selectNone() {
    setSelectedIds(new Set())
  }

  async function handleOptimize() {
    const selected = clients.filter((c) => selectedIds.has(c.id))
    if (selected.length < 2) return

    const startingPoint = useGps && gpsPosition ? gpsPosition : null
    const result = await optimizeRoute(selected, startingPoint)
    setOptimizedResult(result)
    setStep('preview')
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  async function moveStop(from: number, to: number) {
    if (!optimizedResult || to < 0 || to >= optimizedResult.orderedClients.length) return

    const newClients = [...optimizedResult.orderedClients]
    const [moved] = newClients.splice(from, 1)
    newClients.splice(to, 0, moved!)

    setRecalculating(true)
    try {
      const points = newClients.map((c) => ({ id: c.id, lat: c.lat, lng: c.lng }))
      const geo = await getRouteGeometry(points)
      setOptimizedResult({
        orderedClients: newClients,
        coordinates: geo.coordinates,
        distanceKm: geo.distanceKm,
        durationMin: geo.durationMin,
      })
    } catch {
      setOptimizedResult((prev) => prev ? { ...prev, orderedClients: newClients } : prev)
    } finally {
      setRecalculating(false)
    }
  }

  if (step === 'preview' && optimizedResult) {
    return (
      <div className="p-4 space-y-4">
        {viewingPhoto && (
          <PhotoViewer
            src={viewingPhoto.src}
            alt={viewingPhoto.alt}
            onClose={() => setViewingPhoto(null)}
          />
        )}

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-navy">Ruta Optimizada</h2>
          <button
            onClick={() => { setStep('select'); setOptimizedResult(null) }}
            className="flex items-center gap-1 text-sm text-slate-400"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
            </svg>
            Editar
          </button>
        </div>

        <RouteSummary
          distanceKm={optimizedResult.distanceKm}
          durationMin={optimizedResult.durationMin}
          stopCount={optimizedResult.orderedClients.length}
        />

        <RoutePreview
          clients={optimizedResult.orderedClients}
          coordinates={optimizedResult.coordinates}
        />

        {recalculating && (
          <div className="flex items-center justify-center gap-2 text-xs text-primary">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary" />
            Recalculando ruta...
          </div>
        )}

        <div className="space-y-2">
          <p className="text-xs font-semibold text-navy-mid uppercase tracking-wide">
            Orden de visita
          </p>
          {optimizedResult.orderedClients.map((client, idx) => (
            <div key={client.id} className="bg-white rounded-xl p-3 shadow-sm border border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {idx + 1}
                </span>
                {client.photo_url ? (
                  <button
                    type="button"
                    onClick={() => setViewingPhoto({ src: client.photo_url!, alt: client.name })}
                    className="relative flex-shrink-0"
                  >
                    <img src={client.photo_url} alt={client.name} className="w-11 h-11 rounded-xl object-cover" />
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/10 rounded-xl flex items-center justify-center transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white" className="w-4 h-4 opacity-0 hover:opacity-100 drop-shadow">
                        <path d="M13.28 7.78l3.22-3.22v2.69a.75.75 0 0 0 1.5 0v-4.5a.75.75 0 0 0-.75-.75h-4.5a.75.75 0 0 0 0 1.5h2.69l-3.22 3.22a.75.75 0 0 0 1.06 1.06ZM2 17.25v-4.5a.75.75 0 0 1 1.5 0v2.69l3.22-3.22a.75.75 0 0 1 1.06 1.06L4.56 16.5h2.69a.75.75 0 0 1 0 1.5h-4.5a.75.75 0 0 1-.75-.75Z" />
                      </svg>
                    </div>
                  </button>
                ) : (
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-bold">{client.name.charAt(0)}</span>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm text-navy truncate">{client.name}</p>
                  {client.address && (
                    <p className="text-xs text-slate-400 truncate">{client.address}</p>
                  )}
                </div>
                <div className="flex flex-col gap-1 flex-shrink-0">
                  <button
                    onClick={() => moveStop(idx, idx - 1)}
                    disabled={idx === 0 || recalculating}
                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-50 text-slate-500 disabled:opacity-20 active:bg-slate-100"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M10 17a.75.75 0 0 1-.75-.75V5.612L5.29 9.77a.75.75 0 0 1-1.08-1.04l5.25-5.5a.75.75 0 0 1 1.08 0l5.25 5.5a.75.75 0 1 1-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0 1 10 17Z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button
                    onClick={() => moveStop(idx, idx + 1)}
                    disabled={idx === optimizedResult.orderedClients.length - 1 || recalculating}
                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-50 text-slate-500 disabled:opacity-20 active:bg-slate-100"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M10 3a.75.75 0 0 1 .75.75v10.638l3.96-4.158a.75.75 0 1 1 1.08 1.04l-5.25 5.5a.75.75 0 0 1-1.08 0l-5.25-5.5a.75.75 0 1 1 1.08-1.04l3.96 4.158V3.75A.75.75 0 0 1 10 3Z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
              {client.phone && (
                <div className="mt-2 ml-9">
                  <a
                    href={`tel:${client.phone}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 px-3 py-1.5 rounded-full active:scale-95 transition-transform"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                      <path fillRule="evenodd" d="M2 3.5A1.5 1.5 0 0 1 3.5 2h1.148a1.5 1.5 0 0 1 1.465 1.175l.716 3.223a1.5 1.5 0 0 1-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 0 0 6.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 0 1 1.767-1.052l3.223.716A1.5 1.5 0 0 1 18 15.352V16.5a1.5 1.5 0 0 1-1.5 1.5H15c-1.149 0-2.263-.15-3.326-.43A13.022 13.022 0 0 1 2.43 8.326 13.019 13.019 0 0 1 2 5V3.5Z" clipRule="evenodd" />
                    </svg>
                    {client.phone}
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Step: select clients
  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-bold text-navy">Construir Ruta</h2>

      {/* GPS toggle */}
      <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm">
        <label className="flex items-center justify-between cursor-pointer">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-5 h-5 ${gpsPosition ? 'text-green-500' : 'text-slate-300'}`}>
              <path fillRule="evenodd" d="m9.69 18.933.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 0 0 .281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 1 0 3 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 0 0 2.274 1.765 11.842 11.842 0 0 0 .976.544l.062.029.018.008.006.003ZM10 11.25a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-navy">Iniciar desde mi ubicacion</p>
              <p className="text-xs text-slate-400">
                {gpsPosition
                  ? 'GPS activo'
                  : gpsError
                    ? 'GPS no disponible'
                    : 'Obteniendo ubicacion...'}
              </p>
            </div>
          </div>
          <div
            className={`relative w-11 h-6 rounded-full transition-colors ${
              useGps && gpsPosition ? 'bg-primary' : 'bg-slate-200'
            }`}
            onClick={() => setUseGps((v) => !v)}
          >
            <div
              className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                useGps && gpsPosition ? 'translate-x-5.5' : 'translate-x-0.5'
              }`}
            />
          </div>
        </label>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleAutoSelect}
          className="flex-1 bg-primary text-white py-2.5 rounded-xl text-sm font-semibold shadow-md shadow-primary/25 active:scale-[0.98] transition-transform"
        >
          Sugerir clientes
        </button>
        <button
          onClick={selectAll}
          className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-navy-mid font-medium"
        >
          Todos
        </button>
        <button
          onClick={selectNone}
          className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-navy-mid font-medium"
        >
          Ninguno
        </button>
      </div>

      {/* Search within route builder */}
      <div className="relative">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
        </svg>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar cliente..."
          className="w-full pl-9 pr-9 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm shadow-sm"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        )}
      </div>

      <p className="text-xs text-slate-400">
        {selectedIds.size} de {clients.length} seleccionados
        {search && ` (mostrando ${filteredClients.length})`}
      </p>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredClients
          .sort((a, b) => b.urgency - a.urgency)
          .map(({ client }) => (
          <label
            key={client.id}
            className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
              selectedIds.has(client.id)
                ? 'bg-primary/5 border-primary/30 shadow-sm'
                : 'bg-white border-slate-100'
            }`}
          >
            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
              selectedIds.has(client.id) ? 'bg-primary border-primary' : 'border-slate-300'
            }`}>
              {selectedIds.has(client.id) && (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white" className="w-3.5 h-3.5">
                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <input
              type="checkbox"
              checked={selectedIds.has(client.id)}
              onChange={() => toggleClient(client.id)}
              className="hidden"
            />
            {client.photo_url ? (
              <img src={client.photo_url} alt={client.name} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-primary font-bold">{client.name.charAt(0)}</span>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm text-navy truncate">{client.name}</p>
              {client.zone && (
                <span className="text-xs text-slate-400">{client.zone}</span>
              )}
            </div>
          </label>
        ))}
      </div>

      <button
        onClick={handleOptimize}
        disabled={selectedIds.size < 2 || optimizing}
        className="w-full bg-navy text-white py-3 rounded-xl font-semibold disabled:opacity-40 transition-all active:scale-[0.98] shadow-lg shadow-navy/20"
      >
        {optimizing ? (
          <span className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            Optimizando...
          </span>
        ) : (
          `Optimizar ruta (${selectedIds.size} paradas)`
        )}
      </button>
    </div>
  )
}
