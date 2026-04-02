import type { Client } from '../types'

export interface ClientWithUrgency {
  client: Client
  urgency: number // days overdue (negative = not yet due)
  lastVisited: string | null
}

/**
 * Score and select clients for today's route.
 * Prioritizes: overdue clients first, then zones with higher density.
 */
export function selectClientsForToday(
  clients: ClientWithUrgency[],
  maxStops = 35
): ClientWithUrgency[] {
  // Filter to only due/overdue clients
  const due = clients.filter((c) => c.urgency >= 0)

  // Group by zone
  const byZone = new Map<string, ClientWithUrgency[]>()
  for (const c of due) {
    const zone = c.client.zone || 'Sin zona'
    if (!byZone.has(zone)) byZone.set(zone, [])
    byZone.get(zone)!.push(c)
  }

  // Sort clients within each zone by urgency (most overdue first)
  for (const zoneClients of byZone.values()) {
    zoneClients.sort((a, b) => b.urgency - a.urgency)
  }

  // Sort zones by client count descending (denser zones first)
  const sortedZones = [...byZone.entries()].sort((a, b) => b[1].length - a[1].length)

  // Fill up to maxStops
  const selected: ClientWithUrgency[] = []
  for (const [, zoneClients] of sortedZones) {
    for (const c of zoneClients) {
      if (selected.length >= maxStops) return selected
      selected.push(c)
    }
  }

  return selected
}

/**
 * Calculate urgency for a client based on last visit date.
 */
export function calcUrgency(client: Client, lastVisitedAt: string | null): ClientWithUrgency {
  const daysSinceVisit = lastVisitedAt
    ? (Date.now() - new Date(lastVisitedAt).getTime()) / 86400000
    : 999 // never visited = max urgency

  return {
    client,
    urgency: daysSinceVisit,
    lastVisited: lastVisitedAt,
  }
}
