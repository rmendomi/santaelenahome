import { createContext, useContext, useEffect, useState } from 'react'
import type { AppUser } from '@/lib/session'
import { getSession, clearSession } from '@/lib/session'

interface AuthContextValue {
  user: AppUser | null
  loading: boolean
  signOut: () => void
  setUser: (user: AppUser | null) => void
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  signOut: () => {},
  setUser: () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setUser(getSession())
    setLoading(false)
  }, [])

  function signOut() {
    clearSession()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
