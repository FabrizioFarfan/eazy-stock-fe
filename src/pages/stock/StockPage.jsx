import { useState } from 'react'
import { PackagePlus, SlidersHorizontal, ArrowUpDown } from 'lucide-react'
import PageTitle from '../../components/common/PageTitle'
import HelpDrawer from '../../components/common/HelpDrawer'
import { useAuth } from '../../context/AuthContext'
import MovementModal from './MovementModal'
import SupplierReceiptModal from '../../components/stock/SupplierReceiptModal'
import InventoryTab from '../../components/stock/InventoryTab'
import ReceiptsTab from '../../components/stock/ReceiptsTab'
import MovementsTab from '../../components/stock/MovementsTab'

const TABS = [
  { id: 'movements',  label: 'Movimientos' },
  { id: 'inventory',  label: 'Inventario' },
  { id: 'receipts',   label: 'Recepciones' },
]

export default function StockPage() {
  const { user }  = useAuth()
  const isManager = user?.role === 'OWNER' || user?.role === 'SUPER_ADMIN'

  const [activeTab, setActiveTab]       = useState('movements')
  const [modal, setModal]               = useState(null) // null | 'ADJUSTMENT'
  const [showReceiptModal, setShowReceiptModal] = useState(false)

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <PageTitle icon={ArrowUpDown} tone="amber">Stock</PageTitle>
          <HelpDrawer title="Cómo usar la página Stock" autoOpenKey="eazystock_stock_help_v1">
            <p>
              Esta página tiene <strong>3 pestañas</strong>, cada una responde una pregunta distinta:
            </p>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <p className="font-semibold text-gray-800">📋 Movimientos</p>
              <p className="mt-1">
                El <strong>historial completo</strong> de todo lo que entró y salió del almacén:
                ventas, entradas de mercadería, ajustes y devoluciones. Responde
                <em> "¿qué pasó con mi stock y cuándo?"</em>. Si un número no te cuadra,
                acá está la trazabilidad.
              </p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <p className="font-semibold text-gray-800">📦 Inventario</p>
              <p className="mt-1">
                La <strong>foto actual</strong> de tus productos: cuánto stock queda de cada uno,
                su mínimo y su último costo. Responde <em>"¿cuánto tengo hoy?"</em>.
                Haz click en cualquier fila para ver el detalle del producto y desde ahí
                <strong> registrar una entrada o ajustar el stock</strong> directamente.
              </p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <p className="font-semibold text-gray-800">🚚 Recepciones</p>
              <p className="mt-1">
                Las <strong>compras de mercadería a tus proveedores</strong>. Cada recepción
                registra qué productos llegaron, a qué costo y cómo se pagó:
                <strong> al contado</strong> (no genera deuda) o <strong>a crédito</strong>
                (se suma a la cuenta por pagar del proveedor — la ves en Cuentas).
                Responde <em>"¿qué me llegó y qué le debo a cada proveedor?"</em>.
              </p>
            </div>
            <p className="text-xs text-gray-400">
              Tip: "Registrar recepción" es la forma correcta de ingresar mercadería comprada
              (actualiza stock, costo y deuda de una vez). "Ajuste" es solo para corregir
              diferencias del inventario físico.
            </p>
          </HelpDrawer>
        </div>
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
