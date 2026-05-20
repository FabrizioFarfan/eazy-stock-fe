import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'

import LoginPage from '../pages/LoginPage'
import DashboardPage from '../pages/DashboardPage'
import ProductsPage from '../pages/ProductsPage'
import SalesPage from '../pages/SalesPage'
import NewSalePage from '../pages/NewSalePage'
import StockPage from '../pages/stock/StockPage'
import ReportsPage from '../pages/ReportsPage'
import UsersPage from '../pages/UsersPage'
import SuppliersPage from '../pages/SuppliersPage'
import BrandsPage from '../pages/BrandsPage'
import BusinessesPage from '../pages/admin/BusinessesPage'

export default function AppRouter() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />

      {/* Redirect root → login */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Protected — all authenticated roles */}
      <Route path="/dashboard" element={
        <ProtectedRoute><DashboardPage /></ProtectedRoute>
      } />
      <Route path="/products" element={
        <ProtectedRoute><ProductsPage /></ProtectedRoute>
      } />
      <Route path="/sales" element={
        <ProtectedRoute><SalesPage /></ProtectedRoute>
      } />
      <Route path="/sales/new" element={
        <ProtectedRoute><NewSalePage /></ProtectedRoute>
      } />
      <Route path="/stock" element={
        <ProtectedRoute><StockPage /></ProtectedRoute>
      } />

      {/* OWNER only */}
      <Route path="/reports" element={
        <ProtectedRoute allowedRoles={['OWNER']}><ReportsPage /></ProtectedRoute>
      } />
      <Route path="/settings/users" element={
        <ProtectedRoute allowedRoles={['OWNER']}><UsersPage /></ProtectedRoute>
      } />
      <Route path="/suppliers" element={
        <ProtectedRoute allowedRoles={['OWNER']}><SuppliersPage /></ProtectedRoute>
      } />
      <Route path="/brands" element={
        <ProtectedRoute allowedRoles={['OWNER']}><BrandsPage /></ProtectedRoute>
      } />

      {/* SUPER_ADMIN only */}
      <Route path="/admin/businesses" element={
        <ProtectedRoute allowedRoles={['SUPER_ADMIN']}><BusinessesPage /></ProtectedRoute>
      } />
      <Route path="/admin/users" element={
        <ProtectedRoute allowedRoles={['SUPER_ADMIN']}><UsersPage /></ProtectedRoute>
      } />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
