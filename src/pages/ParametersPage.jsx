import { useMemo, useState } from 'react'
import { Plus, SlidersHorizontal, X, Package, Pin, PinOff, ChevronUp, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import { CatalogSwitcher, ReportHero, ReportHeader, BigSearch, NewButton, EntityCard } from '../components/reports/ReportKit'
import EntityModal, { EntityField } from '../components/common/EntityModal'
import HelpDrawer from '../components/common/HelpDrawer'
import { useParameters, useCreateParameter, useUpdateParameter, useDeleteParameter, useReorderParameters, usePinParameter } from '../hooks/useParameters'
import { useAuth } from '../context/AuthContext'
import { adminBizParam } from '../utils/adminBiz'
import { getErrorMessage } from '../utils/handleApiError'
import { PARAMETER_TYPES, TYPE_META, UNIT_PRESETS } from '../utils/parameters'
import { useT } from '../i18n'

/**
 * PARÁMETROS (Frank, 4-nov-2026): «que parámetro tenga su página, así como categoría, pero más compleja: un
 * parámetro de tipo sí/no, uno de tipo largo con sus medidas, uno con opciones (rojo, azul, verde)… y que ya
 * por defecto a todos les vengan unos (centímetros, litros, colores) para que se animen a usarlo; y así ponemos
 * "es artesanal: sí/no" y se puede filtrar». El producto los rellena en su ficha; Productos e Inventario filtran.
 */

const inputCls =
  'rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 placeholder-gray-400 w-full bg-white'

const TYPE_TONE = {
  YES_NO:  'bg-emerald-50 text-emerald-700',
  OPTIONS: 'bg-violet-50 text-violet-700',
  NUMBER:  'bg-blue-50 text-blue-700',
  TEXT:    'bg-amber-50 text-amber-700',
}

// ── Modal ─────────────────────────────────────────────────────────────────────

function ParameterModal({ parameter, onClose }) {
  const t = useT()
  const { user } = useAuth()
  const isEdit = !!parameter
  const create = useCreateParameter()
  const update = useUpdateParameter()
  const mutation = isEdit ? update : create

  const [name, setName] = useState(parameter?.name ?? '')
  const [type, setType] = useState(parameter?.type ?? 'YES_NO')
  const [unit, setUnit] = useState(parameter?.unit ?? 'cm')
  const [options, setOptions] = useState(parameter?.options ?? [])
  const [pinned, setPinned] = useState(!!parameter?.pinned)
  const [optInput, setOptInput] = useState('')
  const [touched, setTouched] = useState(false)

  const addOption = () => {
    const v = optInput.trim()
    if (v && !options.some((o) => o.toLowerCase() === v.toLowerCase())) setOptions((prev) => [...prev, v])
    setOptInput('')
  }
  const removeOption = (o) => setOptions((prev) => prev.filter((x) => x !== o))

  const nameOk = name.trim().length >= 2
  const optionsOk = type !== 'OPTIONS' || options.length >= 2
  const ready = nameOk && optionsOk

  const onSubmit = async (e) => {
    e.preventDefault()
    setTouched(true)
    if (!ready) return
    const data = { name: name.trim(), type, unit: type === 'NUMBER' ? unit.trim() || null : null, options: type === 'OPTIONS' ? options : null, pinned }
    try {
      if (isEdit) await update.mutateAsync({ id: parameter.id, data, params: adminBizParam(user) })
      else await create.mutateAsync({ ...data, ...adminBizParam(user) })
      toast.success(isEdit ? t('Parámetro guardado') : t('Parámetro creado'))
      onClose()
    } catch { /* el error se muestra abajo */ }
  }

  const meta = TYPE_META[type]
  const preview = type === 'YES_NO' ? `${t('Sí')} / ${t('No')}`
    : type === 'OPTIONS' ? (options.length ? options.join(' · ') : t('Añade las opciones'))
    : type === 'NUMBER' ? `${t('un número en')} ${unit || '…'}`
    : t('texto libre')

  return (
    <EntityModal onClose={onClose} onSubmit={onSubmit} isEdit={isEdit}
      title={isEdit ? t('Editar parámetro') : t('Nuevo parámetro')}
      subtitle={preview}
      avatar={(
        <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-white/20 text-3xl ring-1 ring-white/30">
          {meta.emoji}
        </div>
      )}
      previewName={name} placeholderName={t('Nombre del parámetro')}
      submitting={mutation.isPending} submitLabel={isEdit ? t('Guardar cambios') : t('Crear parámetro')}
      error={mutation.isError ? getErrorMessage(mutation.error) : null}>

      <EntityField label={`${t('Nombre')} *`} hint={t('Como se verá en la ficha del producto y en el filtro.')} error={touched && !nameOk ? t('Mínimo 2 caracteres') : null}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('Ej. Artesanal, Color, Largo, Con borrador')}
          className={`${inputCls} py-3 text-base font-semibold`} autoFocus />
      </EntityField>

      <EntityField label={`${t('Qué tipo de dato es')} *`}>
        <div className="grid grid-cols-2 gap-2">
          {PARAMETER_TYPES.map((k) => {
            const m = TYPE_META[k]
            const on = type === k
            return (
              <button key={k} type="button" onClick={() => setType(k)} aria-pressed={on}
                className={`flex items-start gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-all ${
                  on ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-600/20' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
                <span className="text-xl leading-none">{m.emoji}</span>
                <span className="min-w-0">
                  <span className={`block text-sm font-bold ${on ? 'text-blue-800' : 'text-gray-900'}`}>{t(m.label)}</span>
                  <span className="block text-[11px] leading-snug text-gray-500">{t(m.hint)}</span>
                </span>
              </button>
            )
          })}
        </div>
        {isEdit && type !== parameter.type && (
          <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">{t('Cambiar el tipo vuelve a leer lo que ya escribieron los productos con las reglas nuevas; lo que no encaje deja de filtrarse (el texto se conserva).')}</p>
        )}
      </EntityField>

      <label className={`flex cursor-pointer items-start gap-2.5 rounded-xl border px-3 py-2.5 text-sm ${pinned ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
        <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} className="mt-0.5 accent-blue-600" />
        <span>
          <span className="block font-semibold text-gray-900">{t('Fijado: sale siempre en la ficha del producto')}</span>
          <span className="block text-xs text-gray-500">{t('Sin fijar, solo aparece cuando el producto ya tiene valor o lo añades con «Añadir parámetro».')}</span>
        </span>
      </label>

      {type === 'NUMBER' && (
        <EntityField label={t('Medida')} hint={t('Se muestra al lado del número: 25 cm, 1.5 L, 2 kg.')}>
          <div className="flex flex-wrap items-center gap-1.5">
            {UNIT_PRESETS.map((u) => (
              <button key={u} type="button" onClick={() => setUnit(u)}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition-colors ${unit === u ? 'bg-blue-600 text-white' : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'}`}>
                {u}
              </button>
            ))}
            <input value={unit} onChange={(e) => setUnit(e.target.value)} maxLength={16} placeholder={t('otra…')}
              className={`${inputCls} w-28 py-1.5 text-xs`} />
          </div>
        </EntityField>
      )}

      {type === 'OPTIONS' && (
        <EntityField label={`${t('Opciones')} *`} hint={t('Al menos dos. El producto elige una de la lista.')} error={touched && !optionsOk ? t('Pon al menos dos opciones') : null}>
          <div className="flex gap-2">
            <input value={optInput} onChange={(e) => setOptInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addOption() } }}
              placeholder={t('Ej. Rojo, Azul, Verde… (Enter para añadir)')} className={`${inputCls} flex-1`} />
            <button type="button" onClick={addOption} disabled={!optInput.trim()}
              className="flex items-center gap-1.5 rounded-xl bg-blue-50 px-4 py-2.5 text-sm font-bold text-blue-700 hover:bg-blue-100 disabled:opacity-40">
              <Plus size={15} />{t('Agregar')}
            </button>
          </div>
          {options.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {options.map((o) => (
                <span key={o} className="flex items-center gap-1 rounded-full bg-violet-50 py-1 pl-3 pr-1.5 text-sm font-semibold text-violet-700 ring-1 ring-violet-100">
                  {o}
                  <button type="button" onClick={() => removeOption(o)} aria-label={t('Quitar')} className="flex items-center justify-center rounded-full p-0.5 hover:bg-violet-200"><X size={12} /></button>
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-3 rounded-xl border-2 border-dashed border-gray-100 px-3 py-3 text-center text-xs text-gray-400">{t('Aún sin opciones: escribe una y toca Agregar')}</p>
          )}
        </EntityField>
      )}
    </EntityModal>
  )
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
