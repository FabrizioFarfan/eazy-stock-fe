import api from '../api'

export const getMyPermissions = () =>
  api.get('/me/permissions').then((r) => r.data.data)

export const getUserPermissions = (userId) =>
  api.get(`/users/${userId}/permissions`).then((r) => r.data.data)

export const patchUserPermissions = (userId, patch) =>
  api.patch(`/users/${userId}/permissions`, patch).then((r) => r.data.data)
