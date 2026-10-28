import { t } from '../i18n'

// Mapa código BE → mensaje en español para el usuario (se traduce con t() al devolverlo).
// El BE lleva su propio mensaje en `data.message`; este mapa es el fallback
// cuando solo viene el code, o cuando queremos un mensaje uniforme en el FE.
const MESSAGE_BY_CODE = {
  DUPLICATE_RUC:           'Ya existe un proveedor con ese RUC',
  DUPLICATE_NAME:          'Ya existe un registro con ese nombre',
  DUPLICATE_SKU:           'Ya existe un producto con ese código',
  DUPLICATE_PROVIDER_CODE_FOR_SUPPLIER: 'Ya existe un producto con ese código de proveedor',
  DUPLICATE_PRODUCT_NAME:  'Ya tienes un producto con ese nombre',
  DUPLICATE_EMAIL:         'Ese email ya está registrado',
  TAX_ID_ALREADY_REGISTERED: 'Este documento ya tiene una cuenta en Eazy Stock. Si es tuyo, inicia sesión o escríbenos.',
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
  // Recuperar contraseña / confirmar correo (22-oct-2026)
  INVALID_TOKEN:           'Este enlace no es válido o ya venció. Pide uno nuevo.',
  TOO_MANY_REQUESTS:       'Ya te mandamos varios correos. Espera unos minutos y vuelve a intentar.',
  // Borrado de cuenta (24-oct-2026, API 1.14.0)
  WRONG_PASSWORD:            'La contraseña no es correcta.',
  BUSINESS_PENDING_DELETION: 'Este negocio está en proceso de baja.',
  // Confirmar el correo con código (API 1.16.0); la pantalla del código traduce por su cuenta (utils/emailCode.js)
  EMAIL_NOT_VERIFIED:        'Confirma tu correo para continuar.',
  INVALID_CODE:              'El código no es correcto.',
  CODE_LOCKED:               'Fallaste 5 veces. Pide un código nuevo.',
  CODE_EXPIRED:              'El código caducó. Pide uno nuevo.',
  RESEND_TOO_SOON:           'Espera unos segundos para pedir otro código.',
  // Planes: elegir al registrarse y bajar de plan (API 1.16.0)
  PLAN_NOT_AVAILABLE:        'El plan AI llega pronto: todavía no se puede elegir.',
  KEEP_SELECTION_REQUIRED:   'Elige qué negocios y trabajadores quedan activos con el plan nuevo.',
  KEEP_SELECTION_INVALID:    'Lo elegido no entra en el plan nuevo. Revisa los negocios y trabajadores marcados.',
  BUSINESS_LOCKED_BY_PLAN:   'Este negocio está en solo lectura por el límite de tu plan.',
  USER_DEACTIVATED_BY_PLAN:  'Tu usuario está desactivado. Habla con el dueño del negocio.',
  // Pagos con Stripe (API 1.17.0)
  PROMO_CODE_INVALID:        'Ese código no es válido o ya caducó.',
  COUPON_INVALID:            'Ese cupón no existe en Stripe o ya no es válido.',
  PAYMENT_FAILED:            'No pudimos cobrar la diferencia. Revisa tu tarjeta en «Gestionar pago».',
  // Cambiar el correo (API 1.18.0); el formulario traduce por su cuenta, con el campo (utils/emailChange.js)
  INVALID_EMAIL:             'Ese correo no es válido.',
  EMAIL_DISPOSABLE:          'Usa un correo permanente, no uno temporal.',
  SAME_EMAIL:                'Ese ya es tu correo.',
  EMAIL_ALREADY_REGISTERED:  'Ese correo ya tiene una cuenta en Eazy Stock.',
  TOO_MANY_EMAIL_CHANGES:    'Ya cambiaste el correo 3 veces hoy. Prueba de nuevo más tarde.',
  USE_EMAIL_CHANGE:          'El correo se cambia con «Cambiar correo»: te pedimos la contraseña y un código.',
}

/**
 * Devuelve un mensaje legible para mostrar al usuario a partir de un error de axios.
 * Prefiere `data.message` (mensaje específico del BE) sobre el código genérico.
 */
export function getErrorMessage(error) {
  const body = error?.response?.data
  if (body?.message) return body.message
  if (body?.code && MESSAGE_BY_CODE[body.code]) return t(MESSAGE_BY_CODE[body.code])
  if (error?.message) return error.message
  return t('Ocurrió un error inesperado. Intentá de nuevo.')
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
