import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BadgeCheck, FlaskConical, Crown, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../../context/AuthContext'
import { bossApi } from '../../services/endpoints/boss'
import { withKind } from '../../utils/accountKinds'
import { getErrorMessage } from '../../utils/handleApiError'

/*
 * Qué es cada cuenta (Frank, 30-oct-2026): cliente, tester o socio; sin nada = nueva, sin revisar.
 * Se ve y se cambia en Panel Boss, Negocios y Owners; el dato sale de /boss/activity (solo BOSS).
 * Los componentes están en AccountKind.jsx (react-refresh: un fichero de componentes no exporta otra cosa).
 */

export const KIND_CFG = {
  CUSTOMER: { label: 'Cliente', icon: BadgeCheck,   chip: 'bg-emerald-100 text-emerald-700', on: 'bg-emerald-600 text-white' },
  TESTER:   { label: 'Tester',  icon: FlaskConical, chip: 'bg-gray-100 text-gray-500',       on: 'bg-gray-700 text-white' },
  TEAM:     { label: 'Socio',   icon: Crown,        chip: 'bg-amber-100 text-amber-700',     on: 'bg-amber-500 text-white' },
  NEW:      { label: 'Nuevo · sin revisar', icon: Sparkles, chip: 'bg-blue-100 text-blue-700' },
}
export const kindCfg = (kind) => KIND_CFG[kind ?? 'NEW']

export const FILTER_LABEL = { customers: 'Clientes', new: 'Nuevos', testers: 'Testers', team: 'Socios', all: 'Todos' }

/**
 * Datos de /boss/activity + clasificar en el momento (se pinta antes de que conteste el servidor y se
 * deshace si falla). Solo para BOSS: un SUPER_ADMIN sin BOSS no ve etiquetas.
 */
export function useAccountKinds() {
  const { user } = useAuth()
  // El rol llega normalizado: un BOSS es role SUPER_ADMIN + isBoss.
  const isBoss = !!user?.isBoss
  const qc = useQueryClient()
  const query = useQuery({
    queryKey: ['boss-activity'],
    queryFn: () => bossApi.getActivity().then((r) => r.data.data ?? r.data),
    enabled: isBoss,
  })
  const classify = useMutation({
    mutationFn: ({ ownerId, kind }) => bossApi.setAccountKind(ownerId, kind),
    onMutate: ({ ownerId, kind }) => {
      const before = qc.getQueryData(['boss-activity'])
      qc.setQueryData(['boss-activity'], (d) => (d ? { ...d, businesses: withKind(d.businesses, ownerId, kind) } : d))
      return { before }
    },
    onError: (err, _v, ctx) => {
      if (ctx?.before) qc.setQueryData(['boss-activity'], ctx.before)
      toast.error(getErrorMessage(err))
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['boss-activity'] })
      qc.invalidateQueries({ queryKey: ['boss-subscriptions'] })
    },
  })
  const businesses = query.data?.businesses ?? []
  const byOwner = new Map()
  const byBusiness = new Map()
  for (const b of businesses) {
    byBusiness.set(b.id, { ownerId: b.ownerId, kind: b.accountKind ?? null })
    if (b.ownerId) byOwner.set(b.ownerId, b.accountKind ?? null)
  }
  return {
    enabled: isBoss && query.isSuccess,
    query,
    businesses,
    byOwner,
    byBusiness,
    pick: (ownerId, kind) => classify.mutate({ ownerId, kind }),
    busyId: classify.isPending ? classify.variables?.ownerId : null,
  }
}
