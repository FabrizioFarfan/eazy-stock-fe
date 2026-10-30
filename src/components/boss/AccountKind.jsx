import { useT } from '../../i18n'
import { KINDS, FILTERS } from '../../utils/accountKinds'
import { KIND_CFG, kindCfg, FILTER_LABEL } from './accountKindData'

/* Etiqueta, botones y pestañas de «qué es cada cuenta» (datos y hook en accountKindData.js). */

export function KindChip({ kind }) {
  const t = useT()
  const cfg = kindCfg(kind)
  const Icon = cfg.icon
  return (
    <span className={`inline-flex flex-shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${cfg.chip}`}>
      <Icon size={11} /> {t(cfg.label)}
    </span>
  )
}

/** Tres botones: tocar el que ya está lo devuelve a «sin revisar». */
export function KindPicker({ kind, onPick, busy }) {
  const t = useT()
  return (
    <div className="inline-flex rounded-xl border border-gray-200 bg-white p-0.5" role="group" aria-label={t('¿Qué es esta cuenta?')}>
      {KINDS.map((k) => {
        const cfg = KIND_CFG[k]
        const Icon = cfg.icon
        const on = kind === k
        return (
          <button key={k} type="button" disabled={busy} aria-pressed={on}
            onClick={(e) => { e.stopPropagation(); onPick(on ? null : k) }}
            title={on ? t('Volver a «sin revisar»') : t('Marcar como {kind}', { kind: t(cfg.label) })}
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-colors disabled:opacity-50 ${
              on ? cfg.on : 'text-gray-500 hover:bg-gray-50'}`}>
            <Icon size={12} /> {t(cfg.label)}
          </button>
        )
      })}
    </div>
  )
}

/** Pestañas con contador: Clientes / Nuevos / Testers / Socios / Todos. */
export function KindTabs({ value, onChange, counts }) {
  const t = useT()
  return (
    <div className="flex flex-wrap gap-1.5" role="tablist" aria-label={t('Qué cuentas ver')}>
      {FILTERS.map((f) => (
        <button key={f} type="button" role="tab" aria-selected={value === f} onClick={() => onChange(f)}
          className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
            value === f ? 'bg-gray-900 text-white' : 'border border-gray-200 bg-white text-gray-500 hover:bg-gray-50'}`}>
          {t(FILTER_LABEL[f])} <span className={value === f ? 'text-white/60' : 'text-gray-300'}>{counts[f] ?? 0}</span>
        </button>
      ))}
    </div>
  )
}

