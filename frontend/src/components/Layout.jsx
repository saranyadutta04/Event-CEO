import { useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Calendar, Users, CheckSquare, DollarSign,
  QrCode, LogOut, Menu, X, Sparkles, Globe, ChevronRight
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useT } from '../utils/helpers'
import translations from '../i18n/translations'

const LANGS = [
  { code: 'en', label: 'EN', name: 'English' },
  { code: 'hi', label: 'हि', name: 'हिंदी' },
  { code: 'bn', label: 'বা', name: 'বাংলা' },
]

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout, language, setLanguage } = useAuthStore()
  const [langOpen, setLangOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const t = useT()

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: t('nav.dashboard') },
    { to: '/events', icon: Calendar, label: t('nav.events') },
  ]

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/')

  return (
    <div className="flex h-screen bg-surface-900 overflow-hidden">
      {/* Sidebar Overlay (mobile) */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:relative inset-y-0 left-0 z-50 w-64 flex flex-col
        bg-surface-800 border-r border-white/8
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="p-5 border-b border-white/8 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-violet-600 flex items-center justify-center shadow-lg shadow-purple-500/30 group-hover:shadow-purple-500/50 transition-shadow">
              <Sparkles size={18} className="text-white" />
            </div>
            <div>
              <div className="font-display font-bold text-white text-sm leading-tight">EventCEO</div>
              <div className="text-xs text-purple-400 font-semibold">AI</div>
            </div>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden btn-icon text-slate-400">
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 overflow-y-auto">
          <div className="space-y-1">
            {navItems.map(({ to, icon: Icon, label }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setSidebarOpen(false)}
                className={isActive(to) ? 'nav-link-active' : 'nav-link'}
              >
                <Icon size={18} />
                <span>{label}</span>
                {isActive(to) && <ChevronRight size={14} className="ml-auto" />}
              </Link>
            ))}
          </div>
        </nav>

        {/* Bottom section */}
        <div className="p-3 border-t border-white/8 space-y-2">
          {/* Language switcher */}
          <div className="relative">
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="nav-link w-full"
            >
              <Globe size={18} />
              <span className="flex-1 text-left">{LANGS.find(l => l.code === language)?.name || 'English'}</span>
              <ChevronRight size={14} className={`transition-transform ${langOpen ? 'rotate-90' : ''}`} />
            </button>
            {langOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-1 glass-sm py-1 animate-slide-down">
                {LANGS.map(l => (
                  <button
                    key={l.code}
                    onClick={() => { setLanguage(l.code); setLangOpen(false) }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-white/10 transition-colors ${language === l.code ? 'text-purple-300' : 'text-slate-300'}`}
                  >
                    {l.label} · {l.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* User */}
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">{user?.name}</div>
              <div className="text-xs text-slate-500 truncate">{user?.email}</div>
            </div>
          </div>

          <button onClick={handleLogout} className="nav-link w-full text-red-400 hover:text-red-300 hover:bg-red-500/10">
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top bar (mobile) */}
        <header className="lg:hidden h-14 bg-surface-800 border-b border-white/8 flex items-center px-4 gap-3 flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="btn-icon text-slate-400">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-600 to-violet-600 flex items-center justify-center">
              <Sparkles size={14} className="text-white" />
            </div>
            <span className="font-display font-bold text-white text-sm">EventCEO AI</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-mesh">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
