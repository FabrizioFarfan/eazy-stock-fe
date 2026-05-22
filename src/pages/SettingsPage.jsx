import { BookOpen, User, Building2, Mail, Shield, LogOut, ChevronRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const ROLE_LABEL = {
  SUPER_ADMIN: 'Super Admin',
  OWNER: 'Owner',
  EMPLOYEE: 'Empleado',
}

const ROLE_COLOR = {
  SUPER_ADMIN: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100',
  OWNER:       'bg-orange-50 text-orange-700 ring-1 ring-orange-100',
  EMPLOYEE:    'bg-slate-100 text-slate-600',
}

const AVATAR_GRADIENT = {
  SUPER_ADMIN: 'from-indigo-400 to-indigo-600',
  OWNER:       'from-orange-400 to-orange-600',
  EMPLOYEE:    'from-slate-400 to-slate-600',
}

function InfoRow({ icon: Icon, label, value }) {
  if (!value) return null
  return (
    <div className="flex items-center gap-3.5 py-3.5 border-b border-gray-50 last:border-0">
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-gray-50">
        <Icon size={14} className="text-gray-400" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-gray-400">{label}</p>
        <p className="mt-0.5 truncate text-sm font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="border-b border-gray-50 px-5 py-3.5">
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">{title}</h3>
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

  const gradient = AVATAR_GRADIENT[user?.role] ?? 'from-gray-400 to-gray-600'

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4">

      {/* Profile header card */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <div className="h-16 bg-gradient-to-r from-[#0f172a] to-slate-700" />
        <div className="px-6 pb-5">
          <div className="-mt-7 flex items-end justify-between">
            <div className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} text-xl font-extrabold text-white shadow-lg ring-4 ring-white`}>
              {initials}
            </div>
            <span className={`mb-1 rounded-full px-3 py-1 text-xs font-semibold ${ROLE_COLOR[user?.role] ?? 'bg-gray-100 text-gray-600'}`}>
              {ROLE_LABEL[user?.role] ?? user?.role}
            </span>
          </div>
          <div className="mt-3">
            <p className="text-lg font-bold text-gray-900">{user?.name}</p>
            {user?.email && <p className="text-sm text-gray-400">{user.email}</p>}
          </div>
        </div>
      </div>

      {/* Profile info */}
      <Section title="Mi perfil">
        <InfoRow icon={User}      label="Nombre"   value={user?.name} />
        <InfoRow icon={Mail}      label="Email"    value={user?.email} />
        <InfoRow icon={Shield}    label="Rol"      value={ROLE_LABEL[user?.role] ?? user?.role} />
        <InfoRow icon={Building2} label="Negocio"  value={user?.businessName} />
      </Section>

      {/* Tutorial */}
      <Section title="Ayuda">
        <button
          onClick={handleReplayTutorial}
          className="flex w-full items-center gap-3.5 py-4 text-left hover:bg-gray-50 -mx-5 px-5 rounded-xl transition-colors"
        >
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-orange-50">
            <BookOpen size={15} className="text-orange-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900">Ver tutorial</p>
            <p className="text-xs text-gray-400">Repasa las funciones principales de la app</p>
          </div>
          <ChevronRight size={16} className="text-gray-400" />
        </button>
      </Section>

      {/* Session */}
      <Section title="Sesión">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3.5 py-4 -mx-5 px-5 rounded-xl text-left hover:bg-red-50 transition-colors group"
        >
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-red-50 group-hover:bg-red-100 transition-colors">
            <LogOut size={15} className="text-red-500" />
          </div>
          <span className="text-sm font-semibold text-red-500">Cerrar sesión</span>
        </button>
      </Section>

      <p className="text-center text-xs text-gray-300">Eazy Stock · v1.0</p>
    </div>
  )
}
