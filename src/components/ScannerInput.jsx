import { useEffect, useRef, useState } from 'react'
import { Camera, CameraOff, Search } from 'lucide-react'

/**
 * Search input with physical barcode scanner + optional camera scanning.
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

  const videoRef        = useRef(null)
  const streamRef       = useRef(null)
  const detectorRef     = useRef(null)
  const scanIntervalRef = useRef(null)

  // Detect support once — needs both getUserMedia and BarcodeDetector
  useEffect(() => {
    const supported =
      !!navigator.mediaDevices?.getUserMedia &&
      typeof window.BarcodeDetector !== 'undefined'
    setHasCameraSupport(supported)
  }, [])

  // Always stop the camera stream on unmount
  useEffect(() => {
    return () => stopCamera()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setCameraOpen(false)
  }

  const openCamera = async () => {
    try {
      // Request permission — prompts the browser dialog on first call
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      })
      streamRef.current = stream
      videoRef.current.srcObject = stream
      await videoRef.current.play()
      setCameraOpen(true)

      detectorRef.current = new window.BarcodeDetector({
        formats: ['qr_code', 'code_128', 'ean_13', 'ean_8', 'code_39', 'upc_a', 'upc_e'],
      })

      // Poll a video frame every 500 ms
      scanIntervalRef.current = setInterval(async () => {
        if (!videoRef.current || !detectorRef.current) return
        try {
          const barcodes = await detectorRef.current.detect(videoRef.current)
          if (barcodes.length > 0) {
            const code = barcodes[0].rawValue
            stopCamera()
            onScan(code)
          }
        } catch {
          // frame not ready yet — ignore
        }
      }, 500)
    } catch {
      // Permission denied or device unavailable — fail silently
    }
  }

  // Physical scanner sends rapid keystrokes and finishes with Enter
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
            className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-3 text-sm text-gray-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
            autoFocus
          />
        </div>

        {/* Camera button — only rendered when browser supports it */}
        {hasCameraSupport && (
          <button
            type="button"
            onClick={cameraOpen ? stopCamera : openCamera}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
              cameraOpen
                ? 'bg-orange-100 text-orange-600 hover:bg-orange-200'
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
          <div className="relative overflow-hidden rounded-xl border border-orange-200 bg-black">
            <video
              ref={videoRef}
              className="w-full"
              style={{ maxHeight: 220 }}
              playsInline
              muted
            />
            {/* Scan-guide overlay */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="h-32 w-56 rounded border-2 border-orange-400 opacity-80" />
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
