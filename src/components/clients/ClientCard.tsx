import type { Client } from '../../types'

interface Props {
  client: Client
  onClick: (client: Client) => void
}

export function ClientCard({ client, onClick }: Props) {
  return (
    <button
      onClick={() => onClick(client)}
      className="w-full flex items-center gap-3 p-3 bg-white rounded-xl text-left shadow-sm active:scale-[0.98] transition-transform border border-slate-100"
    >
      {client.photo_url ? (
        <img
          src={client.photo_url}
          alt={client.name}
          className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
        />
      ) : (
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <span className="text-primary font-bold text-lg">{client.name.charAt(0)}</span>
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-navy text-sm truncate">{client.name}</p>
        {client.owner_name && (
          <p className="text-xs text-slate-500 truncate">{client.owner_name}</p>
        )}
        {client.zone && (
          <span className="inline-block mt-1 text-xs bg-navy/5 text-navy-mid px-2 py-0.5 rounded-full">
            {client.zone}
          </span>
        )}
      </div>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-slate-300 flex-shrink-0">
        <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
      </svg>
    </button>
  )
}
