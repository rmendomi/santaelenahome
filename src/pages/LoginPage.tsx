import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { setSession } from '@/lib/session'

export function LoginPage() {
  const { setUser } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'No se pudo ingresar. Intente de nuevo.')
        return
      }

      setSession(data)
      setUser(data)
      navigate('/', { replace: true })
    } catch {
      setError('Sin conexión. Verifique su internet.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-warm flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🏠</div>
          <h1 className="text-3xl font-bold text-primary">Gastos</h1>
          <h2 className="text-2xl font-bold text-gray-700">Santa Elena</h2>
          <p className="text-gray-400 text-sm mt-2">Control de gastos del hostal</p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-5">Ingresar al sistema</h3>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.cl"
                required
                className="w-full px-4 py-4 rounded-xl border border-gray-200 focus:border-primary focus:outline-none text-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-4 rounded-xl border border-gray-200 focus:border-primary focus:outline-none text-lg"
              />
            </div>

            {error && (
              <div className="p-4 rounded-xl text-base bg-red-50 text-red-700 border border-red-200">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 rounded-xl bg-primary text-white font-bold text-xl active:scale-95 transition-transform disabled:opacity-60 mt-2"
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-400 text-xs mt-6">
          Solo para miembros del Hostal Santa Elena
        </p>
      </div>
    </div>
  )
}
