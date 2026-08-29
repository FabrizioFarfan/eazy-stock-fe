// Borrador de cotización en localStorage (por usuario). Lo escriben QuotePage
// (autosave) y el historial («Duplicar»); lo lee QuotePage al entrar.
export const quoteDraftKey = (userId) => `eazystock_quote_draft_${userId || 'anon'}`
