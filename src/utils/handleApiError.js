// Mapa código BE → mensaje en español para el usuario.
// El BE lleva su propio mensaje en `data.message`; este mapa es el fallback
// cuando solo viene el code, o cuando queremos un mensaje uniforme en el FE.
const MESSAGE_BY_CODE = {
  DUPLICATE_RUC:           'Ya existe un proveedor con ese RUC',
  DUPLICATE_NAME:          'Ya existe un registro con ese nombre',
  DUPLICATE_SKU:           'Ya existe un producto con ese código',
  DUPLICATE_PROVIDER_CODE_FOR_SUPPLIER: 'Ya existe un producto con ese código de proveedor',
  DUPLICATE_EMAIL:         'Ese email ya está registrado',
  DUPLICATE_TAX_ID:        'Ya existe un negocio con ese tax ID',
  INVALID_RUC_FORMAT:      'El RUC debe tener 11 dígitos',
  INVALID_EMAIL_FORMAT:    'El email no es válido',
  INVALID_CATEGORY:        'La categoría seleccionada no es válida',
  INVALID_SUPPLIER:        'El proveedor seleccionado no es válido',
  INVALID_BRAND:           'La marca seleccionada no es válida',
  INVALID_ATTRIBUTES_JSON: 'Los atributos del producto tienen un formato inválido',
  NEGATIVE_PRICE:          'Los precios no pueden ser negativos',
  WEAK_PASSWORD:           'La contraseña debe tener al menos 6 caracteres',
  INVALID_FIELD:           'Uno de los campos enviados es inválido',
  SESSION_EXPIRED:         'Tu sesión expiró, por favor iniciá sesión de nuevo',
  FORBIDDEN_BY_PERMISSION: 'No tenés permiso para realizar esta acción',
  FORBIDDEN:               'Acceso denegado',
  NOT_FOUND:               'Recurso no encontrado',
  LINKED_RESOURCE:         'No se puede eliminar: hay registros asociados',
  INTERNAL_ERROR:          'Ocurrió un error inesperado. Intentá de nuevo.',
}

/**
 * Devuelve un mensaje legible para mostrar al usuario a partir de un error de axios.
 * Prefiere `data.message` (mensaje específico del BE) sobre el código genérico.
 */
export function getErrorMessage(error) {
  const body = error?.response?.data
  if (body?.message) return body.message
  if (body?.code && MESSAGE_BY_CODE[body.code]) return MESSAGE_BY_CODE[body.code]
  if (error?.message) return error.message
  return 'Ocurrió un error inesperado. Intentá de nuevo.'
}

/** Devuelve el `code` estructurado del BE si está disponible. */
export function getErrorCode(error) {
  return error?.response?.data?.code ?? null
}

/** Devuelve el `field` que el BE marcó como problemático, si está disponible. */
export function getErrorField(error) {
  return error?.response?.data?.field ?? null
}

export function isSessionExpired(error) {
  return getErrorCode(error) === 'SESSION_EXPIRED'
}
