import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { EL_PEDREGAL_CENTER, DEFAULT_ZOOM } from '../../utils/constants'
import type { Client } from '../../types'

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIconUrl from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

const defaultIcon = new L.Icon({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIconUrl,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

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

function createClientIcon(photoUrl: string | null, name: string) {
  if (photoUrl) {
    return new L.DivIcon({
      html: `<div style="
        width: 42px; height: 42px;
        border-radius: 50%;
        border: 3px solid #0f172a;
        overflow: hidden;
        background: white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      ">
        <img src="${photoUrl}" style="width:100%;height:100%;object-fit:cover;" />
      </div>`,
      iconSize: [42, 42],
      iconAnchor: [21, 21],
      popupAnchor: [0, -23],
      className: '',
    })
  }

  const initial = name.charAt(0).toUpperCase()
  return new L.DivIcon({
    html: `<div style="
      width: 42px; height: 42px;
      border-radius: 50%;
      border: 3px solid #0f172a;
      background: #fff7ed;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 16px;
      color: #f97316;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    ">${initial}</div>`,
    iconSize: [42, 42],
    iconAnchor: [21, 21],
    popupAnchor: [0, -23],
    className: '',
  })
}

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
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
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
