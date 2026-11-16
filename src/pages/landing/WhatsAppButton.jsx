import { useT } from '../../i18n'
import { WHATSAPP_DISPLAY, whatsappLink } from './contact'

/** El logo de WhatsApp (la burbuja con el teléfono), para que se reconozca de un vistazo. */
export function WhatsAppIcon({ size = 20, className = '' }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true" className={className}>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.87 9.87 0 0 0 4.74 1.21h.01c5.46 0 9.9-4.45 9.9-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 1.67c2.2 0 4.27.86 5.82 2.42a8.2 8.2 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24ZM8.53 7.33c-.16 0-.43.06-.66.31-.22.25-.87.85-.87 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.07-.1-.23-.16-.48-.29-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.25-.64.81-.78.97-.15.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.38-1.72-.15-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.43-.06-.13-.56-1.35-.77-1.85-.2-.49-.4-.42-.56-.43h-.45Z" />
    </svg>
  )
}

/**
 * Botón verde grande de WhatsApp con el número debajo: la otra forma de empezar, para quien
 * prefiere preguntarle a una persona antes de registrarse.
 */
export function WhatsAppCta({ track, testId, className = '' }) {
  const t = useT()
  return (
    <a
      href={whatsappLink(t('Hola, vi Eazy Stock y tengo una pregunta.'))}
      target="_blank" rel="noopener noreferrer"
      data-track={track} data-testid={testId}
      className={`lp-btn-wa flex w-full items-center justify-center gap-2.5 rounded-xl px-6 py-2.5 text-white sm:w-auto ${className}`}
    >
      <WhatsAppIcon size={22} className="flex-shrink-0" />
      <span className="flex flex-col items-start leading-tight">
        <span className="text-sm font-bold">{t('Escríbenos por WhatsApp')}</span>
        <span className="text-[11px] font-semibold tabular-nums text-emerald-50/90">{WHATSAPP_DISPLAY}</span>
      </span>
    </a>
  )
}

/** Botón flotante abajo a la derecha, en todas las páginas públicas. */
export function WhatsAppFloat() {
  const t = useT()
  return (
    <a
      href={whatsappLink(t('Hola, vi Eazy Stock y tengo una pregunta.'))}
      target="_blank" rel="noopener noreferrer"
      data-track="float_whatsapp" data-testid="float-whatsapp"
      aria-label={t('Escríbenos por WhatsApp')}
      className="lp-wa-float group fixed bottom-4 right-4 z-40 flex items-center gap-2.5 rounded-full bg-[#25D366] p-3.5 text-white shadow-xl shadow-emerald-900/30 transition-transform hover:scale-105 sm:bottom-6 sm:right-6 sm:py-3 sm:pl-4 sm:pr-5"
    >
      <WhatsAppIcon size={26} className="flex-shrink-0" />
      <span className="hidden flex-col leading-tight sm:flex">
        <span className="text-sm font-bold">{t('¿Dudas? Escríbenos')}</span>
        <span className="text-[11px] font-semibold tabular-nums text-emerald-50/90">{WHATSAPP_DISPLAY}</span>
      </span>
    </a>
  )
}
