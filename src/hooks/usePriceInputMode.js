import { useSyncExternalStore } from 'react'

// Cómo el cajero tipea los precios:
//   'split'      → dos casillas, parte entera "." decimales (lo nuevo)
//   'calculator' → estilo calculadora de POS: tipeás "1150" y se muestra "11.50",
//                  los decimales se llenan solos de derecha a izquierda (lo viejo,
//                  la "domestiquez" que ya tienen algunos usuarios).
//
// La preferencia se guarda en localStorage y se sincroniza entre todas las
// instancias de PriceInput (y entre pestañas) vía evento.

const KEY   = 'eazystock.priceInputMode'
const EVENT = 'eazystock:priceInputMode'
const VALID = ['split', 'calculator']
const DEFAULT = 'split'

function read() {
  try {
    const v = localStorage.getItem(KEY)
    return VALID.includes(v) ? v : DEFAULT
  } catch {
    return DEFAULT
  }
}

function subscribe(callback) {
  window.addEventListener(EVENT, callback)
  window.addEventListener('storage', callback) // otras pestañas
  return () => {
    window.removeEventListener(EVENT, callback)
    window.removeEventListener('storage', callback)
  }
}

export function setPriceInputMode(mode) {
  const next = VALID.includes(mode) ? mode : DEFAULT
  try {
    localStorage.setItem(KEY, next)
  } catch {
    /* localStorage no disponible — el modo sigue funcionando en memoria */
  }
  window.dispatchEvent(new Event(EVENT))
}

export function usePriceInputMode() {
  const mode = useSyncExternalStore(subscribe, read, () => DEFAULT)
  return [mode, setPriceInputMode]
}
