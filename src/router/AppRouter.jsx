import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'
import { useAuth } from '../context/AuthContext'

import LandingPage    from '../pages/LandingPage'
import LoginPage      from '../pages/LoginPage'
import RegisterPage   from '../pages/RegisterPage'
import PlansPage      from '../pages/PlansPage'
import FeaturesPage   from '../pages/FeaturesPage'
import AudiencePage   from '../pages/AudiencePage'
import { ImpressumPage, PrivacyPage, TermsPage } from '../pages/LegalPage'
import FaqPage        from '../pages/FaqPage'
import DeleteAccountInfoPage from '../pages/DeleteAccountInfoPage'
import ForgotPasswordPage from '../pages/ForgotPasswordPage'
import ResetPasswordPage  from '../pages/ResetPasswordPage'
import VerifyEmailPage    from '../pages/VerifyEmailPage'
import VerifyCodePage     from '../pages/VerifyCodePage'

// Alias en inglés que conservan el ?token=… del correo
function ResetRedirect()  { return <Navigate to={{ pathname: '/restablecer', search: window.location.search }} replace /> }
function VerifyRedirect() { return <Navigate to={{ pathname: '/verificar',   search: window.location.search }} replace /> }

const ROLE_HOME = { SUPER_ADMIN: '/admin/businesses', OWNER: '/dashboard', EMPLOYEE: '/sales/new' }

function LandingRoute() {
  const { token, user, isLoading } = useAuth()
  if (isLoading) return (
    <div className="flex h-screen items-center justify-center bg-[#111827]">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
    </div>
  )
  if (token) return <Navigate to={user?.isBoss ? '/boss' : (ROLE_HOME[user?.role] ?? '/dashboard')} replace />
  return <LandingPage />
}
import DashboardPage  from '../pages/DashboardPage'
import WelcomePage    from '../pages/WelcomePage'
import ProductsPage   from '../pages/ProductsPage'
import ProductImportPage from '../pages/ProductImportPage'
import ProductExportPage from '../pages/ProductExportPage'
import SalesPage      from '../pages/SalesPage'
import NewSalePage    from '../pages/NewSalePage'
import QuotePage      from '../pages/QuotePage'
import QuotesHistoryPage from '../pages/QuotesHistoryPage'
import NotificationsPage from '../pages/NotificationsPage'
import StockPage      from '../pages/stock/StockPage'
import ReportsPage    from '../pages/ReportsPage'
import BalancePage    from '../pages/BalancePage'
import SellerPerformancePage from '../pages/SellerPerformancePage'
import CustomerRankingPage from '../pages/CustomerRankingPage'
import SupplierAnalysisPage from '../pages/SupplierAnalysisPage'
import PurchasesPage from '../pages/PurchasesPage'
import EmployeesPage       from '../pages/EmployeesPage'
import SuppliersPage       from '../pages/SuppliersPage'
import SupplierDetailPage  from '../pages/SupplierDetailPage'
import BrandsPage          from '../pages/BrandsPage'
import CategoriesPage      from '../pages/CategoriesPage'
import LocationsPage       from '../pages/LocationsPage'
import CustomersPage       from '../pages/CustomersPage'
import CustomerDetailPage  from '../pages/CustomerDetailPage'
import ReceivablesPage     from '../pages/ReceivablesPage'
import PayablesPage        from '../pages/PayablesPage'
import SettingsPage        from '../pages/SettingsPage'
import MyBusinessesPage    from '../pages/MyBusinessesPage'
import BusinessesPage      from '../pages/admin/BusinessesPage'
import OwnersPage          from '../pages/admin/OwnersPage'
import BossPage            from '../pages/BossPage'
import SubscriptionsPage   from '../pages/admin/SubscriptionsPage'
import FeedbackPage       from '../pages/admin/FeedbackPage'

