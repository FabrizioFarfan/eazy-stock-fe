/**
 * Fotos de producto.
 *
 * El BE devuelve rutas RELATIVAS al origen de la API (`/uploads/products/...`):
 * `imageSrc()` las convierte en URL absoluta. En dev (Vite) el proxy solo
 * reescribe /api y /ws, así que apuntamos al origen del BE directamente.
 */
const API_ORIGIN = (() => {
  const ws = import.meta.env.VITE_WS_URL
  if (ws) return ws.replace(/\/$/, '')
  const api = import.meta.env.VITE_API_URL ?? '/api'
  if (/^https?:\/\//.test(api)) return api.replace(/\/api\/?$/, '')
  return ''
})()

export function imageSrc(path) {
  if (!path) return null
  if (/^https?:\/\//.test(path)) return path
  return `${API_ORIGIN}${path}`
}

/**
 * Reduce la foto EN EL CELULAR antes de subirla: una foto de cámara pesa 3-8 MB
 * y en 4G tarda; reducida a 1280 px y JPEG 0.85 queda en ~150-300 KB con la
 * misma nitidez para una ficha de producto. Además normaliza formatos que el
 * BE no sabe leer (HEIC del iPhone, WEBP) porque el navegador sí los decodifica.
 *
 * Respeta la orientación EXIF (createImageBitmap con imageOrientation, o el
 * <img> del navegador que ya la aplica por defecto).
 */
export async function shrinkImage(file, { maxPx = 1280, quality = 0.85 } = {}) {
  const bitmap = await loadBitmap(file)
  const { width, height } = bitmap
  const scale = Math.min(1, maxPx / Math.max(width, height))
  const w = Math.max(1, Math.round(width * scale))
  const h = Math.max(1, Math.round(height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#ffffff'          // PNG con transparencia → fondo blanco
  ctx.fillRect(0, 0, w, h)
  ctx.drawImage(bitmap, 0, 0, w, h)
  bitmap.close?.()

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('No se pudo procesar la imagen'))), 'image/jpeg', quality)
  })
  const base = (file.name || 'foto').replace(/\.[^.]+$/, '')
  return new File([blob], `${base}.jpg`, { type: 'image/jpeg' })
}

async function loadBitmap(file) {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' })
    } catch { /* formato raro o navegador viejo: caemos al <img> */ }
  }
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => { URL.revokeObjectURL(url); resolve(img) }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('No se pudo leer la imagen')) }
    img.src = url
  })
}
