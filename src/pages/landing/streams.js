// Trazados de las corrientes del fondo (HeroBackdrop) por sección. Archivo propio para
// que shared.jsx solo exporte componentes (react-refresh).
// Corrientes por los BORDES de una sección (20-oct-2026, Frank: «que estén detrás de los
// botones, no del texto»): una arriba del titular y dos por abajo, donde van los botones.
export const STREAMS_EDGES = [
  'M-60 70 C 300 10, 560 130, 860 95 S 1250 30, 1500 60',
  'M-60 620 C 340 690, 620 540, 900 590 S 1250 670, 1500 610',
  'M-60 800 C 400 860, 700 740, 950 790 S 1300 850, 1500 800',
]
// CTA final: la del medio pasa justo por detrás de los botones (y≈440-500 en 1440×900).
export const STREAMS_CTA = [
  'M-60 110 C 300 40, 560 150, 860 120 S 1250 60, 1500 90',
  'M-60 430 C 300 520, 560 440, 860 490 S 1250 520, 1500 470',
  'M-60 640 C 340 700, 620 580, 900 620 S 1250 680, 1500 640',
]
