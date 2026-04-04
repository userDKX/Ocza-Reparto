import { OSRM_BASE } from '../utils/constants'
import type { Point } from './tsp'

interface TableResponse {
  code: string
  durations: number[][]
}

interface RouteResponse {
  code: string
  routes: {
    geometry: {
      coordinates: [number, number][]
    }
    distance: number // meters
    duration: number // seconds
  }[]
}

function coordsString(points: Point[]): string {
  return points.map((p) => `${p.lng},${p.lat}`).join(';')
}

/** Fetch with timeout (default 8s) */
function fetchWithTimeout(url: string, timeoutMs = 5000): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timer))
}

/**
 * Get duration matrix from OSRM Table service.
 * Returns durations in seconds. Throws on failure.
 */
export async function getDistanceMatrix(points: Point[]): Promise<number[][]> {
  if (points.length < 2) return [[0]]

  const url = `${OSRM_BASE}/table/v1/driving/${coordsString(points)}?annotations=duration`
  const res = await fetchWithTimeout(url)
  const data: TableResponse = await res.json()

  if (data.code !== 'Ok') {
    throw new Error(`OSRM table error: ${data.code}`)
  }

  return data.durations
}

/**
 * Get route geometry from OSRM Route service.
 * Returns GeoJSON coordinates and totals.
 */
export async function getRouteGeometry(
  points: Point[]
): Promise<{ coordinates: [number, number][]; distanceKm: number; durationMin: number }> {
  if (points.length < 2) {
    return { coordinates: [], distanceKm: 0, durationMin: 0 }
  }

  const url = `${OSRM_BASE}/route/v1/driving/${coordsString(points)}?overview=full&geometries=geojson`
  const res = await fetchWithTimeout(url)
  const data: RouteResponse = await res.json()

  if (data.code !== 'Ok' || !data.routes[0]) {
    throw new Error(`OSRM route error: ${data.code}`)
  }

  const route = data.routes[0]
  return {
    coordinates: route.geometry.coordinates,
    distanceKm: route.distance / 1000,
    durationMin: route.duration / 60,
  }
}
