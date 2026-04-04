import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { getDistanceMatrix, getRouteGeometry } from '../lib/osrm'
import { solveTSP, buildHaversineMatrix } from '../lib/tsp'
import type { Point } from '../lib/tsp'
import type { Client } from '../types'

interface OptimizedRoute {
  orderedClients: Client[]
  coordinates: [number, number][]
  distanceKm: number
  durationMin: number
}

interface StartingPoint {
  lat: number
  lng: number
}

export function useRoutes() {
  const [optimizing, setOptimizing] = useState(false)
  const [saving, setSaving] = useState(false)

  async function optimizeRoute(
    clients: Client[],
    startingPoint?: StartingPoint | null
  ): Promise<OptimizedRoute> {
    setOptimizing(true)
    try {
      // If we have a GPS starting point, prepend it as a virtual "origin" node
      const hasOrigin = !!startingPoint
      const originPoint: Point | null = hasOrigin
        ? { id: '__origin__', lat: startingPoint!.lat, lng: startingPoint!.lng }
        : null

      const allPoints: Point[] = [
        ...(originPoint ? [originPoint] : []),
        ...clients.map((c) => ({ id: c.id, lat: c.lat, lng: c.lng })),
      ]

      // Get distance matrix (OSRM or fallback to haversine)
      let matrix: number[][]
      try {
        matrix = await getDistanceMatrix(allPoints)
      } catch {
        matrix = buildHaversineMatrix(allPoints)
      }

      // Solve TSP starting from index 0 (origin if available, else first client)
      const order = solveTSP(matrix, 0)

      // Remove the origin from the result order, keep only client indices
      const clientOrder = hasOrigin
        ? order.filter((i) => i !== 0).map((i) => i - 1) // shift indices since origin was at 0
        : order

      const orderedClients = clientOrder.map((i) => clients[i]!)

      // Build route geometry: include origin as first waypoint for driving directions
      const routePoints: Point[] = [
        ...(originPoint ? [originPoint] : []),
        ...orderedClients.map((c) => ({ id: c.id, lat: c.lat, lng: c.lng })),
      ]

      let coordinates: [number, number][] = []
      let distanceKm = 0
      let durationMin = 0

      try {
        const geo = await getRouteGeometry(routePoints)
        coordinates = geo.coordinates
        distanceKm = geo.distanceKm
        durationMin = geo.durationMin
      } catch {
        // If OSRM fails, estimate from haversine
        let totalMeters = 0
        for (let i = 0; i < order.length - 1; i++) {
          totalMeters += matrix[order[i]!]![order[i + 1]!]!
        }
        distanceKm = totalMeters / 1000
        durationMin = (totalMeters / 1000 / 30) * 60 // estimate 30km/h
        coordinates = routePoints.map((p) => [p.lng, p.lat])
      }

      return { orderedClients, coordinates, distanceKm, durationMin }
    } finally {
      setOptimizing(false)
    }
  }

  async function saveRoute(
    orderedClients: Client[],
    distanceKm: number,
    durationMin: number,
    driverId: string
  ) {
    setSaving(true)
    try {
      const { data: route, error } = await supabase
        .from('routes')
        .insert({
          driver_id: driverId,
          created_by: driverId,
          optimized_order: orderedClients.map((c) => c.id),
          total_distance_km: Math.round(distanceKm * 10) / 10,
          total_time_min: Math.round(durationMin),
        })
        .select()
        .single()

      if (error) throw error

      // Create visit entries for each stop
      const visits = orderedClients.map((client, index) => ({
        route_id: route.id,
        client_id: client.id,
        stop_order: index + 1,
      }))

      const { error: visitError } = await supabase.from('visits').insert(visits)
      if (visitError) throw visitError

      return route
    } finally {
      setSaving(false)
    }
  }

  return { optimizeRoute, saveRoute, optimizing, saving }
}
