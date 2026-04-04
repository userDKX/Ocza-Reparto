import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

interface LastVisitMap {
  [clientId: string]: string | null // ISO date string
}

export function useLastVisits() {
  const [lastVisits, setLastVisits] = useState<LastVisitMap>({})
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    try {
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
    } catch {
      // Table may not exist yet - return empty map
      setLastVisits({})
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetch()
  }, [fetch])

  return { lastVisits, loading, refresh: fetch }
}
