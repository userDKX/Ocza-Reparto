import { useState } from 'react'
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { EL_PEDREGAL_CENTER, DEFAULT_ZOOM } from '../../utils/constants'

// Fix default marker icon issue with bundlers
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

interface Props {
  value: { lat: number; lng: number } | null
  onChange: (coords: { lat: number; lng: number }) => void
  onAddressResolved?: (address: string) => void
}

async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
      { headers: { 'Accept-Language': 'es' } }
    )
    const data = await res.json()
    if (!data.address) return null
    const a = data.address
    const parts = [a.road, a.house_number, a.suburb, a.city || a.town || a.village].filter(Boolean)
    return parts.join(', ') || data.display_name || null
  } catch {
    return null
  }
}

function ClickHandler({ onChange }: { onChange: Props['onChange'] }) {
  useMapEvents({
    click(e) {
      onChange({ lat: e.latlng.lat, lng: e.latlng.lng })
    },
  })
  return null
}

function FlyTo({ coords }: { coords: { lat: number; lng: number } | null }) {
  const map = useMap()
  if (coords) {
    map.flyTo([coords.lat, coords.lng], 17)
  }
  return null
}

export function LocationPicker({ value, onChange, onAddressResolved }: Props) {
  const center = value ?? EL_PEDREGAL_CENTER
  const [locating, setLocating] = useState(false)
  const [gpsError, setGpsError] = useState('')

  function useMyLocation() {
    if (!navigator.geolocation) {
      setGpsError('Tu navegador no soporta geolocalización')
      return
    }

    setLocating(true)
    setGpsError('')
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        onChange({ lat, lng })
        if (onAddressResolved) {
          const address = await reverseGeocode(lat, lng)
          if (address) onAddressResolved(address)
        }
        setLocating(false)
      },
      (err) => {
        setGpsError(
          err.code === 1
            ? 'Permiso de ubicación denegado'
            : 'No se pudo obtener la ubicación'
        )
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-semibold text-navy-mid uppercase tracking-wide">Ubicacion</p>
        <button
          type="button"
          onClick={useMyLocation}
          disabled={locating}
          className="flex items-center gap-1 text-xs font-semibold text-primary bg-primary/10 px-3 py-1.5 rounded-full disabled:opacity-50 active:scale-95 transition-transform"
        >
          {locating ? (
            <>
              <span className="animate-spin inline-block w-3 h-3 border-2 border-primary border-t-transparent rounded-full" />
              Ubicando...
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                <path fillRule="evenodd" d="M8.157 2.176a1.5 1.5 0 0 1 1.686 0l.004.002.012.008.044.03a12 12 0 0 1 .741.558c.474.382 1.1.94 1.73 1.59C13.6 5.633 15 7.652 15 10a5 5 0 0 1-10 0c0-2.348 1.4-4.367 2.626-5.636a14 14 0 0 1 2.47-2.148l.045-.03.012-.007.004-.003ZM10 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" clipRule="evenodd" />
              </svg>
              Mi ubicación
            </>
          )}
        </button>
      </div>
      {gpsError && <p className="text-xs text-red-500 mb-1">{gpsError}</p>}
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={value ? 17 : DEFAULT_ZOOM}
        className="w-full h-48 rounded-xl z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onChange={onChange} />
        <FlyTo coords={value} />
        {value && <Marker position={[value.lat, value.lng]} icon={defaultIcon} />}
      </MapContainer>
      {value && (
        <p className="text-xs text-slate-400 mt-1">
          {value.lat.toFixed(6)}, {value.lng.toFixed(6)}
        </p>
      )}
    </div>
  )
}
