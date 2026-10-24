import { useQuery } from '@tanstack/react-query'
import { countriesApi } from '../services/endpoints/countries'
import { FALLBACK_COUNTRY_CONFIGS } from '../utils/countries'

/**
 * Configuración de los países soportados (GET /api/countries, público). Si el
 * API no responde o es uno viejo sin el endpoint, la lista local mínima
 * (`FALLBACK_COUNTRY_CONFIGS`): el registro nunca se queda sin países.
 */
export function useCountries() {
  const q = useQuery({
    queryKey: ['countries'],
    queryFn: () => countriesApi.list().then((r) => r.data?.data ?? r.data),
    staleTime: 60 * 60_000,
    retry: 1,
  })
  const list = Array.isArray(q.data) && q.data.length > 0 ? q.data : FALLBACK_COUNTRY_CONFIGS
  return { countries: list, isLoading: q.isLoading, fromApi: list !== FALLBACK_COUNTRY_CONFIGS }
}
