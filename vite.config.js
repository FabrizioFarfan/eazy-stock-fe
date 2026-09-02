import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Search Console (SEO, 2-sep-2026): si VITE_GOOGLE_SITE_VERIFICATION está en
 * el .env de esta máquina, se inyecta la meta de verificación en el <head>.
 * Sin la variable no se escribe nada.
 */
function siteVerification() {
  return {
    name: 'eazystock-site-verification',
    transformIndexHtml(html) {
      const code = process.env.VITE_GOOGLE_SITE_VERIFICATION
      if (!code) return html
      return html.replace('</head>', `    <meta name="google-site-verification" content="${code}" />\n  </head>`)
    },
  }
}

export default defineConfig({
  plugins: [react(), siteVerification()],
  define: {
    global: 'globalThis',
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:9393',
        changeOrigin: true,
      },
      '/ws': {
        target: 'http://localhost:9393',
        changeOrigin: true,
        ws: true,
      },
    },
  },
})
