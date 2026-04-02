export interface Profile {
  id: string
  full_name: string
  role: 'admin' | 'driver'
  phone: string | null
  created_at: string
}

export interface Client {
  id: string
  name: string
  owner_name: string | null
  phone: string | null
  address: string | null
  lat: number
  lng: number
  zone: string | null

  photo_url: string | null
  notes: string | null
  active: boolean
  created_at: string
  updated_at: string
}

export interface Route {
  id: string
  date: string
  driver_id: string
  status: 'planned' | 'in_progress' | 'completed'
  total_distance_km: number | null
  total_time_min: number | null
  optimized_order: string[]
  created_by: string
  created_at: string
  started_at: string | null
  completed_at: string | null
}

export interface Visit {
  id: string
  route_id: string
  client_id: string
  stop_order: number
  status: 'pending' | 'completed' | 'skipped'
  visited_at: string | null
  notes: string | null
  created_at: string
}
