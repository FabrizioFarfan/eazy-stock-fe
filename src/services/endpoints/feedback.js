import api from '../api'

/**
 * Feedback real (Frank, 16-oct-2026): el usuario escribe desde Ajustes › Tu opinión
 * (cualquier rol, también con el plan vencido) y el boss lo trabaja en Boss › Feedback.
 */
export const feedbackApi = {
  // [{ id, rating, topic, message, wantsContact, status: 'NEW'|'READ'|'REPLIED', bossReply, createdAt, repliedAt }]
  getMyFeedback: () => api.get('/me/feedback'),
  // { rating?: 1..5, topic?: 'IDEA'|'PROBLEMA'|'ME_GUSTA'|'OTRO', message, wantsContact }
  sendFeedback:  (data) => api.post('/me/feedback', data),

  // ── Boss ──
  // [{ ...feedback, bossNote, reward, rewardNote, businessId, businessName, businessPhone, countryCode,
  //    ownerId, ownerName, ownerEmail, authorId, authorName, authorEmail, authorRole, subscriptionStatus, subscriptionPlan }]
  bossListFeedback:    (params) => api.get('/boss/feedback', { params }),   // { status? }
  bossFeedbackSummary: () => api.get('/boss/feedback/summary'),             // { newCount, total, avgRating }
  // { status?, bossReply?, bossNote?, reward?: 'NONE'|'DESCUENTO_25'|'PRO_1_MES'|'OTRO', rewardNote? }
  bossUpdateFeedback:  (id, data) => api.patch(`/boss/feedback/${id}`, data),
}
