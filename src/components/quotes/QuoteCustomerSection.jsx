import { useEffect, useState } from 'react'
import { Users, UserPlus, PencilLine } from 'lucide-react'
import CustomerPicker from '../customers/CustomerPicker'
import CustomerFormModal from '../customers/CustomerFormModal'
import { useT } from '../../i18n'

const inputCls = 'w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 placeholder-gray-400'

/**
 * Cliente de la cotización, en tres modos (pedido de Frank): elegir uno de
 * «Mis clientes», registrar uno nuevo (queda en Clientes) o escribir datos
 * sueltos sin guardar ficha. `value` = { customer: obj|null, name, phone, email }.
 * Al elegir cliente se copian sus datos a name/phone/email (así el PDF y el
 * envío por WhatsApp/correo ya tienen a quién ir).
 */
export default function QuoteCustomerSection({ value, onChange }) {
  const t = useT()
  const [mode, setMode] = useState(value.customer ? 'pick' : 'free')
  const [newName, setNewName] = useState(null)

  // El cliente puede llegar después del montaje (borrador restaurado, duplicar, editar).
  useEffect(() => { if (value.customer) setMode('pick') }, [value.customer])

  const pick = (c) => {
    if (!c) { onChange({ customer: null, name: '', phone: '', email: '' }); return }
    onChange({ customer: { id: c.id, name: c.name, phone: c.phone, email: c.email, documentId: c.documentId }, name: c.name ?? '', phone: c.phone ?? '', email: c.email ?? '' })
    setMode('pick')
  }

  const modes = [
    { key: 'pick', icon: Users,      label: t('Mis clientes') },
    { key: 'free', icon: PencilLine, label: t('Datos sueltos') },
  ]

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-bold text-gray-900">{t('Cliente (opcional)')}</h3>
      <div className="mt-3 flex gap-1 rounded-xl border border-gray-200 bg-gray-100 p-1 text-xs">
        {modes.map(({ key, icon: Icon, label }) => (
          <button key={key} type="button"
            onClick={() => { if (key === 'free' && value.customer) pick(null); setMode(key) }}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 font-medium transition-colors ${mode === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      <div className="mt-3 space-y-3">
        {mode === 'pick' ? (
          <>
            <CustomerPicker
              value={value.customer}
              onSelect={pick}
              onRequestCreate={(name) => setNewName(name ?? '')}
              showDebt={false}
              subtitle={(c) => [c.phone, c.email].filter(Boolean).join(' · ')}
            />
            {value.customer && (
              <p className="text-[11px] text-gray-400">
                {t('Teléfono y correo se toman de su ficha. Si le faltan, agrégalos en Clientes o cambia a «Datos sueltos».')}
              </p>
            )}
          </>
        ) : (
          <>
            <input value={value.name} onChange={(e) => onChange({ ...value, name: e.target.value })}
              placeholder={t('Nombre del cliente')} className={inputCls} />
            <input value={value.phone} onChange={(e) => onChange({ ...value, phone: e.target.value })}
              placeholder={t('Teléfono (para WhatsApp)')} className={inputCls} inputMode="tel" />
            <input value={value.email} onChange={(e) => onChange({ ...value, email: e.target.value })}
              placeholder={t('Correo (para enviar por mail)')} className={inputCls} inputMode="email" type="email" />
            <button type="button" onClick={() => setNewName(value.name.trim())}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-blue-300 bg-blue-50/50 px-3 py-2 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-50">
              <UserPlus size={13} /> {t('Guardar como cliente nuevo')}
            </button>
          </>
        )}
      </div>

      {newName !== null && (
        <CustomerFormModal
          initialName={newName}
          onClose={() => setNewName(null)}
          onCreated={(c) => pick(c)}
        />
      )}
    </div>
  )
}
