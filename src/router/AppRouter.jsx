import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'

import LandingPage    from '../pages/LandingPage'
import LoginPage      from '../pages/LoginPage'
import DashboardPage  from '../pages/DashboardPage'
import ProductsPage   from '../pages/ProductsPage'
import SalesPage      from '../pages/SalesPage'
import NewSalePage    from '../pages/NewSalePage'
import StockPage      from '../pages/stock/StockPage'
import ReportsPage    from '../pages/ReportsPage'
import EmployeesPage  from '../pages/EmployeesPage'
import SuppliersPage  from '../pages/SuppliersPage'
import BrandsPage     from '../pages/BrandsPage'
import SettingsPage   from '../pages/SettingsPage'
import BusinessesPage from '../pages/admin/BusinessesPage'
import OwnersPage     from '../pages/admin/OwnersPage'

export default function AppRouter() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />

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
      <Route path="/suppliers" element={
        <ProtectedRoute allowedRoles={['OWNER']}><SuppliersPage /></ProtectedRoute>
      } />
      <Route path="/brands" element={
        <ProtectedRoute allowedRoles={['OWNER']}><BrandsPage /></ProtectedRoute>
      } />
      {/* Settings — todos los roles autenticados */}
      <Route path="/settings" element={
        <ProtectedRoute allowedRoles={['OWNER', 'EMPLOYEE', 'SUPER_ADMIN']}><SettingsPage /></ProtectedRoute>
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
