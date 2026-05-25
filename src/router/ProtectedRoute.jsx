import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AppLayout from '../layouts/AppLayout'

export default function ProtectedRoute({ children, allowedRoles }) {
  const { token, user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  if (!token) return <Navigate to="/login" replace />

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    const home = { SUPER_ADMIN: '/admin/businesses', OWNER: '/dashboard', EMPLOYEE: '/dashboard' }
    return <Navigate to={home[user.role] ?? '/dashboard'} replace />
  }

  return <AppLayout>{children}</AppLayout>
}
