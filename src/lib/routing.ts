import { OSRM_BASE } from '../utils/constants'
import type { Point } from './tsp'

export interface RouteResult {
  coordinates: [number, number][] // [lng, lat] pairs
  distanceKm: number
  durationMin: number
}

// ── Helpers ──

function fetchWithTimeout(url: string, timeoutMs = 5000): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timer))
}

// ── OSRM (free, no key) ──

async function osrmRoute(points: Point[]): Promise<RouteResult> {
  const coords = points.map((p) => `${p.lng},${p.lat}`).join(';')
  const url = `${OSRM_BASE}/route/v1/driving/${coords}?overview=full&geometries=geojson`
  const res = await fetchWithTimeout(url, 6000)
  const data = await res.json()

  if (data.code !== 'Ok' || !data.routes?.[0]) {
    throw new Error(`OSRM: ${data.code}`)
  }

  return {
    coordinates: data.routes[0].geometry.coordinates,
    distanceKm: data.routes[0].distance / 1000,
    durationMin: data.routes[0].duration / 60,
  }
}

// ── Google Directions (needs API key) ──

async function googleRoute(points: Point[]): Promise<RouteResult> {
  const key = import.meta.env.VITE_GOOGLE_MAPS_KEY as string | undefined
  if (!key) throw new Error('No Google API key')

  const origin = `${points[0]!.lat},${points[0]!.lng}`
  const destination = `${points[points.length - 1]!.lat},${points[points.length - 1]!.lng}`

  const waypoints = points.length > 2
    ? points.slice(1, -1).map((p) => `${p.lat},${p.lng}`).join('|')
    : ''

  const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}${waypoints ? `&waypoints=${waypoints}` : ''}&key=${key}`

  // Google Directions API doesn't support CORS from browser,
  // so we use the encoded polyline from the Routes API via a proxy-free approach:
  // Actually, we'll use the Google Maps JavaScript API approach with DirectionsService
  // But for simplicity, let's use the Roads-like approach with a simple polyline

  // Alternative: use Google's route polyline via fetch (works with API key)
  const res = await fetchWithTimeout(url, 8000)
  const data = await res.json()

  if (data.status !== 'OK' || !data.routes?.[0]) {
    throw new Error(`Google: ${data.status}`)
  }

  const route = data.routes[0]
  const leg = route.legs[0]

  // Decode Google's encoded polyline to coordinates
  const coords = decodeGooglePolyline(route.overview_polyline.points)

  return {
    coordinates: coords.map(([lat, lng]) => [lng, lat] as [number, number]),
    distanceKm: leg.distance.value / 1000,
    durationMin: leg.duration.value / 60,
  }
}

/** Decode Google's encoded polyline format */
function decodeGooglePolyline(encoded: string): [number, number][] {
  const points: [number, number][] = []
  let index = 0
  let lat = 0
  let lng = 0

  while (index < encoded.length) {
    let shift = 0
    let result = 0
    let byte: number

    do {
      byte = encoded.charCodeAt(index++) - 63
      result |= (byte & 0x1f) << shift
      shift += 5
    } while (byte >= 0x20)

    lat += result & 1 ? ~(result >> 1) : result >> 1

    shift = 0
    result = 0

    do {
      byte = encoded.charCodeAt(index++) - 63
      result |= (byte & 0x1f) << shift
      shift += 5
    } while (byte >= 0x20)

    lng += result & 1 ? ~(result >> 1) : result >> 1

    points.push([lat / 1e5, lng / 1e5])
  }

  return points
}

// ── Public API: try OSRM → Google → throw ──

export async function getRouteGeometry(points: Point[]): Promise<RouteResult> {
  if (points.length < 2) {
    return { coordinates: [], distanceKm: 0, durationMin: 0 }
  }

  // Try OSRM first (free)
  try {
    return await osrmRoute(points)
  } catch {
    // OSRM failed
  }

  // Try Google Directions (if API key configured)
  try {
    return await googleRoute(points)
  } catch {
    // Google failed or no key
  }

  // Both failed
  throw new Error('No routing service available')
}

/**
 * Get duration matrix. Only OSRM supports this.
 * Falls back to throwing so caller uses haversine.
 */
export async function getDistanceMatrix(points: Point[]): Promise<number[][]> {
  if (points.length < 2) return [[0]]

  const coords = points.map((p) => `${p.lng},${p.lat}`).join(';')
  const url = `${OSRM_BASE}/table/v1/driving/${coords}?annotations=duration`
  const res = await fetchWithTimeout(url, 6000)
  const data = await res.json()

  if (data.code !== 'Ok') {
    throw new Error(`OSRM table: ${data.code}`)
  }

  return data.durations
}
