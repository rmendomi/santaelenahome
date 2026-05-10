import { useState } from 'react'
import { supabase } from '@/lib/supabase'

type Mode = 'password' | 'magic'

export function LoginPage() {
  const [mode, setMode] = useState<Mode>('password')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setMessage({ type: 'error', text: error.message })
    setLoading(false)
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    })
    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setMessage({ type: 'success', text: '¡Listo! Revisa tu correo para el enlace de acceso.' })
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-warm flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🏠</div>
          <h1 className="text-3xl font-bold text-primary">Gastos</h1>
          <h2 className="text-2xl font-bold text-gray-700">Santa Elena</h2>
          <p className="text-gray-400 text-sm mt-2">Control de gastos del hostal</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          {/* Tabs */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
            <button
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === 'password' ? 'bg-white text-primary shadow-sm' : 'text-gray-500'
              }`}
              onClick={() => setMode('password')}
            >
              Contraseña
            </button>
            <button
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === 'magic' ? 'bg-white text-primary shadow-sm' : 'text-gray-500'
              }`}
              onClick={() => setMode('magic')}
            >
              Enlace mágico
            </button>
          </div>

          <form onSubmit={mode === 'password' ? handlePasswordLogin : handleMagicLink} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.cl"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:outline-none text-base"
              />
            </div>

            {mode === 'password' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:outline-none text-base"
                />
              </div>
            )}

            {message && (
              <div
                className={`p-3 rounded-xl text-sm ${
                  message.type === 'success'
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl bg-primary text-white font-semibold text-base active:scale-95 transition-transform disabled:opacity-60 mt-2"
            >
              {loading
                ? 'Ingresando...'
                : mode === 'password'
                ? 'Ingresar'
                : 'Enviar enlace'}
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
