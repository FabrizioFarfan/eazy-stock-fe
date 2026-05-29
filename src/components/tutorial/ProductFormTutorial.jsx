import { useState } from 'react'
import {
  Package, FileText, Search, Tag, Sliders, DollarSign, Sparkles,
  ChevronRight, ChevronLeft, X,
} from 'lucide-react'

/**
 * Tutorial específico para el modal de "Nuevo producto".
 * Apuntado a usuarios que se confunden con los pickers (marca/proveedor/
 * categoría) y con la sección de atributos.
 *
 * Se abre desde:
 *  - El botón "?" en el header del ProductFormModal
 *  - Ajustes → Ayuda → "Cómo agregar un producto"
 *  - Auto: la primera vez que un usuario OWNER/EMPLOYEE con permisos abre
 *    el ProductFormModal (controlado en ProductFormModal via localStorage).
 */
const STEPS = [
  {
    icon: Package,
    color: 'bg-blue-600',
    title: 'Cómo agregar un producto',
    desc: 'Te guiamos por los campos del formulario para que no te pierdas. Podés volver a abrir este tutorial cuando quieras desde Ajustes.',
  },
  {
    icon: FileText,
    color: 'bg-slate-500',
    title: 'Empezá por nombre y unidad',
    desc: 'Escribí el nombre del producto (ej. "Aceite 5W30", "Clavos de 2 pulgadas") y la unidad en la que lo vendés: litros, kg, metros, unidad, galón... estos dos campos son obligatorios.',
  },
  {
    icon: Tag,
    color: 'bg-indigo-500',
    title: 'Marca, Proveedor y Categoría: cuál es cuál',
    desc: 'Tres cosas distintas. Marca es el fabricante (Bosch, 3M, Stanley). Proveedor es a quién le comprás vos (Distribuidora Lima SAC, Ferreconstruye). Categoría es el tipo de producto (Tornillería, Pinturas, Herramientas).',
  },
  {
    icon: Search,
    color: 'bg-emerald-500',
    title: 'Buscar o crear sobre la marcha',
    desc: 'En los tres campos funciona igual: escribí en el buscador. Si ya existe, hacé clic en el chip azul. Si no aparece, tocá "Nuevo proveedor / Nueva marca / Nueva categoría" y lo creás sin salir del formulario.',
  },
  {
    icon: Sliders,
    color: 'bg-violet-500',
    title: 'Atributos: lo que distingue al producto',
    desc: 'Acá ponés lo que diferencia a ESTE producto del resto. Color, tamaño, material, peso, voltaje, presentación... lo que quieras. Tocá los chips grises de "atributos sugeridos" o agregá los tuyos en "Atributo / Valor".',
  },
  {
    icon: Sliders,
    color: 'bg-violet-400',
    title: 'Ejemplos de atributos',
    desc: 'Clavos → material: acero, longitud: 2"  ·  Pintura → color: blanco, capacidad: 1 galón  ·  Cable → calibre: 14 AWG, color: rojo. Sin atributos también funciona — son opcionales.',
  },
  {
    icon: DollarSign,
    color: 'bg-amber-500',
    title: 'Precios y stock mínimo',
    desc: 'P. compra es lo que pagás. P. venta es lo que cobrás. En los precios solo tipeás dígitos: "1150" se muestra "11.50" automáticamente. Stock mínimo dispara una alerta cuando el producto se acerca a esa cantidad.',
  },
  {
    icon: Sparkles,
    color: 'bg-green-500',
    title: '¡Listo para guardar!',
    desc: 'Tocá Guardar y el sistema le asigna un código (SKU) automáticamente. Vas a poder verlo en la lista de Productos al toque.',
  },
]

export default function ProductFormTutorial({ onClose }) {
  const [step, setStep] = useState(0)
  const current = STEPS[step]
  const Icon = current.icon
  const isLast = step === STEPS.length - 1

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
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
          <div className={`mb-5 flex h-16 w-16 items-center justify-center rounded-2xl ${current.color}`}>
            <Icon size={32} className="text-white" />
          </div>

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
            {isLast ? '¡Entendido!' : 'Siguiente'}
            {!isLast && <ChevronRight size={14} />}
          </button>
        </div>
      </div>
    </div>
  )
}
