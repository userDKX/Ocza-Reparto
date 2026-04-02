import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function LoginPage() {
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<'admin' | 'driver'>('driver')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (isRegister) {
      if (password.length < 6) {
        setError('La contrasena debe tener al menos 6 caracteres')
        setLoading(false)
        return
      }
      const err = await signUp(email, password, fullName, role)
      if (err) {
        setError(err.message)
        setLoading(false)
      } else {
        setSuccess('Cuenta creada. Revisa tu email para confirmar o inicia sesion.')
        setIsRegister(false)
        setLoading(false)
      }
    } else {
      const err = await signIn(email, password)
      if (err) {
        setError('Credenciales incorrectas')
        setLoading(false)
      } else {
        navigate('/map', { replace: true })
      }
    }
  }

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-8 h-8">
              <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Ocsa Rutas</h1>
          <p className="text-slate-400 text-sm mt-1">Sistema de entregas</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-xl space-y-4">
          {isRegister && (
            <div>
              <label className="block text-sm font-medium text-navy mb-1">
                Nombre completo
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary bg-slate-50 text-sm"
                placeholder="Juan Perez"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-navy mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary bg-slate-50 text-sm"
              placeholder="tu@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-navy mb-1">
              Contrasena
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary bg-slate-50 text-sm"
              placeholder="******"
            />
          </div>

          {isRegister && (
            <div>
              <label className="block text-sm font-medium text-navy mb-1">
                Rol
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setRole('admin')}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${
                    role === 'admin'
                      ? 'bg-navy text-white border-navy'
                      : 'border-slate-200 text-slate-500 bg-slate-50'
                  }`}
                >
                  Administrador
                </button>
                <button
                  type="button"
                  onClick={() => setRole('driver')}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${
                    role === 'driver'
                      ? 'bg-navy text-white border-navy'
                      : 'border-slate-200 text-slate-500 bg-slate-50'
                  }`}
                >
                  Conductor
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-600 text-sm text-center py-2 rounded-xl">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 text-green-600 text-sm text-center py-2 rounded-xl">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary-dark disabled:opacity-50 transition-all shadow-md shadow-primary/25"
          >
            {loading
              ? isRegister ? 'Registrando...' : 'Ingresando...'
              : isRegister ? 'Crear cuenta' : 'Ingresar'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-400 mt-5">
          {isRegister ? 'Ya tienes cuenta?' : 'No tienes cuenta?'}{' '}
          <button
            onClick={() => { setIsRegister(!isRegister); setError(''); setSuccess('') }}
            className="text-primary font-semibold"
          >
            {isRegister ? 'Inicia sesion' : 'Registrate'}
          </button>
        </p>
      </div>
    </div>
  )
}
