import { BookOpen, User, Building2, Mail, Shield, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const ROLE_LABEL = {
  SUPER_ADMIN: 'Super Admin',
  OWNER: 'Owner',
  EMPLOYEE: 'Empleado',
}

const ROLE_COLOR = {
  SUPER_ADMIN: 'bg-indigo-100 text-indigo-700',
  OWNER: 'bg-orange-100 text-orange-700',
  EMPLOYEE: 'bg-slate-100 text-slate-600',
}

function InfoRow({ icon: Icon, label, value }) {
  if (!value) return null
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100">
        <Icon size={15} className="text-gray-500" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-gray-400">{label}</p>
        <p className="truncate text-sm font-medium text-gray-900">{value}</p>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="border-b border-gray-100 px-5 py-3">
        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
      </div>
      <div className="px-5">{children}</div>
    </div>
  )
}

export default function SettingsPage() {
  const { user, logout } = useAuth()

  const tutorialKey = user ? `eazystock_tutorial_seen_${user.id ?? user.email}` : null

  const handleReplayTutorial = () => {
    if (tutorialKey) localStorage.removeItem(tutorialKey)
    window.dispatchEvent(new CustomEvent('eazystock:show-tutorial'))
  }

  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4">

      {/* Avatar + name header */}
      <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white px-5 py-4">
        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-orange-500 text-xl font-bold text-white">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-gray-900">{user?.name}</p>
          <span className={`mt-0.5 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_COLOR[user?.role] ?? 'bg-gray-100 text-gray-600'}`}>
            {ROLE_LABEL[user?.role] ?? user?.role}
          </span>
        </div>
      </div>

      {/* Profile info */}
      <Section title="Mi perfil">
        <div className="divide-y divide-gray-50">
          <InfoRow icon={User}     label="Nombre"   value={user?.name} />
          <InfoRow icon={Mail}     label="Email"    value={user?.email} />
          <InfoRow icon={Shield}   label="Rol"      value={ROLE_LABEL[user?.role] ?? user?.role} />
          <InfoRow icon={Building2} label="Negocio" value={user?.businessName} />
        </div>
      </Section>

      {/* Tutorial */}
      <Section title="Tutorial">
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50">
              <BookOpen size={15} className="text-orange-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Ver tutorial</p>
              <p className="text-xs text-gray-400">Repasa las funciones principales de la app</p>
            </div>
          </div>
          <button
            onClick={handleReplayTutorial}
            className="rounded-lg border border-orange-300 px-3 py-1.5 text-xs font-semibold text-orange-600 hover:bg-orange-50 transition-colors"
          >
            Ver ahora
          </button>
        </div>
      </Section>

      {/* Session */}
      <Section title="Sesión">
        <div className="py-3">
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-1 py-2 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
          >
            <LogOut size={15} />
            Cerrar sesión
          </button>
        </div>
      </Section>
    </div>
  )
}
