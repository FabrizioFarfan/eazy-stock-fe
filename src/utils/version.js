// Versión de la app: la inyecta Vite desde package.json (vite.config.js → define).
// REGLA (Frank, 3-oct-2026): cada tanda desplegada sube la versión en package.json;
// aquí nunca se escribe un número a mano.
export const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev'
