import { useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ShoppingCart } from 'lucide-react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import TutorialModal from '../components/tutorial/TutorialModal'
import { useAuth } from '../context/AuthContext'
import { useBusinessSocket } from '../hooks/useBusinessSocket'

function formatCurrency(v) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(v ?? 0)
}

export default function AppLayout({ children }) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [sidebarOpen,  setSidebarOpen]  = useState(false)
  const [showTutorial, setShowTutorial] = useState(false)

  // OWNERs receive real-time sale notifications from their employees
  useBusinessSocket(
    user?.role === 'OWNER' ? user?.businessId : null,
    (event) => {
      if (event.type !== 'NEW_SALE') return
      const sale  = event.payload
      const items = sale.items?.length ?? 0
      toast.success(`Nueva venta · ${formatCurrency(sale.total)}`, {
        description: `${sale.employeeName} · ${items} producto${items !== 1 ? 's' : ''}`,
        icon: <ShoppingCart size={16} />,
        duration: 6000,
      })
      queryClient.invalidateQueries({ queryKey: ['sales'] })
      queryClient.invalidateQueries({ queryKey: ['reports', 'daily-summary'] })
      queryClient.invalidateQueries({ queryKey: ['reports', 'sales'] })
    },
  )

  const tutorialKey = user ? `eazystock_tutorial_seen_${user.id ?? user.email}` : null

  // Show on first visit
  useEffect(() => {
    if (tutorialKey && !localStorage.getItem(tutorialKey)) {
      setShowTutorial(true)
    }
  }, [tutorialKey])

  // Listen for manual trigger from SettingsPage
  useEffect(() => {
    const handler = () => setShowTutorial(true)
    window.addEventListener('eazystock:show-tutorial', handler)
    return () => window.removeEventListener('eazystock:show-tutorial', handler)
  }, [])

  const closeTutorial = () => {
    if (tutorialKey) localStorage.setItem(tutorialKey, '1')
    setShowTutorial(false)
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-auto bg-gray-50 p-4 md:p-6">
          {children}
        </main>
      </div>
      {showTutorial && <TutorialModal onClose={closeTutorial} />}
    </div>
  )
}
