// Instalación de la PWA desde la propia UI.
//
// El navegador dispara `beforeinstallprompt` UNA vez y muy temprano (puede ser
// antes de que React monte), así que la captura vive a nivel de módulo y
// main.jsx importa este archivo antes de renderizar. El hook expone el estado
// a React vía useSyncExternalStore.
import { useSyncExternalStore } from 'react'

let deferredPrompt = null
let installed = false
let snapshot = null

const listeners = new Set()
const notify = () => {
  snapshot = null
  listeners.forEach((fn) => fn())
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt = e
    notify()
  })
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    installed = true
    notify()
  })
}

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  window.navigator.standalone === true // Safari iOS

const isIOS = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  // iPadOS se hace pasar por Mac de escritorio
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

const getSnapshot = () => {
  if (!snapshot) {
    snapshot = {
      canPrompt: deferredPrompt != null,
      installed: installed || isStandalone(),
      ios: isIOS(),
    }
  }
  return snapshot
}

const subscribe = (fn) => {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

// Lanza el diálogo nativo de instalación. Devuelve 'accepted' | 'dismissed' | null.
export async function promptInstall() {
  if (!deferredPrompt) return null
  const promptEvent = deferredPrompt
  deferredPrompt = null // el evento solo se puede usar una vez
  notify()
  promptEvent.prompt()
  const { outcome } = await promptEvent.userChoice
  return outcome
}

export function useInstallApp() {
  return useSyncExternalStore(subscribe, getSnapshot)
}
