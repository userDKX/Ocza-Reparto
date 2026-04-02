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

export function useRoutes() {
  const [optimizing, setOptimizing] = useState(false)
  const [saving, setSaving] = useState(false)

  async function optimizeRoute(clients: Client[]): Promise<OptimizedRoute> {
    setOptimizing(true)
    try {
      const points: Point[] = clients.map((c) => ({ id: c.id, lat: c.lat, lng: c.lng }))

      // Get distance matrix (OSRM or fallback to haversine)
      let matrix: number[][]
      try {
        matrix = await getDistanceMatrix(points)
      } catch {
        matrix = buildHaversineMatrix(points)
      }

      // Solve TSP
      const order = solveTSP(matrix, 0)
      const orderedClients = order.map((i) => clients[i]!)

      // Get route geometry for drawing on map
      const orderedPoints = order.map((i) => points[i]!)
      let coordinates: [number, number][] = []
      let distanceKm = 0
      let durationMin = 0

      try {
        const geo = await getRouteGeometry(orderedPoints)
        coordinates = geo.coordinates
        distanceKm = geo.distanceKm
        durationMin = geo.durationMin
      } catch {
        // If OSRM fails, estimate from haversine
        let totalMeters = 0
        for (let i = 0; i < orderedPoints.length - 1; i++) {
          totalMeters += matrix[order[i]!]![order[i + 1]!]!
        }
        distanceKm = totalMeters / 1000
        durationMin = (totalMeters / 1000 / 30) * 60 // estimate 30km/h
        coordinates = orderedPoints.map((p) => [p.lng, p.lat])
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
