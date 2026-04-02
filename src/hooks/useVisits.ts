import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

interface LastVisitMap {
  [clientId: string]: string | null // ISO date string
}

export function useLastVisits() {
  const [lastVisits, setLastVisits] = useState<LastVisitMap>({})
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    // Get most recent completed visit per client
    const { data } = await supabase
      .from('visits')
      .select('client_id, visited_at')
      .eq('status', 'completed')
      .order('visited_at', { ascending: false })

    const map: LastVisitMap = {}
    if (data) {
      for (const row of data) {
        if (!map[row.client_id]) {
          map[row.client_id] = row.visited_at
        }
      }
    }
    setLastVisits(map)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetch()
  }, [fetch])

  return { lastVisits, loading, refresh: fetch }
}
