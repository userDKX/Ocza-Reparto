import { useState } from 'react'
import { getDistanceMatrix, getRouteGeometry } from '../lib/routing'
import { solveTSP, buildHaversineMatrix } from '../lib/tsp'
import type { Point } from '../lib/tsp'
import type { Client } from '../types'

export interface OptimizedRoute {
  orderedClients: Client[]
  coordinates: [number, number][]
  distanceKm: number
  durationMin: number
}

interface StartingPoint {
  lat: number
  lng: number
}

export type OptimizePhase =
  | 'idle'
  | 'matrix'       // Getting distance matrix
  | 'solving'      // Solving TSP
  | 'roads'        // Getting road geometry
  | 'done'

export function useRoutes() {
  const [phase, setPhase] = useState<OptimizePhase>('idle')

  async function optimizeRoute(
    clients: Client[],
    startingPoint?: StartingPoint | null,
  ): Promise<OptimizedRoute> {
    try {
      const hasOrigin = !!startingPoint
      const originPoint: Point | null = hasOrigin
        ? { id: '__origin__', lat: startingPoint!.lat, lng: startingPoint!.lng }
        : null

      const allPoints: Point[] = [
        ...(originPoint ? [originPoint] : []),
        ...clients.map((c) => ({ id: c.id, lat: c.lat, lng: c.lng })),
      ]

      // Phase 1: Distance matrix
      setPhase('matrix')
      let matrix: number[][]
      try {
        matrix = await getDistanceMatrix(allPoints)
      } catch {
        matrix = buildHaversineMatrix(allPoints)
      }

      // Phase 2: TSP
      setPhase('solving')
      const order = solveTSP(matrix, 0)

      const clientOrder = hasOrigin
        ? order.filter((i) => i !== 0).map((i) => i - 1)
        : order

      const orderedClients = clientOrder.map((i) => clients[i]!)

      const routePoints: Point[] = [
        ...(originPoint ? [originPoint] : []),
        ...orderedClients.map((c) => ({ id: c.id, lat: c.lat, lng: c.lng })),
      ]

      // Phase 3: Road geometry
      setPhase('roads')
      let coordinates: [number, number][] = []
      let distanceKm = 0
      let durationMin = 0

      try {
        const geo = await getRouteGeometry(routePoints)
        coordinates = geo.coordinates
        distanceKm = geo.distanceKm
        durationMin = geo.durationMin
      } catch {
        // Fallback: haversine estimates with straight lines
        let totalMeters = 0
        for (let i = 0; i < order.length - 1; i++) {
          totalMeters += matrix[order[i]!]![order[i + 1]!]!
        }
        const roadFactor = 1.3
        distanceKm = (totalMeters / 1000) * roadFactor
        durationMin = (distanceKm / 30) * 60
        coordinates = routePoints.map((p) => [p.lng, p.lat])
      }

      setPhase('done')
      return { orderedClients, coordinates, distanceKm, durationMin }
    } catch {
      setPhase('idle')
      throw new Error('Error optimizando ruta')
    }
  }

  return { optimizeRoute, phase }
}
