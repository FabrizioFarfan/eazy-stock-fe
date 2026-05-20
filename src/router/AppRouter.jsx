import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'

import LoginPage      from '../pages/LoginPage'
import DashboardPage  from '../pages/DashboardPage'
import ProductsPage   from '../pages/ProductsPage'
import SalesPage      from '../pages/SalesPage'
import NewSalePage    from '../pages/NewSalePage'
import StockPage      from '../pages/stock/StockPage'
import ReportsPage    from '../pages/ReportsPage'
import EmployeesPage  from '../pages/EmployeesPage'
import BusinessesPage from '../pages/admin/BusinessesPage'
import OwnersPage     from '../pages/admin/OwnersPage'

export default function AppRouter() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* OWNER + EMPLOYEE */}
      <Route path="/dashboard" element={
        <ProtectedRoute allowedRoles={['OWNER', 'EMPLOYEE']}><DashboardPage /></ProtectedRoute>
      } />
      <Route path="/products" element={
        <ProtectedRoute allowedRoles={['OWNER', 'EMPLOYEE']}><ProductsPage /></ProtectedRoute>
      } />
      <Route path="/sales" element={
        <ProtectedRoute allowedRoles={['OWNER', 'EMPLOYEE']}><SalesPage /></ProtectedRoute>
      } />
      <Route path="/sales/new" element={
        <ProtectedRoute allowedRoles={['OWNER', 'EMPLOYEE']}><NewSalePage /></ProtectedRoute>
      } />
      <Route path="/stock" element={
        <ProtectedRoute allowedRoles={['OWNER', 'EMPLOYEE']}><StockPage /></ProtectedRoute>
      } />
      <Route path="/reports" element={
        <ProtectedRoute allowedRoles={['OWNER', 'EMPLOYEE']}><ReportsPage /></ProtectedRoute>
      } />

      {/* OWNER only */}
      <Route path="/empleados" element={
        <ProtectedRoute allowedRoles={['OWNER']}><EmployeesPage /></ProtectedRoute>
      } />
      {/* Legacy alias — redirect old path */}
      <Route path="/settings/users" element={<Navigate to="/empleados" replace />} />

      {/* SUPER_ADMIN only */}
      <Route path="/admin/businesses" element={
        <ProtectedRoute allowedRoles={['SUPER_ADMIN']}><BusinessesPage /></ProtectedRoute>
      } />
      <Route path="/admin/owners" element={
        <ProtectedRoute allowedRoles={['SUPER_ADMIN']}><OwnersPage /></ProtectedRoute>
      } />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
