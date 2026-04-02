import { formatDistance, formatDuration } from '../../utils/formatters'

interface Props {
  distanceKm: number
  durationMin: number
  stopCount: number
}

export function RouteSummary({ distanceKm, durationMin, stopCount }: Props) {
  return (
    <div className="flex gap-2">
      <div className="flex-1 bg-white rounded-2xl p-3 shadow-sm text-center border border-slate-100">
        <p className="text-xl font-bold text-primary">{stopCount}</p>
        <p className="text-xs text-slate-400">Paradas</p>
      </div>
      <div className="flex-1 bg-white rounded-2xl p-3 shadow-sm text-center border border-slate-100">
        <p className="text-xl font-bold text-navy">{formatDistance(distanceKm)}</p>
        <p className="text-xs text-slate-400">Distancia</p>
      </div>
      <div className="flex-1 bg-white rounded-2xl p-3 shadow-sm text-center border border-slate-100">
        <p className="text-xl font-bold text-navy">{formatDuration(durationMin)}</p>
        <p className="text-xs text-slate-400">Tiempo est.</p>
      </div>
    </div>
  )
}
