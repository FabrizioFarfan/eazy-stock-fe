import { useMemo, useState } from 'react'
import { Plus, SlidersHorizontal, Package, Pin, PinOff, ChevronUp, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import { CatalogSwitcher, ReportHero, ReportHeader, BigSearch, NewButton, EntityCard } from '../components/reports/ReportKit'
import HelpDrawer from '../components/common/HelpDrawer'
import { useParameters, useDeleteParameter, useReorderParameters, usePinParameter } from '../hooks/useParameters'
import ParameterModal from '../components/products/ParameterModal'
import { useAuth } from '../context/AuthContext'
import { adminBizParam } from '../utils/adminBiz'
import { getErrorMessage } from '../utils/handleApiError'
import { TYPE_META } from '../utils/parameters'
import { useT } from '../i18n'

/**
 * PARÁMETROS (Frank, 4-nov-2026): «que parámetro tenga su página, así como categoría, pero más compleja: un
 * parámetro de tipo sí/no, uno de tipo largo con sus medidas, uno con opciones (rojo, azul, verde)… y que ya
 * por defecto a todos les vengan unos (centímetros, litros, colores) para que se animen a usarlo; y así ponemos
 * "es artesanal: sí/no" y se puede filtrar». El producto los rellena en su ficha; Productos e Inventario filtran.
 */

const TYPE_TONE = {
  YES_NO:  'bg-emerald-50 text-emerald-700',
  OPTIONS: 'bg-violet-50 text-violet-700',
  NUMBER:  'bg-blue-50 text-blue-700',
  TEXT:    'bg-amber-50 text-amber-700',
}

// ── Card ──────────────────────────────────────────────────────────────────────

function ParameterCard({ parameter, onEdit, onDelete, onPin, onMove, first, last, busy }) {
  const t = useT()
  const meta = TYPE_META[parameter.type] ?? TYPE_META.TEXT
  const detail = parameter.type === 'YES_NO' ? `${t('Sí')} / ${t('No')}`
    : parameter.type === 'OPTIONS' ? (parameter.options ?? []).join(' · ')
    : parameter.type === 'NUMBER' ? `${t('número')}${parameter.unit ? ` · ${parameter.unit}` : ''}`
    : t('texto libre')
  return (
    <EntityCard
      avatar={<div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl text-2xl ${TYPE_TONE[parameter.type] ?? 'bg-gray-50'}`}>{meta.emoji}</div>}
      title={parameter.name}
      subtitle={<span className="flex items-center gap-1.5"><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${TYPE_TONE[parameter.type]}`}>{t(meta.label)}</span>{parameter.builtIn && <span className="text-[10px] text-gray-400">· {t('de fábrica')}</span>}</span>}
      onOpen={() => onEdit(parameter)} onEdit={() => onEdit(parameter)} onDelete={() => onDelete(parameter)}
    >
      <p className="truncate text-xs text-gray-500" title={detail}>{detail}</p>
      <p className="flex items-center gap-1 text-[11px] text-gray-400">
        <Package size={11} /> {parameter.productsCount === 1 ? t('1 producto lo usa') : t('{n} productos lo usan', { n: parameter.productsCount })}
      </p>
      {/* Frank (4-nov): el dueño decide qué se ve y en qué orden */}
      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
        <button type="button" disabled={busy} onClick={() => onPin(parameter)} aria-pressed={parameter.pinned}
          className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold transition-colors disabled:opacity-50 ${
            parameter.pinned ? 'bg-blue-600 text-white' : 'border border-gray-200 bg-white text-gray-500 hover:bg-gray-50'}`}
          title={parameter.pinned ? t('Sale siempre en la ficha; toca para soltarlo') : t('Fijar: que salga siempre en la ficha del producto')}>
          {parameter.pinned ? <Pin size={11} /> : <PinOff size={11} />} {parameter.pinned ? t('Fijado') : t('Fijar')}
        </button>
        <span className="ml-auto inline-flex rounded-lg border border-gray-200 bg-white" role="group" aria-label={t('Orden')}>
          <button type="button" disabled={busy || first} onClick={() => onMove(parameter, -1)} aria-label={t('Subir')} className="rounded-l-lg p-1 text-gray-500 hover:bg-gray-50 disabled:opacity-30"><ChevronUp size={13} /></button>
          <button type="button" disabled={busy || last} onClick={() => onMove(parameter, 1)} aria-label={t('Bajar')} className="rounded-r-lg border-l border-gray-200 p-1 text-gray-500 hover:bg-gray-50 disabled:opacity-30"><ChevronDown size={13} /></button>
        </span>
      </div>
    </EntityCard>
  )
}

// ── Página ────────────────────────────────────────────────────────────────────

export default function ParametersPage() {
  const t = useT()
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)
  const remove = useDeleteParameter()
  const reorder = useReorderParameters()
  const pin = usePinParameter()

  const { data, isLoading } = useParameters(adminBizParam(user))
  const all = data ?? []
  const list = useMemo(() => {
    const s = search.trim().toLowerCase()
    return s ? all.filter((p) => p.name.toLowerCase().includes(s) || (p.options ?? []).some((o) => o.toLowerCase().includes(s))) : all
  }, [all, search])
  const used = all.filter((p) => p.productsCount > 0).length
  const pinnedCount = all.filter((p) => p.pinned).length
  const move = (p, dir) => {
    const ids = all.map((x) => x.id)
    const i = ids.indexOf(p.id), j = i + dir
    if (i < 0 || j < 0 || j >= ids.length) return
    ;[ids[i], ids[j]] = [ids[j], ids[i]]
    reorder.mutate({ ids, params: adminBizParam(user) }, { onError: (err) => toast.error(getErrorMessage(err)) })
  }
  const togglePin = (p) => pin.mutate({ id: p.id, pinned: !p.pinned, params: adminBizParam(user) }, { onError: (err) => toast.error(getErrorMessage(err)) })
  const byType = (k) => all.filter((p) => p.type === k).length

  const handleDelete = async (p) => {
    const msg = p.productsCount > 0
      ? t('¿Quitar «{name}»? Lo usan {n} producto(s): conservan lo escrito, pero deja de salir en la ficha y en el filtro.', { name: p.name, n: p.productsCount })
      : t('¿Quitar «{name}»?', { name: p.name })
    if (!window.confirm(msg)) return
    try { await remove.mutateAsync({ id: p.id, params: adminBizParam(user) }); toast.success(t('Parámetro eliminado')) }
    catch (err) { toast.error(getErrorMessage(err)) }
  }

  return (
    <div className="flex flex-col gap-5">
      <ReportHeader icon={SlidersHorizontal} title={t('Parámetros')}
        subtitle={t('Qué se puede decir de un producto, y por qué se filtra')}
        help={(
          <HelpDrawer title={t('Cómo usar Parámetros')} autoOpenKey="eazystock_parameters_help_v1">
            <p>{t('Un parámetro es un dato que describes de cada producto y por el que luego puedes filtrar el catálogo: si es artesanal, de qué color es, cuánto mide, cuántos litros trae.')}</p>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <p className="font-semibold text-gray-800">✅ {t('Sí / No')}</p>
              <p className="mt-1">{t('Una casilla. «¿Es artesanal?», «¿Lápiz con borrador?». En Productos filtras por Sí o por No.')}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <p className="font-semibold text-gray-800">🎨 {t('Opciones')}</p>
              <p className="mt-1">{t('Una lista cerrada: rojo, azul, verde, sin color. El producto elige una y tú filtras por ella.')}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <p className="font-semibold text-gray-800">📏 {t('Número con medida')}</p>
              <p className="mt-1">{t('Largo en cm, capacidad en litros, peso en kg. Filtras por rango: «entre 10 y 20 cm».')}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <p className="font-semibold text-gray-800">📌 {t('Tú decides cuáles se ven')}</p>
              <p className="mt-1">{t('En la ficha del producto solo salen los FIJADOS y los que ya tienen valor; los demás se añaden con «Añadir parámetro». Fija los que uses siempre y ordénalos con las flechas.')}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <p className="font-semibold text-gray-800">🧩 {t('Ya vienen unos de fábrica')}</p>
              <p className="mt-1">{t('Artesanal, Color, Material, Largo, Ancho, Alto, Peso y Capacidad. Edítalos, quítalos o crea los tuyos: los productos rellenan solo los que les sirven.')}</p>
            </div>
          </HelpDrawer>
        )}
        right={<NewButton onClick={() => setModal({ parameter: null })}><Plus size={15} />{t('Nuevo parámetro')}</NewButton>} />

      <CatalogSwitcher />

      <ReportHero icon={SlidersHorizontal} label={t('Tus parámetros')} loading={isLoading} value={all.length}
        sub={<span>{t('Se rellenan en la ficha de cada producto y se filtran en Productos e Inventario.')}</span>}
        cells={[
          [t('Fijados en la ficha'), pinnedCount, pinnedCount === 0 ? 'text-amber-200' : ''],
          [t('En uso'), used],
          [t('Sí / No'), byType('YES_NO')],
          [t('Opciones'), byType('OPTIONS')],
          [t('Con medida'), byType('NUMBER')],
        ]} />

      <BigSearch value={search} onChange={setSearch} placeholder={t('Buscar parámetro u opción...')} />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-gray-100" />)}
        </div>
      ) : list.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-20">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100"><SlidersHorizontal size={28} className="text-gray-400" /></div>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-700">{search ? t('Sin resultados para "{q}"', { q: search }) : t('No hay parámetros aún')}</p>
          </div>
          {!search && (
            <button onClick={() => setModal({ parameter: null })} className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">
              <Plus size={14} />{t('Crear el primero')}
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((p, i) => <ParameterCard key={p.id} parameter={p} onEdit={(x) => setModal({ parameter: x })} onDelete={handleDelete}
            onPin={togglePin} onMove={move} first={i === 0} last={i === list.length - 1} busy={reorder.isPending || pin.isPending} />)}
        </div>
      )}

      {modal !== null && <ParameterModal parameter={modal.parameter} onClose={() => setModal(null)} />}
    </div>
  )
}