export default function AppRouter() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingRoute />} />
      <Route path="/login" element={<LoginPage />} />
      {/* Registro propio con prueba gratis (M1 «Planes en serio», 15-oct-2026) */}
      <Route path="/registro" element={<RegisterPage />} />
      <Route path="/register" element={<Navigate to="/registro" replace />} />
      <Route path="/signup" element={<Navigate to="/registro" replace />} />
      {/* Recuperar contraseña + confirmar correo por enlace (22-oct-2026); alias en inglés */}
      <Route path="/olvide" element={<ForgotPasswordPage />} />
      <Route path="/restablecer" element={<ResetPasswordPage />} />
      <Route path="/verificar" element={<VerifyEmailPage />} />
      {/* Código de 6 dígitos (API 1.16.0): el dueño no entra a nada hasta confirmarlo */}
      <Route path="/confirmar-correo" element={<VerifyCodePage />} />
      <Route path="/verify-code" element={<Navigate to="/confirmar-correo" replace />} />
      <Route path="/forgot" element={<Navigate to="/olvide" replace />} />
      <Route path="/reset" element={<ResetRedirect />} />
      <Route path="/verify" element={<VerifyRedirect />} />
      <Route path="/planes" element={<PlansPage />} />
      <Route path="/funciones" element={<FeaturesPage />} />
      <Route path="/para-quien" element={<AudiencePage />} />
      <Route path="/preguntas" element={<FaqPage />} />
      <Route path="/precios" element={<Navigate to="/planes" replace />} />
      {/* Legales DE (15-oct-2026): Impressum § 5 DDG + Datenschutz DSGVO; alias en es/en */}
      <Route path="/impressum" element={<ImpressumPage />} />
      <Route path="/datenschutz" element={<PrivacyPage />} />
      <Route path="/privacidad" element={<Navigate to="/datenschutz" replace />} />
      <Route path="/privacy" element={<Navigate to="/datenschutz" replace />} />
      <Route path="/legal" element={<Navigate to="/impressum" replace />} />
      {/* Términos y condiciones (22-oct-2026): suscripción con Stripe; alias en/de */}
      <Route path="/terminos" element={<TermsPage />} />
      <Route path="/terms" element={<Navigate to="/terminos" replace />} />
      <Route path="/agb" element={<Navigate to="/terminos" replace />} />
      <Route path="/condiciones" element={<Navigate to="/terminos" replace />} />
      {/* Borrado de cuenta (24-oct-2026): la página pública que pide Google Play; alias en inglés */}
      <Route path="/eliminar-cuenta" element={<DeleteAccountInfoPage />} />
      <Route path="/delete-account" element={<Navigate to="/eliminar-cuenta" replace />} />

      {/* OWNER + EMPLOYEE */}
      <Route path="/dashboard" element={
        <ProtectedRoute allowedRoles={['OWNER', 'EMPLOYEE']}><DashboardPage /></ProtectedRoute>
      } />
      {/* Onboarding «Carga tu catálogo» (20-oct-2026): a donde cae una cuenta recién creada. */}
      <Route path="/bienvenida" element={
        <ProtectedRoute allowedRoles={['OWNER']}><WelcomePage /></ProtectedRoute>
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
      <Route path="/notificaciones" element={
        <ProtectedRoute allowedRoles={['OWNER', 'EMPLOYEE']}><NotificationsPage /></ProtectedRoute>
      } />
      <Route path="/cotizaciones" element={
        <ProtectedRoute allowedRoles={['OWNER', 'EMPLOYEE']}><QuotePage /></ProtectedRoute>
      } />
      <Route path="/cotizaciones/:id/editar" element={
        <ProtectedRoute allowedRoles={['OWNER', 'EMPLOYEE']}><QuotePage /></ProtectedRoute>
      } />
      <Route path="/cotizaciones/historial" element={
        <ProtectedRoute allowedRoles={['OWNER', 'EMPLOYEE']}><QuotesHistoryPage /></ProtectedRoute>
      } />
      <Route path="/stock" element={
        <ProtectedRoute allowedRoles={['OWNER', 'EMPLOYEE']}><StockPage /></ProtectedRoute>
      } />
      <Route path="/reports" element={
        <ProtectedRoute allowedRoles={['OWNER', 'EMPLOYEE']}><ReportsPage /></ProtectedRoute>
      } />

      {/* Balance: OWNER completo; EMPLOYEE con canViewCashClosing ve solo el cierre de caja */}
      <Route path="/reports/balance" element={
        <ProtectedRoute allowedRoles={['OWNER', 'EMPLOYEE']}><BalancePage /></ProtectedRoute>
      } />

      {/* OWNER only */}
      <Route path="/reports/sellers" element={
        <ProtectedRoute allowedRoles={['OWNER']}><SellerPerformancePage /></ProtectedRoute>
      } />
      {/* Análisis de clientes (tarea 250): OWNER y EMPLOYEE con canViewReports */}
      <Route path="/reports/customers" element={
        <ProtectedRoute allowedRoles={['OWNER', 'EMPLOYEE']}><CustomerRankingPage /></ProtectedRoute>
      } />
      <Route path="/reports/suppliers" element={
        <ProtectedRoute allowedRoles={['OWNER']}><SupplierAnalysisPage /></ProtectedRoute>
      } />
      {/* Compras y gastos (William, 10-oct): solo dueño, lleva costos */}
      <Route path="/reports/purchases" element={
        <ProtectedRoute allowedRoles={['OWNER']}><PurchasesPage /></ProtectedRoute>
      } />
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
      <Route path="/locations" element={
        <ProtectedRoute allowedRoles={['OWNER']}><LocationsPage /></ProtectedRoute>
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
      {/* Varios negocios por dueño (15-oct-2026): panel con la suma total y cambio de negocio */}
      <Route path="/negocios" element={
        <ProtectedRoute allowedRoles={['OWNER']}><MyBusinessesPage /></ProtectedRoute>
      } />
      {/* Settings — todos los roles autenticados */}
      <Route path="/settings" element={
        <ProtectedRoute allowedRoles={['OWNER', 'EMPLOYEE', 'SUPER_ADMIN']}><SettingsPage /></ProtectedRoute>
      } />
      {/* Legacy alias — redirect old path */}
      <Route path="/settings/users" element={<Navigate to="/empleados" replace />} />

      {/* BOSS only (el role llega normalizado a SUPER_ADMIN + isBoss) */}
      <Route path="/boss" element={
        <ProtectedRoute allowedRoles={['SUPER_ADMIN']}><BossPage /></ProtectedRoute>
      } />
      <Route path="/boss/suscripciones" element={
        <ProtectedRoute allowedRoles={['SUPER_ADMIN']}><SubscriptionsPage /></ProtectedRoute>
      } />
      <Route path="/boss/feedback" element={
        <ProtectedRoute allowedRoles={['SUPER_ADMIN']}><FeedbackPage /></ProtectedRoute>
      } />

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
