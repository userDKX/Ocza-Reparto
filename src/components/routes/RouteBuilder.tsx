import { useState, useMemo, useEffect, useRef } from 'react'
import { useClients } from '../../hooks/useClients'
import { useRoutes, type OptimizePhase } from '../../hooks/useRoutes'
import { useGeolocation } from '../../hooks/useGeolocation'
import { haversine } from '../../lib/tsp'
import { getRouteGeometry } from '../../lib/routing'
import { RoutePreview } from './RoutePreview'
import { RouteSummary } from './RouteSummary'
import type { StopStatus } from './RoutePreview'
import type { Client } from '../../types'

const PROXIMITY_METERS = 100
const STORAGE_KEY = 'rutas_active_route'

interface SavedRoute {
  orderedClients: Client[]
  coordinates: [number, number][]
  distanceKm: number
  durationMin: number
  visitStatus: Record<string, StopStatus>
}

function saveRouteToStorage(result: { orderedClients: Client[]; coordinates: [number, number][]; distanceKm: number; durationMin: number }, status: Map<string, StopStatus>) {
  const data: SavedRoute = {
    ...result,
    visitStatus: Object.fromEntries(status),
  }
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) } catch { /* full */ }
}

function loadRouteFromStorage(): SavedRoute | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function clearRouteStorage() {
  localStorage.removeItem(STORAGE_KEY)
}

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

/** GPS proximity popup */
function ProximityAlert({ client, onDelivered, onFailed, onDismiss }: {
  client: Client
  onDelivered: () => void
  onFailed: () => void
  onDismiss: () => void
}) {
  return (
    <div className="fixed inset-0 bg-black/50 z-[9998] flex items-end justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl p-5 space-y-3 shadow-2xl animate-slide-up">
        <div className="flex items-center gap-3">
          {client.photo_url ? (
            <img src={client.photo_url} alt={client.name} className="w-14 h-14 rounded-xl object-cover" />
          ) : (
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-bold text-xl">{client.name.charAt(0)}</span>
            </div>
          )}
          <div>
            <p className="text-xs text-primary font-semibold uppercase tracking-wide">Estas cerca de</p>
            <p className="text-lg font-bold text-navy">{client.name}</p>
            {client.address && <p className="text-xs text-slate-400">{client.address}</p>}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onDelivered}
            className="flex-1 bg-green-500 text-white py-3 rounded-xl font-semibold active:scale-[0.98] transition-transform shadow-md shadow-green-500/25"
          >
            Entregado
          </button>
          <button
            onClick={onFailed}
            className="flex-1 bg-red-500 text-white py-3 rounded-xl font-semibold active:scale-[0.98] transition-transform shadow-md shadow-red-500/25"
          >
            No entregado
          </button>
          <button
            onClick={onDismiss}
            className="px-4 py-3 bg-slate-100 text-slate-500 rounded-xl font-medium active:scale-[0.98] transition-transform"
          >
            Luego
          </button>
        </div>
      </div>
    </div>
  )
}

