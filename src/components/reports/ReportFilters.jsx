import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useSuppliers } from '../../hooks/useSuppliers'
import { useBrands } from '../../hooks/useBrands'
import { useEmployees } from '../../hooks/useEmployees'

function today() {
  return new Date().toISOString().slice(0, 10)
}
function firstOfMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

const PRESETS = [
  { label: 'Hoy',           from: today,        to: today },
  { label: 'Últimos 7 días', from: () => {
      const d = new Date(); d.setDate(d.getDate() - 6); return d.toISOString().slice(0, 10)
    }, to: today },
  { label: 'Últimos 30 días', from: () => {
      const d = new Date(); d.setDate(d.getDate() - 29); return d.toISOString().slice(0, 10)
    }, to: today },
  { label: 'Este mes',      from: firstOfMonth, to: today },
]

export default function ReportFilters({ businessId }) {
  const [params, setParams] = useSearchParams()

  const [from, setFrom]           = useState(params.get('from') || firstOfMonth())
  const [to, setTo]               = useState(params.get('to')   || today())
  const [supplierId, setSupplierId] = useState(params.get('supplierId') || '')
  const [brandId, setBrandId]       = useState(params.get('brandId')    || '')
  const [employeeId, setEmployeeId] = useState(params.get('employeeId') || '')
  const [preset, setPreset]         = useState(null)

  const { data: suppliers } = useSuppliers({}, { select: (d) => d?.content ?? d ?? [] })
  const { data: brands }    = useBrands({},    { select: (d) => d?.content ?? d ?? [] })
  const { data: employees } = useEmployees({}, { select: (d) => d?.content ?? d ?? [] })

  // Sync URL → state when params change externally (e.g., browser back)
  useEffect(() => {
    setFrom(params.get('from') || firstOfMonth())
    setTo(params.get('to')     || today())
    setSupplierId(params.get('supplierId') || '')
    setBrandId(params.get('brandId')       || '')
    setEmployeeId(params.get('employeeId') || '')
  }, [params])

  function applyPreset(p) {
    setPreset(p.label)
    const f = p.from()
    const t = p.to()
    setFrom(f)
    setTo(t)
    push(f, t, supplierId, brandId, employeeId)
  }

  function push(f, t, sid, bid, eid) {
    const next = new URLSearchParams()
    if (f)   next.set('from', f)
    if (t)   next.set('to', t)
    if (sid) next.set('supplierId', sid)
    if (bid) next.set('brandId', bid)
    if (eid) next.set('employeeId', eid)
    setParams(next, { replace: true })
  }

  function handleFilterChange(field, value) {
    const vals = { from, to, supplierId, brandId, employeeId, [field]: value }
    if (field === 'supplierId') setSupplierId(value)
    if (field === 'brandId')    setBrandId(value)
    if (field === 'employeeId') setEmployeeId(value)
    if (field === 'from')       setFrom(value)
    if (field === 'to')         setTo(value)
    push(vals.from, vals.to, vals.supplierId, vals.brandId, vals.employeeId)
  }

  function clear() {
    setFrom(firstOfMonth())
    setTo(today())
    setSupplierId('')
    setBrandId('')
    setEmployeeId('')
    setPreset(null)
    setParams({}, { replace: true })
  }

  const selectCls =
    'rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 bg-white'

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4">
      {/* Presets */}
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => applyPreset(p)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              preset === p.label
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {p.label}
          </button>
        ))}
        <button
          onClick={() => { setPreset('custom') }}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            preset === 'custom'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Custom
        </button>
      </div>

      {/* Date range + dropdowns */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500">Desde</label>
          <input
            type="date"
            value={from}
            onChange={(e) => handleFilterChange('from', e.target.value)}
            className={selectCls}
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500">Hasta</label>
          <input
            type="date"
            value={to}
            onChange={(e) => handleFilterChange('to', e.target.value)}
            className={selectCls}
          />
        </div>

        <select
          value={supplierId}
          onChange={(e) => handleFilterChange('supplierId', e.target.value)}
          className={selectCls}
        >
          <option value="">Todos los proveedores</option>
          {(suppliers || []).map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        <select
          value={brandId}
          onChange={(e) => handleFilterChange('brandId', e.target.value)}
          className={selectCls}
        >
          <option value="">Todas las marcas</option>
          {(brands || []).map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>

        <select
          value={employeeId}
          onChange={(e) => handleFilterChange('employeeId', e.target.value)}
          className={selectCls}
        >
          <option value="">Todos los empleados</option>
          {(employees || []).map((e) => (
            <option key={e.id} value={e.id}>{e.name}</option>
          ))}
        </select>

        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={clear}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            Limpiar filtros
          </button>

          {/* Export Excel — visible pero deshabilitado (Bloque 5) */}
          <div className="relative group">
            <button
              disabled
              className="rounded-lg bg-green-500/40 px-3 py-2 text-sm font-medium text-white cursor-not-allowed"
            >
              Exportar Excel
            </button>
            <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white">
              Próximamente
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
