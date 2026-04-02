import { useNavigate } from 'react-router-dom'
import { useClients } from '../hooks/useClients'
import { MapView } from '../components/map/MapView'
import type { Client } from '../types'

export function MapPage() {
  const { clients, loading } = useClients()
  const navigate = useNavigate()

  function handleClientClick(client: Client) {
    navigate(`/clients/${client.id}`)
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return <MapView clients={clients} onClientClick={handleClientClick} />
}
