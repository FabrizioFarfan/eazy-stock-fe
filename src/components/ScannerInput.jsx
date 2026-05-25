import { useEffect, useRef, useState } from 'react'
import { Camera, CameraOff, Search } from 'lucide-react'

/**
 * Search input with physical barcode scanner + optional camera scanning.
 *
 * Camera detection strategy:
 *   1. Native BarcodeDetector (Chrome/Edge)    — polling via recursive setTimeout
 *   2. @zxing/browser BrowserMultiFormatReader — Safari, Firefox, all others
 *   Camera button is hidden if getUserMedia is not supported at all.
 *
 * Props:
 *   value       {string}    Controlled text value (for debounced text search)
 *   onChange    {function}  Called on every keystroke (text search)
 *   onScan      {function}  Called with the final code string (Enter key or camera detect)
 *   placeholder {string}
 */
export default function ScannerInput({ value, onChange, onScan, placeholder }) {
  const [hasCameraSupport, setHasCameraSupport] = useState(false)
  const [cameraOpen, setCameraOpen] = useState(false)

  const videoRef       = useRef(null)
  const streamRef      = useRef(null)
  const detectorRef    = useRef(null)  // BarcodeDetector | BrowserMultiFormatReader
  const scanTimeoutRef = useRef(null)  // BarcodeDetector path only
  const sessionRef     = useRef(0)     // increments each openCamera; stale callbacks see wrong value → ignored
  const onScanRef      = useRef(onScan)

  // Always keep onScanRef current so closures call the latest version (avoids stale cartIds)
  useEffect(() => { onScanRef.current = onScan })

  useEffect(() => {
    setHasCameraSupport(!!navigator.mediaDevices?.getUserMedia)
  }, [])

  useEffect(() => {
    return () => stopCamera()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const stopCamera = () => {
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current)
      scanTimeoutRef.current = null
    }
    detectorRef.current?.reset?.()
    detectorRef.current = null

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) videoRef.current.srcObject = null
    setCameraOpen(false)
  }

  const openCamera = async () => {
    try {
      sessionRef.current++                    // new session — old callbacks see a different number and bail
      const mySession = sessionRef.current

      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      streamRef.current = stream
      videoRef.current.srcObject = stream
      await videoRef.current.play()
      setCameraOpen(true)

      if (typeof window.BarcodeDetector !== 'undefined') {
        // ── Path 1: Native BarcodeDetector (Chrome / Edge) ──────────────────
        detectorRef.current = new window.BarcodeDetector({
          formats: ['qr_code', 'code_128', 'ean_13', 'ean_8', 'code_39', 'upc_a', 'upc_e'],
        })

        const scheduleScan = () => {
          scanTimeoutRef.current = setTimeout(async () => {
            if (sessionRef.current !== mySession || !videoRef.current || !detectorRef.current) return
            try {
              const barcodes = await detectorRef.current.detect(videoRef.current)
              if (barcodes.length > 0) {
                sessionRef.current++            // invalidate — no more callbacks for this session
                stopCamera()
                onScanRef.current(barcodes[0].rawValue)
                return
              }
            } catch { /* frame not ready */ }
            if (sessionRef.current === mySession) scheduleScan()
          }, 300)
        }
        scheduleScan()

      } else {
        // ── Path 2: @zxing/browser (Safari, Firefox, all others) ─────────────
        const { BrowserMultiFormatReader } = await import('@zxing/browser')
        const reader = new BrowserMultiFormatReader()
        detectorRef.current = reader

        reader.decodeFromVideoElement(videoRef.current, (result) => {
          if (result && sessionRef.current === mySession) {
            sessionRef.current++                // invalidate — ZXing may still fire; they'll bail
            stopCamera()
            onScanRef.current(result.getText())
          }
        })
      }
    } catch {
      // Permission denied or device unavailable — fail silently
    }
  }

  // Physical scanner: sends rapid keystrokes ending with Enter
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && value.trim()) {
      e.preventDefault()
      const code = value.trim()
      onChange('')
      onScan(code)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Input row */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-3 text-sm text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
            autoFocus
          />
        </div>

        {/* Camera button — only rendered when browser supports getUserMedia */}
        {hasCameraSupport && (
          <button
            type="button"
            onClick={cameraOpen ? stopCamera : openCamera}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
              cameraOpen
                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {cameraOpen ? <CameraOff size={15} /> : <Camera size={15} />}
            {cameraOpen ? 'Cerrar' : 'Cámara'}
          </button>
        )}
      </div>

      {/* Camera viewport — kept in DOM so videoRef stays valid; hidden via CSS when closed */}
      {hasCameraSupport && (
        <div className={cameraOpen ? 'block' : 'hidden'}>
          <div className="relative overflow-hidden rounded-xl border border-blue-200 bg-black">
            <video
              ref={videoRef}
              className="w-full"
              style={{ maxHeight: 220 }}
              playsInline
              muted
            />
            {/* Scan-guide overlay */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="h-32 w-56 rounded border-2 border-blue-500 opacity-80" />
            </div>
          </div>
          <p className="mt-1 text-center text-xs text-gray-400">
            Apunta la cámara al código de barras o QR
          </p>
        </div>
      )}
    </div>
  )
}
