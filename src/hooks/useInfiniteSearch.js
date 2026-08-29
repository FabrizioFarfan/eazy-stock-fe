import { useCallback, useEffect, useMemo, useState } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'

/**
 * Búsqueda con scroll infinito sobre un endpoint paginado de Spring
 * ({ content, number, last, totalElements }).
 *
 * Regla de William: un buscador NUNCA esconde resultados. Antes cada dropdown
 * pedía `size: 8` y «PERNO HEX» mostraba 8 cuando Productos listaba 32; el
 * usuario creía que el producto no existía. Ahora todas las búsquedas van por
 * aquí: páginas de PAGE_SIZE que se acumulan al bajar en la lista.
 *
 *   const s = useInfiniteSearch([PRODUCTS_KEY], productsApi.getAll, { search, active: true }, { enabled: !!search })
 *   s.items / s.total / s.hasMore / s.isLoading / s.isFetchingMore
 *   <LoadMoreRow search={s} />   ← centinela al pie de la lista
 */
export const PAGE_SIZE = 30

export function useInfiniteSearch(keyPrefix, fetchPage, params, { enabled = true, pageSize = PAGE_SIZE } = {}) {
  const q = useInfiniteQuery({
    queryKey: [...keyPrefix, 'infinite', params, pageSize],
    queryFn: ({ pageParam = 0 }) =>
      fetchPage({ ...params, page: pageParam, size: pageSize }).then((r) => r.data.data),
    initialPageParam: 0,
    getNextPageParam: (last) => (last?.last ? undefined : (last?.number ?? 0) + 1),
    enabled,
  })
  const items = useMemo(() => q.data?.pages.flatMap((p) => p?.content ?? []) ?? [], [q.data])
  const lastPage = q.data?.pages[q.data.pages.length - 1]
  const total = lastPage?.totalElements ?? 0
  return {
    items,
    total,
    hasMore: !!q.hasNextPage,
    isLoading: enabled && q.isPending,
    isFetching: q.isFetching,
    isFetchingMore: q.isFetchingNextPage,
    fetchMore: () => { if (q.hasNextPage && !q.isFetchingNextPage) q.fetchNextPage() },
  }
}

/**
 * Ref de callback para el centinela: cuando el nodo entra en pantalla (dentro
 * del dropdown con scroll o de la ventana) pide la página siguiente. Ref de
 * callback y no useRef: el centinela se monta y desmonta con cada búsqueda.
 */
export function useLoadMoreSentinel(search) {
  const [node, setNode] = useState(null)
  const { hasMore, isFetching, fetchMore } = search
  useEffect(() => {
    if (!node || !hasMore) return
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !isFetching) fetchMore()
    })
    obs.observe(node)
    return () => obs.disconnect()
  }, [node, hasMore, isFetching, fetchMore])
  return useCallback((el) => setNode(el), [])
}
