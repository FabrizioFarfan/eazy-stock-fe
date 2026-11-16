// El WhatsApp de Eazy Life para la web pública: un solo sitio para el número.

/** Como lo quiere wa.me: solo dígitos con prefijo. */
export const WHATSAPP_NUMBER = '4915511384643'

/** Como se enseña a la gente. */
export const WHATSAPP_DISPLAY = '+49 155 11384643'

/** Enlace que abre el chat con el texto ya escrito. */
export function whatsappLink(text) {
  const base = `https://wa.me/${WHATSAPP_NUMBER}`
  return text ? `${base}?text=${encodeURIComponent(text)}` : base
}
