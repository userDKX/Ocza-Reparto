/**
 * TSP solver: nearest-neighbor heuristic + 2-opt improvement.
 * For 20-40 points runs in <50ms on a phone.
 */

/** Haversine distance in meters between two lat/lng points */
export function haversine(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/** Build a distance matrix from a duration/distance matrix (2D array) */
function nearestNeighbor(matrix: number[][], startIdx = 0): number[] {
  const n = matrix.length
  const visited = new Set<number>([startIdx])
  const order = [startIdx]
  let current = startIdx

  while (visited.size < n) {
    let nearest = -1
    let nearestDist = Infinity
    for (let i = 0; i < n; i++) {
      const dist = matrix[current]![i]!
      if (!visited.has(i) && dist < nearestDist) {
        nearest = i
        nearestDist = dist
      }
    }
    if (nearest === -1) break
    visited.add(nearest)
    order.push(nearest)
    current = nearest
  }

  return order
}

/** 2-opt improvement: swap edge pairs to shorten total distance */
function twoOpt(order: number[], matrix: number[][]): number[] {
  const route = [...order]
  const n = route.length
  let improved = true

  while (improved) {
    improved = false
    for (let i = 1; i < n - 1; i++) {
      for (let j = i + 1; j < n; j++) {
        const ri = route[i]!
        const riPrev = route[i - 1]!
        const rj = route[j]!
        const rjNext = route[(j + 1) % n]!

        const d1 = matrix[riPrev]![ri]! + matrix[rj]![rjNext]!
        const d2 = matrix[riPrev]![rj]! + matrix[ri]![rjNext]!

        if (d2 < d1) {
          // Reverse segment [i..j]
          let left = i
          let right = j
          while (left < right) {
            const tmp = route[left]!
            route[left] = route[right]!
            route[right] = tmp
            left++
            right--
          }
          improved = true
        }
      }
    }
  }

  return route
}

export interface Point {
  id: string
  lat: number
  lng: number
}

/** Build haversine distance matrix as fallback when OSRM unavailable */
export function buildHaversineMatrix(points: Point[]): number[][] {
  return points.map((a) =>
    points.map((b) => haversine(a.lat, a.lng, b.lat, b.lng))
  )
}

/**
 * Solve TSP: returns reordered indices into the points array.
 * matrix[i][j] = cost from point i to point j (duration or distance).
 */
export function solveTSP(matrix: number[][], startIdx = 0): number[] {
  if (matrix.length <= 2) return matrix.map((_, i) => i)
  const order = nearestNeighbor(matrix, startIdx)
  return twoOpt(order, matrix)
}
