import { useEffect } from 'react'

/**
 * La landing tiene su propio diseño oscuro fijo: el mapa `html.dark` de la app
 * (index.css) NO debe tocarla — con él, «bg-white» se volvía gris oscuro y el
 * botón de «Iniciar sesión» quedaba con texto invisible (Frank, 2-sep). Se
 * quita la clase mientras la landing está montada y se restaura al salir según
 * lo guardado; el script pre-paint de index.html ya no la pone en «/» sin sesión.
 */
export function useNoAppDarkMode() {
  useEffect(() => {
    const html = document.documentElement
    html.classList.remove('dark')
    return () => {
      let dark = false
      try {
        const saved = localStorage.getItem('eazystock_theme')
        dark = saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches
      } catch { /* storage bloqueado */ }
      html.classList.toggle('dark', dark)
    }
  }, [])
}

