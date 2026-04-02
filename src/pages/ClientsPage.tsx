import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useClients } from '../hooks/useClients'
import { ClientList } from '../components/clients/ClientList'
import { ClientForm } from '../components/clients/ClientForm'
import type { Client } from '../types'

export function ClientsPage() {
  const { clients, loading, createClient } = useClients()
  const navigate = useNavigate()
  const [showForm, setShowForm] = useState(false)

  function handleClientClick(client: Client) {
    navigate(`/clients/${client.id}`)
  }

  if (showForm) {
    return (
      <ClientForm
        onSubmit={async (data, photo) => {
          await createClient(data, photo)
          setShowForm(false)
        }}
        onCancel={() => setShowForm(false)}
      />
    )
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-navy">Clientes</h1>
          {!loading && (
            <p className="text-xs text-slate-400 mt-0.5">{clients.length} registrados</p>
          )}
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-md shadow-primary/25 active:scale-95 transition-transform"
        >
          + Nuevo
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <ClientList clients={clients} onClientClick={handleClientClick} />
      )}
    </div>
  )
}
