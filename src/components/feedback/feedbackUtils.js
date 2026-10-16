import { dateLocale } from '../../i18n'

/**
 * Helpers sin JSX del feedback real (16-oct-2026): temas, estados, recompensas,
 * roles y formato de fecha. Las etiquetas son la llave de i18n (español); se
 * pasan por t() al pintar. Las usan Ajustes › Tu opinión y Boss › Feedback.
 */

export const TOPICS = ['IDEA', 'PROBLEMA', 'ME_GUSTA', 'OTRO']
export const TOPIC_LABEL = { IDEA: 'Idea', PROBLEMA: 'Problema', ME_GUSTA: 'Me gusta', OTRO: 'Otro' }

export const STATUSES = ['NEW', 'READ', 'REPLIED']
/** Como lo ve el usuario. */
export const STATUS_LABEL = { NEW: 'Enviado', READ: 'Leído', REPLIED: 'Respondido' }
/** Como lo ve el boss. */
export const BOSS_STATUS_LABEL = { NEW: 'Nuevo', READ: 'Leído', REPLIED: 'Respondido' }
export const STATUS_TONE = { NEW: 'blue', READ: 'gray', REPLIED: 'emerald' }

export const REWARDS = ['NONE', 'DESCUENTO_25', 'PRO_1_MES', 'OTRO']
export const REWARD_LABEL = {
  NONE: 'Ninguna',
  DESCUENTO_25: '25 % de descuento el mes siguiente',
  PRO_1_MES: '1 mes de PRO gratis',
  OTRO: 'Otra',
}

export const ROLE_LABEL = { OWNER: 'Dueño', EMPLOYEE: 'Vendedor', SUPER_ADMIN: 'Admin', BOSS: 'Boss' }

export function formatWhen(str) {
  if (!str) return '—'
  const d = new Date(str)
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat(dateLocale(), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(d)
}
