import api from '../api'

export const bossApi = {
  getActivity: () => api.get('/boss/activity'),
  // { serverTime, businesses: [{ id, name, countryCode, active, createdAt,
  //   salesLast7Days, lastSaleAt, users: [{ id, name, email, role, active, lastSeenAt }] }] }
}
