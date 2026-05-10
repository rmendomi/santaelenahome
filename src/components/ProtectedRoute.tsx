import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { LoadingState } from './LoadingState'

export function ProtectedRoute() {
  const { user, loading } = useAuth()

  if (loading) return <LoadingState fullPage />
  if (!user) return <Navigate to="/login" replace />

  return <Outlet />
}
