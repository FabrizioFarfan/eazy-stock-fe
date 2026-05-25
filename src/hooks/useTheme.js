import { useEffect, useState } from 'react'

const KEY = 'eazystock_theme'

export function useTheme() {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem(KEY)
    if (saved) return saved === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    localStorage.setItem(KEY, isDark ? 'dark' : 'light')
  }, [isDark])

  const toggle = () => setIsDark((d) => !d)

  return { isDark, toggle }
}
