import { useAuth } from '../hooks/useAuth'

export function AdminPage() {
  const { profile, signOut } = useAuth()

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold text-navy">Mi Perfil</h1>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <span className="text-primary font-bold text-xl">
              {profile?.full_name?.charAt(0) ?? '?'}
            </span>
          </div>
          <div>
            <p className="font-bold text-navy text-lg">{profile?.full_name}</p>
            <span className="inline-block mt-0.5 text-xs bg-navy/5 text-navy-mid px-2.5 py-0.5 rounded-full font-medium capitalize">
              {profile?.role === 'admin' ? 'Administrador' : 'Conductor'}
            </span>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-4 space-y-3 text-sm">
          {profile?.phone && (
            <div className="flex justify-between">
              <span className="text-slate-400">Telefono</span>
              <span className="text-navy font-medium">{profile.phone}</span>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <p className="text-xs font-semibold text-navy-mid uppercase tracking-wide mb-3">Aplicacion</p>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-slate-400">Version</span>
          <span className="text-navy font-medium">1.0.0</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Empresa</span>
          <span className="text-navy font-medium">Ocsa Importaciones</span>
        </div>
      </div>

      <button
        onClick={signOut}
        className="w-full bg-red-50 text-red-500 py-3 rounded-xl text-sm font-semibold active:scale-[0.98] transition-transform"
      >
        Cerrar sesion
      </button>
    </div>
  )
}
