import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { EL_PEDREGAL_CENTER, DEFAULT_ZOOM } from '../../utils/constants'
import type { Client } from '../../types'

interface Props {
  clients: Client[]
  coordinates: [number, number][]
}

const userLocationIcon = new L.DivIcon({
  html: `<div style="
    width: 18px; height: 18px;
    background: #f97316;
    border: 3px solid white;
    border-radius: 50%;
    box-shadow: 0 0 0 3px rgba(249,115,22,0.25), 0 2px 8px rgba(0,0,0,0.15);
  "></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
  className: '',
})

function createStopIcon(num: number, photoUrl: string | null) {
  if (photoUrl) {
    return new L.DivIcon({
      html: `<div style="position:relative; width:44px; height:44px;">
        <div style="
          width: 44px; height: 44px;
          border-radius: 50%;
          border: 3px solid #0f172a;
          overflow: hidden;
          background: white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        ">
          <img src="${photoUrl}" style="width:100%;height:100%;object-fit:cover;" />
        </div>
        <div style="
          position: absolute; top: -5px; right: -5px;
          width: 20px; height: 20px;
          background: #f97316; color: white;
          border-radius: 50%; border: 2px solid white;
          display: flex; align-items: center; justify-content: center;
          font-size: 10px; font-weight: bold;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        ">${num}</div>
      </div>`,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
      popupAnchor: [0, -24],
      className: '',
    })
  }

  return new L.DivIcon({
    html: `<div style="
      background: #0f172a;
      color: white;
      width: 32px; height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      font-weight: bold;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    ">${num}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
    className: '',
  })
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

function FitBounds({ clients }: { clients: Client[] }) {
  const map = useMap()

  useEffect(() => {
    if (clients.length === 0) return
    const bounds = L.latLngBounds(clients.map((c) => [c.lat, c.lng]))
    map.fitBounds(bounds, { padding: [30, 30] })
  }, [clients, map])

  return null
}

export function RoutePreview({ clients, coordinates }: Props) {
  const polylinePositions = coordinates.map(
    ([lng, lat]) => [lat, lng] as [number, number]
  )

  const center = clients.length > 0
    ? [clients[0]!.lat, clients[0]!.lng] as [number, number]
    : [EL_PEDREGAL_CENTER.lat, EL_PEDREGAL_CENTER.lng] as [number, number]

  return (
    <MapContainer
      center={center}
      zoom={DEFAULT_ZOOM}
      className="w-full h-72 rounded-2xl z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <UserLocation />
      <FitBounds clients={clients} />
      {polylinePositions.length > 1 && (
        <Polyline positions={polylinePositions} color="#f97316" weight={4} opacity={0.9} />
      )}
      {clients.map((client, idx) => (
        <Marker
          key={client.id}
          position={[client.lat, client.lng]}
          icon={createStopIcon(idx + 1, client.photo_url)}
        >
          <Popup>
            <div className="text-sm min-w-[140px]">
              {client.photo_url && (
                <img
                  src={client.photo_url}
                  alt={client.name}
                  className="w-full h-24 object-cover rounded mb-2"
                />
              )}
              <p className="font-bold">#{idx + 1} {client.name}</p>
              {client.owner_name && <p className="text-slate-600">{client.owner_name}</p>}
              {client.address && <p className="text-slate-500 text-xs">{client.address}</p>}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
