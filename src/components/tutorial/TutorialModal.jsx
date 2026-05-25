import { useState } from 'react'
import { Package, ShoppingCart, ArrowUpDown, BarChart2, Sparkles, ChevronRight, ChevronLeft, X } from 'lucide-react'

const STEPS = [
  {
    icon: Sparkles,
    color: 'bg-blue-600',
    title: '¡Bienvenido a Eazy Stock!',
    desc: 'Todo lo que necesitas para gestionar el inventario y ventas de tu negocio en un solo lugar, fácil y rápido.',
  },
  {
    icon: Package,
    color: 'bg-blue-500',
    title: 'Gestiona tus productos',
    desc: 'Agrega productos con precio de compra, venta y stock mínimo. Asígnales proveedor y marca para organizar mejor tu catálogo.',
  },
  {
    icon: ShoppingCart,
    color: 'bg-green-500',
    title: 'Registra ventas rápido',
    desc: 'Desde "Nueva Venta" busca productos por nombre, SKU o código QR, aplica descuentos y completa la venta en segundos.',
  },
  {
    icon: ArrowUpDown,
    color: 'bg-purple-500',
    title: 'Controla tu stock',
    desc: 'Recibe mercadería, ajusta el stock manualmente y recibe alertas automáticas cuando un producto baja del mínimo.',
  },
  {
    icon: BarChart2,
    color: 'bg-rose-500',
    title: 'Analiza tu negocio',
    desc: 'En Reportes ve las ventas por día, los productos más vendidos y filtra por proveedor, marca o empleado.',
  },
]

export default function TutorialModal({ onClose }) {
  const [step, setStep] = useState(0)
  const current = STEPS[step]
  const Icon = current.icon
  const isLast = step === STEPS.length - 1

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden">

        {/* Close */}
        <div className="flex justify-end px-4 pt-4">
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col items-center px-8 pb-6 pt-2 text-center">
          {/* Icon */}
          <div className={`mb-5 flex h-16 w-16 items-center justify-center rounded-2xl ${current.color}`}>
            <Icon size={32} className="text-white" />
          </div>

          {/* Text */}
          <h2 className="mb-2 text-xl font-bold text-gray-900">{current.title}</h2>
          <p className="text-sm leading-relaxed text-gray-500">{current.desc}</p>
        </div>

        {/* Step dots */}
        <div className="flex justify-center gap-1.5 pb-4">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? 'w-6 bg-blue-600' : 'w-1.5 bg-gray-300'
              }`}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3">
          <button
            onClick={() => step > 0 ? setStep(step - 1) : onClose()}
            className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-100"
          >
            {step > 0 && <ChevronLeft size={14} />}
            {step === 0 ? 'Omitir' : 'Atrás'}
          </button>

          <button
            onClick={() => isLast ? onClose() : setStep(step + 1)}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            {isLast ? '¡Empezar!' : 'Siguiente'}
            {!isLast && <ChevronRight size={14} />}
          </button>
        </div>
      </div>
    </div>
  )
}
