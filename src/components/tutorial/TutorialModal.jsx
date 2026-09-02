import { useState } from 'react'
import { ChevronRight, ChevronLeft, X } from 'lucide-react'
import { useT } from '../../i18n'
import { WELCOME_STEPS } from './guides'

/** `steps`: una guía de ./guides (por defecto, la bienvenida). `heading`: rótulo pequeño arriba. */
export default function TutorialModal({ onClose, steps = WELCOME_STEPS, heading }) {
  const t = useT()
  const STEPS = steps
  const [step, setStep] = useState(0)
  const current = STEPS[step]
  const Icon = current.icon
  const isLast = step === STEPS.length - 1

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden">

        {/* Close */}
        <div className="flex items-center justify-between px-4 pt-4">
          <span className="pl-1 text-[11px] font-semibold uppercase tracking-widest text-gray-500">{heading ? t(heading) : ''}</span>
          <button
            onClick={onClose}
            aria-label={t('Cerrar')}
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
          <h2 className="mb-2 text-xl font-bold text-gray-900">{t(current.title)}</h2>
          <p className="text-sm leading-relaxed text-gray-500">{t(current.desc)}</p>
        </div>

        {/* Step dots */}
        <div className="flex justify-center gap-1.5 pb-4">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              aria-label={t('Paso {n}', { n: i + 1 })}
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
            {step === 0 ? t('Omitir') : t('Atrás')}
          </button>

          <button
            onClick={() => isLast ? onClose() : setStep(step + 1)}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            {isLast ? t('¡Empezar!') : t('Siguiente')}
            {!isLast && <ChevronRight size={14} />}
          </button>
        </div>
      </div>
    </div>
  )
}
