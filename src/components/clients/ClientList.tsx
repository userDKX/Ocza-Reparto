import { useState, useMemo } from 'react'
import { ClientCard } from './ClientCard'
import type { Client } from '../../types'

const PAGE_SIZE = 20

interface Props {
  clients: Client[]
  onClientClick: (client: Client) => void
}

export function ClientList({ clients, onClientClick }: Props) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)

  const filtered = useMemo(() => {
    if (!search.trim()) return clients
    const q = search.toLowerCase()
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.owner_name?.toLowerCase().includes(q) ||
        c.zone?.toLowerCase().includes(q)
    )
  }, [clients, search])

  // Reset page when search changes
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const currentPage = Math.min(page, Math.max(0, totalPages - 1))
  const paginated = filtered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE)

  function handleSearch(value: string) {
    setSearch(value)
    setPage(0)
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
        </svg>
        <input
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Buscar cliente, dueno o zona..."
          className="w-full pl-9 pr-9 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm shadow-sm"
        />
        {search && (
          <button
            onClick={() => handleSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        )}
      </div>

      {search && (
        <p className="text-xs text-slate-400">
          {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
        </p>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-slate-400">
              <path d="M4.5 6.375a4.125 4.125 0 1 1 8.25 0 4.125 4.125 0 0 1-8.25 0ZM14.25 8.625a3.375 3.375 0 1 1 6.75 0 3.375 3.375 0 0 1-6.75 0ZM1.5 19.125a7.125 7.125 0 0 1 14.25 0v.003l-.001.119a.75.75 0 0 1-.363.63 13.067 13.067 0 0 1-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 0 1-.364-.63l-.001-.122ZM17.25 19.128l-.001.144a2.25 2.25 0 0 1-.233.96 10.088 10.088 0 0 0 5.06-1.01.75.75 0 0 0 .42-.643 4.875 4.875 0 0 0-6.957-4.611 8.586 8.586 0 0 1 1.71 5.157v.003Z" />
            </svg>
          </div>
          <p className="text-slate-400 text-sm">
            {search ? 'Sin resultados' : 'No hay clientes registrados'}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {paginated.map((client) => (
              <ClientCard key={client.id} client={client} onClick={onClientClick} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={currentPage === 0}
                className="px-3 py-2 text-sm font-medium rounded-lg bg-white border border-slate-200 text-navy-mid disabled:opacity-30 active:scale-95 transition-transform"
              >
                Anterior
              </button>
              <span className="text-xs text-slate-400">
                {currentPage + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage >= totalPages - 1}
                className="px-3 py-2 text-sm font-medium rounded-lg bg-white border border-slate-200 text-navy-mid disabled:opacity-30 active:scale-95 transition-transform"
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
