import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { notificationsApi } from '../services/endpoints/notifications'
import { useInfiniteSearch } from './useInfiniteSearch'

export const NOTIFICATIONS_KEY = 'notifications'

/**
 * Listado completo con scroll infinito para la página de Notificaciones
 * (la campana solo muestra las últimas). `onlyUnread` lo filtra en el BE.
 */
export function useNotificationSearch(onlyUnread = false) {
  return useInfiniteSearch(
    [NOTIFICATIONS_KEY],
    notificationsApi.getAll,
    { sort: 'createdAt,desc', ...(onlyUnread ? { read: false } : {}) },
    { pageSize: 30 },
  )
}

export function useNotifications() {
  const qc = useQueryClient()

  const { data: page, isLoading } = useQuery({
    queryKey: [NOTIFICATIONS_KEY],
    queryFn:  () => notificationsApi.getAll({ size: 40, sort: 'createdAt,desc' }).then((r) => r.data.data),
    refetchInterval: 60_000,
    staleTime: 15_000,
  })

  const { data: countData } = useQuery({
    queryKey: [NOTIFICATIONS_KEY, 'count'],
    queryFn:  () => notificationsApi.unreadCount().then((r) => r.data.data),
    refetchInterval: 60_000,
    staleTime: 15_000,
  })

  const markReadMut = useMutation({
    mutationFn: (id) => notificationsApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [NOTIFICATIONS_KEY] }),
  })

  const markAllReadMut = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: [NOTIFICATIONS_KEY] }),
  })

  return {
    notifications: page?.content ?? [],
    total:         page?.totalElements ?? 0,
    unreadCount:   countData ?? 0,
    isLoading,
    markRead:    (id) => markReadMut.mutate(id),
    markAllRead: ()   => markAllReadMut.mutate(),
    isMarkingAll: markAllReadMut.isPending,
  }
}