/** Generate and download CSV report */
function downloadReport(orderedClients: Client[], visitStatus: Map<string, StopStatus>) {
  const now = new Date()
  const date = now.toLocaleDateString('es-PE')
  const time = now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })

  let delivered = 0
  let notDelivered = 0
  const lines = ['#,Cliente,Direccion,Zona,Telefono,Estado']

  orderedClients.forEach((c, i) => {
    const status = visitStatus.get(c.id) ?? 'pending'
    const label = status === 'delivered' ? 'Entregado' : status === 'not_delivered' ? 'No entregado' : 'Pendiente'
    if (status === 'delivered') delivered++
    if (status === 'not_delivered') notDelivered++
    lines.push(`${i + 1},"${c.name}","${c.address ?? ''}","${c.zone ?? ''}","${c.phone ?? ''}",${label}`)
  })

  const header = [
    `Reporte de Reparto - ${date} ${time}`,
    `Total: ${orderedClients.length} | Entregados: ${delivered} | No entregados: ${notDelivered}`,
    '',
  ]

  const csv = [...header, ...lines].join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `reparto-${now.toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

const PHASE_STEPS: { key: OptimizePhase; label: string }[] = [
  { key: 'matrix', label: 'Calculando distancias...' },
  { key: 'solving', label: 'Optimizando orden de paradas...' },
  { key: 'roads', label: 'Trazando ruta por calles...' },
  { key: 'done', label: 'Ruta lista!' },
]

function OptimizingOverlay({ phase }: { phase: OptimizePhase }) {
  const currentIdx = PHASE_STEPS.findIndex((s) => s.key === phase)

  return (
    <div className="fixed inset-0 bg-navy/95 z-[9999] flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8 text-center">
        {/* Animated truck */}
        <div className="relative mx-auto w-24 h-24">
          <div className="absolute inset-0 rounded-full border-4 border-white/10" />
          <div className="absolute inset-0 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin" />
          <div className="absolute inset-2 rounded-full border-4 border-b-primary/50 border-t-transparent border-r-transparent border-l-transparent animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-8 h-8">
              <path d="M3.375 4.5C2.339 4.5 1.5 5.34 1.5 6.375V13.5h1.218a3.016 3.016 0 0 1 5.564 0h4.436a3.016 3.016 0 0 1 5.564 0H19.5V9.574c0-.398-.158-.779-.44-1.06L16.94 6.393A1.5 1.5 0 0 0 15.878 6H14.25V4.5h-10.875ZM14.25 7.5h1.628l2.122 2.122v1.128H14.25V7.5ZM5.282 15a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm11.218-1.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
            </svg>
          </div>
        </div>

        <div>
          <h3 className="text-white font-bold text-lg">Optimizando ruta</h3>
          <p className="text-white/50 text-sm mt-1">Buscando el mejor recorrido</p>
        </div>

        {/* Steps */}
        <div className="space-y-3 text-left px-2">
          {PHASE_STEPS.map((s, i) => {
            const isDone = i < currentIdx
            const isCurrent = i === currentIdx
            return (
              <div key={s.key} className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold transition-all duration-300 ${
                  isDone ? 'bg-green-500 text-white scale-100'
                    : isCurrent ? 'bg-primary text-white scale-110'
                    : 'bg-white/10 text-white/30 scale-90'
                }`}>
                  {isDone ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </div>
                <span className={`text-sm transition-all duration-300 ${
                  isDone ? 'text-green-400'
                    : isCurrent ? 'text-white font-semibold'
                    : 'text-white/25'
                }`}>
                  {s.label}
                </span>
                {isCurrent && (
                  <div className="ml-auto animate-spin rounded-full h-3.5 w-3.5 border-2 border-white/30 border-t-white" />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function RouteBuilder() {
  const { clients, loading: clientsLoading } = useClients()
  const { optimizeRoute, phase } = useRoutes()
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
  const [step, setStep] = useState<'select' | 'preview' | 'executing'>('select')
  const [viewingPhoto, setViewingPhoto] = useState<{ src: string; alt: string } | null>(null)

  // Execution state
  const [visitStatus, setVisitStatus] = useState<Map<string, StopStatus>>(new Map())
  const [proximityClient, setProximityClient] = useState<Client | null>(null)
  const alertedIds = useRef<Set<string>>(new Set())

  const loading = clientsLoading

  // Restore active route from localStorage on mount
  useEffect(() => {
    const saved = loadRouteFromStorage()
    if (saved) {
      setOptimizedResult({
        orderedClients: saved.orderedClients,
        coordinates: saved.coordinates,
        distanceKm: saved.distanceKm,
        durationMin: saved.durationMin,
      })
      setVisitStatus(new Map(Object.entries(saved.visitStatus)))
      setStep('executing')
    }
  }, [])

  const filteredClients = useMemo(() => {
    if (!search.trim()) return clients
    const q = search.toLowerCase()
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.owner_name?.toLowerCase().includes(q) ||
        c.zone?.toLowerCase().includes(q)
    )
  }, [clients, search])

  // GPS proximity detection during execution
  useEffect(() => {
    if (step !== 'executing' || !gpsPosition || !optimizedResult) return

    for (const client of optimizedResult.orderedClients) {
      const s = visitStatus.get(client.id)
      if (s === 'delivered' || s === 'not_delivered') continue
      if (alertedIds.current.has(client.id)) continue

      const dist = haversine(gpsPosition.lat, gpsPosition.lng, client.lat, client.lng)
      if (dist <= PROXIMITY_METERS) {
        alertedIds.current.add(client.id)
        setProximityClient(client)
        break
      }
    }
  }, [step, gpsPosition, optimizedResult, visitStatus])

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

  function setStopStatus(clientId: string, status: StopStatus) {
    setVisitStatus((prev) => {
      const next = new Map(prev)
      next.set(clientId, status)
      // Persist to localStorage for offline recovery
      if (optimizedResult) saveRouteToStorage(optimizedResult, next)
      return next
    })
    setProximityClient(null)
  }

  function handleStartRoute() {
    if (!optimizedResult) return

    const initial = new Map<string, StopStatus>()
    for (const c of optimizedResult.orderedClients) {
      initial.set(c.id, 'pending')
    }
    setVisitStatus(initial)
    alertedIds.current.clear()
    setStep('executing')

    // Save to localStorage for offline recovery
    saveRouteToStorage(optimizedResult, initial)

    // Pre-fetch client photos so they're cached by service worker
    for (const c of optimizedResult.orderedClients) {
      if (c.photo_url) {
        const img = new Image()
        img.src = c.photo_url
      }
    }
  }

  function handleFinishRoute() {
    setStep('select')
    setOptimizedResult(null)
    setVisitStatus(new Map())
    setSelectedIds(new Set())
    alertedIds.current.clear()
    clearRouteStorage()
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  function moveStop(from: number, to: number) {
    if (!optimizedResult || to < 0 || to >= optimizedResult.orderedClients.length) return

    const newClients = [...optimizedResult.orderedClients]
    const [moved] = newClients.splice(from, 1)
    newClients.splice(to, 0, moved!)

    // Update with straight-line coordinates (works offline)
    const newResult = {
      orderedClients: newClients,
      coordinates: newClients.map((c) => [c.lng, c.lat] as [number, number]),
      distanceKm: optimizedResult.distanceKm,
      durationMin: optimizedResult.durationMin,
    }
    setOptimizedResult(newResult)

    // Persist reorder to localStorage if executing
    if (step === 'executing') {
      saveRouteToStorage(newResult, visitStatus)
    }

    // Try to get road geometry in background (non-blocking)
    getRouteGeometry(newClients.map((c) => ({ id: c.id, lat: c.lat, lng: c.lng })))
      .then((geo) => {
        setOptimizedResult((prev) => prev ? {
          ...prev,
          coordinates: geo.coordinates,
          distanceKm: geo.distanceKm,
          durationMin: geo.durationMin,
        } : prev)
      })
      .catch(() => { /* keep straight lines */ })
  }

  // ── Step: EXECUTING ──
  if (step === 'executing' && optimizedResult) {
    const statuses = Array.from(visitStatus.values())
    const deliveredCount = statuses.filter((s) => s === 'delivered').length
    const failedCount = statuses.filter((s) => s === 'not_delivered').length
    const markedCount = deliveredCount + failedCount
    const totalStops = optimizedResult.orderedClients.length
    const allMarked = markedCount === totalStops

    return (
      <div className="p-4 space-y-4">
        {viewingPhoto && (
          <PhotoViewer src={viewingPhoto.src} alt={viewingPhoto.alt} onClose={() => setViewingPhoto(null)} />
        )}
        {proximityClient && (
          <ProximityAlert
            client={proximityClient}
            onDelivered={() => setStopStatus(proximityClient.id, 'delivered')}
            onFailed={() => setStopStatus(proximityClient.id, 'not_delivered')}
            onDismiss={() => setProximityClient(null)}
          />
        )}

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-navy">Reparto en curso</h2>
          <span className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">
            {markedCount}/{totalStops}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden flex">
          <div
            className="h-full bg-green-500 transition-all duration-500"
            style={{ width: `${(deliveredCount / totalStops) * 100}%` }}
          />
          <div
            className="h-full bg-red-400 transition-all duration-500"
            style={{ width: `${(failedCount / totalStops) * 100}%` }}
          />
        </div>

        {/* Stats */}
        {markedCount > 0 && (
          <div className="flex gap-3 text-xs">
            {deliveredCount > 0 && (
              <span className="text-green-600 font-semibold">{deliveredCount} entregado{deliveredCount !== 1 ? 's' : ''}</span>
            )}
            {failedCount > 0 && (
              <span className="text-red-500 font-semibold">{failedCount} no entregado{failedCount !== 1 ? 's' : ''}</span>
            )}
            <span className="text-slate-400">{totalStops - markedCount} pendiente{totalStops - markedCount !== 1 ? 's' : ''}</span>
          </div>
        )}

        <RoutePreview
          clients={optimizedResult.orderedClients}
          coordinates={optimizedResult.coordinates}
          visitStatus={visitStatus}
        />

        <div className="space-y-2">
          <p className="text-xs font-semibold text-navy-mid uppercase tracking-wide">
            Paradas
          </p>
          {optimizedResult.orderedClients.map((client, idx) => {
            const status = visitStatus.get(client.id) ?? 'pending'
            const isDelivered = status === 'delivered'
            const isFailed = status === 'not_delivered'
            const isMarked = isDelivered || isFailed

            return (
              <div
                key={client.id}
                className={`rounded-xl p-3 shadow-sm border transition-all ${
                  isDelivered ? 'bg-green-50 border-green-200'
                    : isFailed ? 'bg-red-50 border-red-200'
                    : 'bg-white border-slate-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  {/* Number/status badge */}
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    isDelivered ? 'bg-green-500 text-white'
                      : isFailed ? 'bg-red-500 text-white'
                      : 'bg-slate-200 text-slate-500'
                  }`}>
                    {isDelivered ? (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                      </svg>
                    ) : isFailed ? (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                      </svg>
                    ) : (
                      idx + 1
                    )}
                  </span>
                  {/* Photo (tappable to enlarge) */}
                  {client.photo_url ? (
                    <button
                      type="button"
                      onClick={() => setViewingPhoto({ src: client.photo_url!, alt: client.name })}
                      className="flex-shrink-0"
                    >
                      <img src={client.photo_url} alt={client.name} className="w-10 h-10 rounded-xl object-cover" />
                    </button>
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-primary font-bold">{client.name.charAt(0)}</span>
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className={`font-semibold text-sm truncate ${
                      isDelivered ? 'text-green-700 line-through' : isFailed ? 'text-red-500 line-through' : 'text-navy'
                    }`}>
                      {client.name}
                    </p>
                    {client.address && (
                      <p className="text-xs text-slate-400 truncate">{client.address}</p>
                    )}
                  </div>
                  {/* Reorder + phone */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={() => moveStop(idx, idx - 1)}
                        disabled={idx === 0}
                        className="w-6 h-6 flex items-center justify-center rounded bg-slate-50 text-slate-400 disabled:opacity-20 active:bg-slate-100"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                          <path fillRule="evenodd" d="M10 17a.75.75 0 0 1-.75-.75V5.612L5.29 9.77a.75.75 0 0 1-1.08-1.04l5.25-5.5a.75.75 0 0 1 1.08 0l5.25 5.5a.75.75 0 1 1-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0 1 10 17Z" clipRule="evenodd" />
                        </svg>
                      </button>
                      <button
                        onClick={() => moveStop(idx, idx + 1)}
                        disabled={idx === totalStops - 1}
                        className="w-6 h-6 flex items-center justify-center rounded bg-slate-50 text-slate-400 disabled:opacity-20 active:bg-slate-100"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                          <path fillRule="evenodd" d="M10 3a.75.75 0 0 1 .75.75v10.638l3.96-4.158a.75.75 0 1 1 1.08 1.04l-5.25 5.5a.75.75 0 0 1-1.08 0l-5.25-5.5a.75.75 0 1 1 1.08-1.04l3.96 4.158V3.75A.75.75 0 0 1 10 3Z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                    {client.phone && (
                      <a
                        href={`tel:${client.phone}`}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-primary/10 text-primary active:scale-90 transition-transform"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                          <path fillRule="evenodd" d="M2 3.5A1.5 1.5 0 0 1 3.5 2h1.148a1.5 1.5 0 0 1 1.465 1.175l.716 3.223a1.5 1.5 0 0 1-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 0 0 6.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 0 1 1.767-1.052l3.223.716A1.5 1.5 0 0 1 18 15.352V16.5a1.5 1.5 0 0 1-1.5 1.5H15c-1.149 0-2.263-.15-3.326-.43A13.022 13.022 0 0 1 2.43 8.326 13.019 13.019 0 0 1 2 5V3.5Z" clipRule="evenodd" />
                        </svg>
                      </a>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="mt-2 flex gap-2 ml-10">
                  {!isMarked ? (
                    <>
                      <button
                        onClick={() => setStopStatus(client.id, 'delivered')}
                        className="flex-1 py-2 bg-green-500 text-white rounded-lg text-xs font-semibold active:scale-95 transition-transform"
                      >
                        Entregado
                      </button>
                      <button
                        onClick={() => setStopStatus(client.id, 'not_delivered')}
                        className="flex-1 py-2 bg-red-100 text-red-600 rounded-lg text-xs font-semibold active:scale-95 transition-transform"
                      >
                        No entregado
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setStopStatus(client.id, 'pending')}
                      className="py-1.5 px-3 bg-slate-100 text-slate-500 rounded-lg text-xs font-medium active:scale-95 transition-transform"
                    >
                      Cambiar
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Finalizar - only enabled when all marked */}
        <div className="space-y-2">
          {allMarked && (
            <button
              onClick={() => downloadReport(optimizedResult.orderedClients, visitStatus)}
              className="w-full py-3 bg-white border border-slate-200 rounded-xl font-semibold text-navy-mid active:scale-[0.98] transition-transform"
            >
              Descargar Reporte
            </button>
          )}
          <button
            onClick={handleFinishRoute}
            disabled={!allMarked}
            className={`w-full py-3 rounded-xl font-semibold transition-all active:scale-[0.98] shadow-lg ${
              allMarked
                ? 'bg-green-500 text-white shadow-green-500/20'
                : 'bg-slate-300 text-slate-500 shadow-none cursor-not-allowed'
            }`}
          >
            {allMarked
              ? 'Finalizar Reparto'
              : `Marca todas las paradas (${totalStops - markedCount} pendientes)`
            }
          </button>
        </div>
      </div>
    )
  }

  // ── Step: PREVIEW ──
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
                    disabled={idx === 0}
                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-50 text-slate-500 disabled:opacity-20 active:bg-slate-100"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M10 17a.75.75 0 0 1-.75-.75V5.612L5.29 9.77a.75.75 0 0 1-1.08-1.04l5.25-5.5a.75.75 0 0 1 1.08 0l5.25 5.5a.75.75 0 1 1-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0 1 10 17Z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button
                    onClick={() => moveStop(idx, idx + 1)}
                    disabled={idx === optimizedResult.orderedClients.length - 1}
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

        <button
          onClick={handleStartRoute}
          className="w-full bg-green-500 text-white py-3 rounded-xl font-semibold transition-all active:scale-[0.98] shadow-lg shadow-green-500/20"
        >
          Iniciar Reparto
        </button>
      </div>
    )
  }

  // ── Step: SELECT ──
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
          onClick={selectAll}
          className="flex-1 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-navy-mid font-medium"
        >
          Todos
        </button>
        <button
          onClick={selectNone}
          className="flex-1 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-navy-mid font-medium"
        >
          Ninguno
        </button>
      </div>

      {/* Search */}
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
        {filteredClients.map((client) => (
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

      {phase !== 'idle' && phase !== 'done' && <OptimizingOverlay phase={phase} />}

      <button
        onClick={handleOptimize}
        disabled={selectedIds.size < 2 || (phase !== 'idle' && phase !== 'done')}
        className="w-full bg-navy text-white py-3 rounded-xl font-semibold disabled:opacity-40 transition-all active:scale-[0.98] shadow-lg shadow-navy/20"
      >
        {`Optimizar ruta (${selectedIds.size} paradas)`}
      </button>
    </div>
  )
}
