import { Package } from 'lucide-react'
import { imageSrc } from '../../utils/productImage'

/**
 * Miniatura del producto para listas y buscadores. Pinta la foto pequeña
 * (`thumbUrl`, unos KB) o, si no hay, un cuadradito gris con el ícono de
 * paquete, siempre del mismo tamaño para que las filas no bailen.
 *
 * `size` en px. `loading="lazy"` para que una tabla de 20 filas no pida 20
 * fotos de golpe si están fuera de la pantalla.
 */
export default function ProductThumb({ product, size = 36, className = '', rounded = 'rounded-lg' }) {
  const src = imageSrc(product?.thumbUrl)
  const style = { width: size, height: size }
  if (!src) {
    return (
      <div style={style}
        className={`flex flex-shrink-0 items-center justify-center ${rounded} bg-gray-100 text-gray-300 ${className}`}
        aria-hidden="true">
        <Package size={Math.max(12, Math.round(size * 0.5))} />
      </div>
    )
  }
  return (
    <img src={src} alt={product?.name ?? ''} loading="lazy" decoding="async" style={style}
      className={`flex-shrink-0 ${rounded} border border-gray-100 bg-white object-cover ${className}`} />
  )
}
