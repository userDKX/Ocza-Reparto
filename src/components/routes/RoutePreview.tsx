import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap, ZoomControl } from 'react-leaflet'
import L from 'leaflet'
import { EL_PEDREGAL_CENTER, DEFAULT_ZOOM, TILE_URL, TILE_ATTRIBUTION } from '../../utils/constants'
import { userLocationIcon, createStopIcon, createDeliveredStopIcon, createFailedStopIcon, startMarkerIcon, endMarkerIcon } from '../map/mapIcons'
import type { Client } from '../../types'

export type StopStatus = 'pending' | 'delivered' | 'not_delivered'

interface Props {
  clients: Client[]
  coordinates: [number, number][]
  visitStatus?: Map<string, StopStatus>
}

function useGpsPosition() {
  const map = useMap()
  const [position, setPosition] = useState<L.LatLng | null>(null)

  useEffect(() => {
    if (!navigator.geolocation) return

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition(new L.LatLng(pos.coords.latitude, pos.coords.longitude))
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000 }
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }, [map])

  return position
}

function UserLocationMarker({ position }: { position: L.LatLng | null }) {
  if (!position) return null
  return (
    <Marker position={position} icon={userLocationIcon}>
      <Popup>Tu ubicacion actual</Popup>
    </Marker>
  )
}

function FitBounds({ clients, gpsPosition }: { clients: Client[]; gpsPosition?: L.LatLng | null }) {
  const map = useMap()

  useEffect(() => {
    if (clients.length === 0) return
    const points: L.LatLngExpression[] = clients.map((c) => [c.lat, c.lng])
    if (gpsPosition) points.push(gpsPosition)
    const bounds = L.latLngBounds(points)
    map.fitBounds(bounds, { padding: [30, 30] })
  }, [clients, gpsPosition, map])

  return null
}

/** During execution: build polyline from GPS → pending stops */
function ExecutionPolyline({ clients, visitStatus, gpsPosition }: {
  clients: Client[]
  visitStatus: Map<string, StopStatus>
  gpsPosition: L.LatLng | null
}) {
  // Get only pending stops (not yet delivered/failed)
  const pendingStops = clients.filter((c) => {
    const s = visitStatus.get(c.id)
    return s === 'pending' || !s
  })

  if (pendingStops.length === 0) return null

  // Build path: GPS position → pending stops in order
  const positions: [number, number][] = []

  if (gpsPosition) {
    positions.push([gpsPosition.lat, gpsPosition.lng])
  }

  for (const c of pendingStops) {
    positions.push([c.lat, c.lng])
  }

  if (positions.length < 2) return null

  return (
    <>
      <Polyline
        positions={positions}
        pathOptions={{ color: '#f97316', weight: 12, opacity: 0.2, lineCap: 'round' }}
      />
      <Polyline
        positions={positions}
        pathOptions={{ color: '#f97316', weight: 5, opacity: 1, lineCap: 'round', lineJoin: 'round' }}
      />
      <Polyline
        positions={positions}
        pathOptions={{ color: 'white', weight: 2, opacity: 0.5, dashArray: '10 16', lineCap: 'round' }}
      />
    </>
  )
}

/** During preview: static polyline from coordinates */
function PreviewPolyline({ coordinates }: { coordinates: [number, number][] }) {
  const positions = coordinates.map(([lng, lat]) => [lat, lng] as [number, number])

  if (positions.length < 2) return null

  return (
    <>
      <Polyline
        positions={positions}
        pathOptions={{ color: '#f97316', weight: 12, opacity: 0.2, lineCap: 'round' }}
      />
      <Polyline
        positions={positions}
        pathOptions={{ color: '#f97316', weight: 5, opacity: 1, lineCap: 'round', lineJoin: 'round' }}
      />
      <Polyline
        positions={positions}
        pathOptions={{ color: 'white', weight: 2, opacity: 0.5, dashArray: '10 16', lineCap: 'round' }}
      />
      <Marker position={positions[0]!} icon={startMarkerIcon}>
        <Popup>Inicio de ruta</Popup>
      </Marker>
      <Marker position={positions[positions.length - 1]!} icon={endMarkerIcon}>
        <Popup>Fin de ruta</Popup>
      </Marker>
    </>
  )
}

function MapContent({ clients, coordinates, visitStatus }: Props) {
  const gpsPosition = useGpsPosition()
  const isExecuting = !!visitStatus
  const totalStops = clients.length

  return (
    <>
      <TileLayer attribution={TILE_ATTRIBUTION} url={TILE_URL} />
      <ZoomControl position="bottomright" />
      <UserLocationMarker position={gpsPosition} />
      <FitBounds clients={clients} gpsPosition={isExecuting ? gpsPosition : null} />

      {/* Polyline: different behavior for preview vs execution */}
      {isExecuting ? (
        <ExecutionPolyline clients={clients} visitStatus={visitStatus} gpsPosition={gpsPosition} />
      ) : (
        <PreviewPolyline coordinates={coordinates} />
      )}

      {/* Stop markers */}
      {clients.map((client, idx) => {
        const status = visitStatus?.get(client.id)
        const icon = status === 'delivered'
          ? createDeliveredStopIcon(idx + 1)
          : status === 'not_delivered'
            ? createFailedStopIcon(idx + 1)
            : createStopIcon(idx + 1, totalStops)

        return (
          <Marker
            key={client.id}
            position={[client.lat, client.lng]}
            icon={icon}
          >
            <Popup>
              <div className="text-sm min-w-[140px]">
                <p className="font-bold">#{idx + 1} {client.name}</p>
                {client.owner_name && <p className="text-slate-600">{client.owner_name}</p>}
                {client.address && <p className="text-slate-500 text-xs">{client.address}</p>}
                {status === 'delivered' && (
                  <p className="text-green-600 text-xs font-semibold mt-1">Entregado</p>
                )}
                {status === 'not_delivered' && (
                  <p className="text-red-500 text-xs font-semibold mt-1">No entregado</p>
                )}
              </div>
            </Popup>
          </Marker>
        )
      })}
    </>
  )
}

export function RoutePreview({ clients, coordinates, visitStatus }: Props) {
  const center = clients.length > 0
    ? [clients[0]!.lat, clients[0]!.lng] as [number, number]
    : [EL_PEDREGAL_CENTER.lat, EL_PEDREGAL_CENTER.lng] as [number, number]

  return (
    <MapContainer
      center={center}
      zoom={DEFAULT_ZOOM}
      className="w-full h-72 rounded-2xl z-0"
      zoomControl={false}
    >
      <MapContent clients={clients} coordinates={coordinates} visitStatus={visitStatus} />
    </MapContainer>
  )
}
