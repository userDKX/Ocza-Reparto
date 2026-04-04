import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from 'react-leaflet'
import L from 'leaflet'
import { EL_PEDREGAL_CENTER, DEFAULT_ZOOM, TILE_URL, TILE_ATTRIBUTION } from '../../utils/constants'
import { userLocationIcon, createClientIcon } from './mapIcons'
import type { Client } from '../../types'

function CenterOnUser() {
  const map = useMap()
  const [centered, setCentered] = useState(false)

  useEffect(() => {
    if (centered || !navigator.geolocation) return

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        map.setView([pos.coords.latitude, pos.coords.longitude], 16)
        setCentered(true)
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }, [map, centered])

  return null
}

function UserLocation() {
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

  if (!position) return null

  return (
    <Marker position={position} icon={userLocationIcon}>
      <Popup>Tu ubicacion actual</Popup>
    </Marker>
  )
}

interface Props {
  clients: Client[]
  onClientClick?: (client: Client) => void
  height?: string
}

export function MapView({ clients, onClientClick, height = 'h-[calc(100vh-8rem)]' }: Props) {
  return (
    <MapContainer
      center={[EL_PEDREGAL_CENTER.lat, EL_PEDREGAL_CENTER.lng]}
      zoom={DEFAULT_ZOOM}
      className={`w-full ${height} z-0`}
      zoomControl={false}
    >
      <TileLayer attribution={TILE_ATTRIBUTION} url={TILE_URL} />
      <ZoomControl position="bottomright" />
      <CenterOnUser />
      <UserLocation />
      {clients.map((client) => (
        <Marker
          key={client.id}
          position={[client.lat, client.lng]}
          icon={createClientIcon(client.photo_url, client.name)}
        >
          <Popup>
            <div className="text-sm min-w-[160px]">
              {client.photo_url && (
                <img
                  src={client.photo_url}
                  alt={client.name}
                  className="w-full h-24 object-cover rounded mb-2"
                />
              )}
              <p className="font-bold">{client.name}</p>
              {client.owner_name && <p className="text-slate-600">{client.owner_name}</p>}
              {client.address && <p className="text-slate-500 text-xs">{client.address}</p>}
              {onClientClick && (
                <button
                  onClick={() => onClientClick(client)}
                  className="mt-2 w-full text-center bg-orange-500 text-white text-xs py-1.5 rounded-lg font-medium"
                >
                  Ver detalle
                </button>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
