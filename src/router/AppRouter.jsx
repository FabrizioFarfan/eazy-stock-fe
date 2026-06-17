import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'
import { useAuth } from '../context/AuthContext'

import LandingPage    from '../pages/LandingPage'
import LoginPage      from '../pages/LoginPage'

const ROLE_HOME = { SUPER_ADMIN: '/admin/businesses', OWNER: '/dashboard', EMPLOYEE: '/sales/new' }

function LandingRoute() {
  const { token, user, isLoading } = useAuth()
  if (isLoading) return (
    <div className="flex h-screen items-center justify-center bg-[#111827]">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
    </div>
  )
  if (token) return <Navigate to={ROLE_HOME[user?.role] ?? '/dashboard'} replace />
  return <LandingPage />
}
import DashboardPage  from '../pages/DashboardPage'
import ProductsPage   from '../pages/ProductsPage'
import ProductImportPage from '../pages/ProductImportPage'
import ProductExportPage from '../pages/ProductExportPage'
import SalesPage      from '../pages/SalesPage'
import NewSalePage    from '../pages/NewSalePage'
import StockPage      from '../pages/stock/StockPage'
import ReportsPage    from '../pages/ReportsPage'
import EmployeesPage       from '../pages/EmployeesPage'
import SuppliersPage       from '../pages/SuppliersPage'
import SupplierDetailPage  from '../pages/SupplierDetailPage'
import BrandsPage          from '../pages/BrandsPage'
import CategoriesPage      from '../pages/CategoriesPage'
import CustomersPage       from '../pages/CustomersPage'
import CustomerDetailPage  from '../pages/CustomerDetailPage'
import ReceivablesPage     from '../pages/ReceivablesPage'
import PayablesPage        from '../pages/PayablesPage'
import SettingsPage        from '../pages/SettingsPage'
import BusinessesPage      from '../pages/admin/BusinessesPage'
import OwnersPage          from '../pages/admin/OwnersPage'

export default function AppRouter() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingRoute />} />
      <Route path="/login" element={<LoginPage />} />

      {/* OWNER + EMPLOYEE */}
      <Route path="/dashboard" element={
        <ProtectedRoute allowedRoles={['OWNER', 'EMPLOYEE']}><DashboardPage /></ProtectedRoute>
      } />
      <Route path="/products" element={
        <ProtectedRoute allowedRoles={['OWNER', 'EMPLOYEE']}><ProductsPage /></ProtectedRoute>
      } />
      <Route path="/products/import" element={
        <ProtectedRoute allowedRoles={['OWNER', 'SUPER_ADMIN']}><ProductImportPage /></ProtectedRoute>
      } />
      <Route path="/products/export" element={
        <ProtectedRoute allowedRoles={['OWNER', 'EMPLOYEE', 'SUPER_ADMIN']}><ProductExportPage /></ProtectedRoute>
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
      <Route path="/suppliers/:id" element={
        <ProtectedRoute allowedRoles={['OWNER']}><SupplierDetailPage /></ProtectedRoute>
      } />
      <Route path="/brands" element={
        <ProtectedRoute allowedRoles={['OWNER']}><BrandsPage /></ProtectedRoute>
      } />
      <Route path="/categories" element={
        <ProtectedRoute allowedRoles={['OWNER']}><CategoriesPage /></ProtectedRoute>
      } />

      {/* Customers (paso 4) — OWNER y EMPLOYEE con canManageCustomers */}
      <Route path="/customers" element={
        <ProtectedRoute allowedRoles={['OWNER', 'EMPLOYEE']}><CustomersPage /></ProtectedRoute>
      } />
      <Route path="/customers/:id" element={
        <ProtectedRoute allowedRoles={['OWNER', 'EMPLOYEE']}><CustomerDetailPage /></ProtectedRoute>
      } />
      <Route path="/reports/receivables" element={
        <ProtectedRoute allowedRoles={['OWNER', 'EMPLOYEE']}><ReceivablesPage /></ProtectedRoute>
      } />
      <Route path="/reports/payables" element={
        <ProtectedRoute allowedRoles={['OWNER']}><PayablesPage /></ProtectedRoute>
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
