import { useState } from 'react'
import { PackagePlus, SlidersHorizontal } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import MovementModal from './MovementModal'
import SupplierReceiptModal from '../../components/stock/SupplierReceiptModal'
import InventoryTab from '../../components/stock/InventoryTab'
import ReceiptsTab from '../../components/stock/ReceiptsTab'
import MovementsTab from '../../components/stock/MovementsTab'

const TABS = [
  { id: 'inventory',  label: 'Inventario' },
  { id: 'receipts',   label: 'Recepciones recientes' },
  { id: 'movements',  label: 'Movimientos' },
]

export default function StockPage() {
  const { user }  = useAuth()
  const isManager = user?.role === 'OWNER' || user?.role === 'SUPER_ADMIN'

  const [activeTab, setActiveTab]       = useState('inventory')
  const [modal, setModal]               = useState(null) // null | 'ADJUSTMENT'
  const [showReceiptModal, setShowReceiptModal] = useState(false)

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-gray-900">Stock</h2>
        {isManager && (
          <div className="flex gap-2">
            <button onClick={() => setShowReceiptModal(true)}
              className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-emerald-500/30 hover:bg-emerald-600 transition-all active:scale-[0.98]">
              <PackagePlus size={15} />
              Registrar recepción
            </button>
            <button onClick={() => setModal('ADJUSTMENT')}
              className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
              <SlidersHorizontal size={15} />
              Ajuste
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-gray-200 bg-gray-100 p-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'inventory' && <InventoryTab />}
      {activeTab === 'receipts'  && <ReceiptsTab />}
      {activeTab === 'movements' && <MovementsTab />}

      {modal && <MovementModal type={modal} onClose={() => setModal(null)} />}
      {showReceiptModal && <SupplierReceiptModal onClose={() => setShowReceiptModal(false)} />}
    </div>
  )
}
