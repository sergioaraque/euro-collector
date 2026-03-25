import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCollection } from '../context/CollectionContext'
import { useAdmin } from '../hooks/useAdmin'
import { useCoins } from '../hooks/useCoins'
import GlobalSearch from './GlobalSearch'
import Tour from './Tour'
import { useTranslation } from 'react-i18next'
import { useTheme, THEME_LIST } from '../context/ThemeContext'
import { useState, useRef, useEffect } from 'react'

export default function Layout() {
  const { user, signOut } = useAuth()
  const { owned } = useCollection()
  const { dark, toggle, colorTheme, setColorTheme } = useTheme()
  const [showThemes, setShowThemes] = useState(false)
  const [showPersonal, setShowPersonal] = useState(false)
  const { isAdmin } = useAdmin()
  const navigate = useNavigate()
  const location = useLocation()
  const { ALL_COINS, COUNTRIES, loading } = useCoins()
  const { t, i18n } = useTranslation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [tourOpen, setTourOpen] = useState(() => !localStorage.getItem('tour_seen'))

  const handleTourClose = () => {
    localStorage.setItem('tour_seen', '1')
    setTourOpen(false)
  }
  const personalRef = useRef(null)
  const themesRef = useRef(null)

  const handleSignOut = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

  const toggleLang = () => {
    const next = i18n.language === 'es' ? 'en' : 'es'
    i18n.changeLanguage(next)
    localStorage.setItem('lang', next)
  }

  const pct = Math.round((owned.size / ALL_COINS.length) * 100)

  // Cierra los dropdowns al hacer click fuera
  useEffect(() => {
    function handleClick(e) {
      if (personalRef.current && !personalRef.current.contains(e.target)) {
        setShowPersonal(false)
      }
      if (themesRef.current && !themesRef.current.contains(e.target)) {
        setShowThemes(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Rutas del grupo "Personal"
  const personalRoutes = ['/progreso', '/actividad', '/insignias', '/perfil']
  const isPersonalActive = personalRoutes.some(r => location.pathname.startsWith(r))

  const personalLinks = [
    { to: '/progreso',   label: '📈 Progreso' },
    { to: '/insignias',  label: '🏅 ' + t('badges') },
    { to: '/actividad',  label: '📋 ' + t('activity') },
    { to: '/perfil',     label: '👤 Perfil' },
  ]

  const mainLinks = [
    { to: '/mapa',         label: '🗺️ ' + t('map') },
    { to: '/coleccion',    label: '📦 ' + t('collection') },
    { to: '/estadisticas', label: '📊 ' + t('stats') },
  ]

  const rightLinks = [
    { to: '/ranking',   label: '🏆 ' + t('ranking') },
    { to: '/comunidad', label: '💬 Comunidad' },
    ...(isAdmin ? [{ to: '/admin', label: '🛡️ ' + t('admin') }] : []),
  ]

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900 transition-colors">

      {/* Header */}
      <header className="themed text-white shadow-lg transition-colors">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-2">

            {/* Logo */}
            <NavLink to="/mapa" className="flex items-center gap-2 shrink-0">
              <span className="text-2xl">🪙</span>
              <div className="hidden sm:block">
                <p className="font-bold text-base leading-tight">EuroCollector</p>
                <p className="text-blue-200 dark:text-gray-400 text-xs">
                  {owned.size}/{ALL_COINS.length} · {pct}%
                </p>
              </div>
            </NavLink>

            {/* Buscador desktop */}
            <div className="hidden md:flex flex-1 justify-center" data-tour="search">
              <GlobalSearch />
            </div>

            {/* Acciones */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMobileSearchOpen(s => !s)}
                aria-label="Buscar"
                className="md:hidden bg-blue-700 dark:bg-gray-700 hover:bg-blue-600 px-3 py-1.5 rounded-lg text-sm transition"
              >
                🔍
              </button>

              <button
                onClick={() => setTourOpen(true)}
                aria-label="Ayuda"
                title="Ver guía de la app"
                className="bg-blue-700 dark:bg-gray-700 hover:bg-blue-600 px-3 py-1.5 rounded-lg text-sm transition"
              >
                ❓
              </button>

              <button
                onClick={toggleLang}
                aria-label={i18n.language === 'es' ? 'Cambiar a inglés' : 'Cambiar a español'}
                className="bg-blue-700 dark:bg-gray-700 hover:bg-blue-600 px-3 py-1.5 rounded-lg text-sm transition"
              >
                {i18n.language === 'es' ? '🇬🇧' : '🇪🇸'}
              </button>

              {/* Modo oscuro */}
              <button
                onClick={toggle}
                aria-label={dark ? 'Activar modo claro' : 'Activar modo oscuro'}
                className="bg-blue-700 dark:bg-gray-700 hover:bg-blue-600 px-3 py-1.5 rounded-lg text-sm transition"
              >
                {dark ? '☀️' : '🌙'}
              </button>

              <div className="relative" ref={themesRef}>
                <button
                  onClick={() => setShowThemes(s => !s)}
                  aria-label="Cambiar tema de color"
                  aria-expanded={showThemes}
                  aria-haspopup="listbox"
                  className="bg-black/20 hover:bg-black/30 px-3 py-1.5 rounded-lg text-sm transition"
                >
                  🎨
                </button>
                {showThemes && (
                  <div className="absolute right-0 top-full mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl p-3 z-50 flex gap-2">
                    {THEME_LIST.map(theme => (
                      <button
                        key={theme.id}
                        onClick={() => { setColorTheme(theme.id); setShowThemes(false) }}
                        title={theme.name}
                        className={`w-7 h-7 rounded-full border-2 transition ${
                          colorTheme === theme.id ? 'border-white scale-110' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: theme.primary }}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="hidden sm:flex items-center gap-2">
                <NavLink
                  to="/perfil"
                  className="text-sm text-blue-200 dark:text-gray-400 hover:text-white transition truncate max-w-32"
                >
                  {user?.email}
                </NavLink>
                <button
                  onClick={handleSignOut}
                  className="bg-blue-700 dark:bg-gray-700 hover:bg-blue-600 px-3 py-1.5 rounded-lg text-sm transition"
                >
                  {t('logout')}
                </button>
              </div>

              <button
                onClick={() => setMobileMenuOpen(s => !s)}
                aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
                aria-expanded={mobileMenuOpen}
                className="sm:hidden bg-blue-700 dark:bg-gray-700 hover:bg-blue-600 px-3 py-1.5 rounded-lg text-sm transition"
              >
                {mobileMenuOpen ? '✕' : '☰'}
              </button>
            </div>
          </div>

          {/* Buscador móvil */}
          {mobileSearchOpen && (
            <div className="mt-3 md:hidden">
              <GlobalSearch autoFocus onSelect={() => setMobileSearchOpen(false)} />
            </div>
          )}

          {/* Menú móvil */}
          {mobileMenuOpen && (
            <div className="mt-3 sm:hidden border-t border-blue-700 dark:border-gray-600 pt-3 space-y-1">

              <p className="px-3 pb-1 text-xs text-blue-300/60 uppercase tracking-wide font-medium">Mi colección</p>
              {mainLinks.map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `block px-3 py-2 rounded-lg text-sm transition ${
                      isActive
                        ? 'bg-yellow-400/20 text-yellow-300 font-medium'
                        : 'text-blue-200 hover:bg-blue-700 hover:text-white'
                    }`
                  }
                >
                  {label}
                </NavLink>
              ))}

              <p className="px-3 pt-3 pb-1 text-xs text-blue-300/60 uppercase tracking-wide font-medium">Social</p>
              {rightLinks.map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `block px-3 py-2 rounded-lg text-sm transition ${
                      isActive
                        ? 'bg-yellow-400/20 text-yellow-300 font-medium'
                        : 'text-blue-200 hover:bg-blue-700 hover:text-white'
                    }`
                  }
                >
                  {label}
                </NavLink>
              ))}

              <p className="px-3 pt-3 pb-1 text-xs text-blue-300/60 uppercase tracking-wide font-medium">Personal</p>
              {personalLinks.map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `block px-3 py-2 rounded-lg text-sm transition ${
                      isActive
                        ? 'bg-yellow-400/20 text-yellow-300 font-medium'
                        : 'text-blue-200 hover:bg-blue-700 hover:text-white'
                    }`
                  }
                >
                  {label}
                </NavLink>
              ))}

              <div className="border-t border-blue-700 dark:border-gray-600 pt-2 mt-2">
                <button
                  onClick={() => { handleSignOut(); setMobileMenuOpen(false) }}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm text-blue-200 hover:bg-blue-700 hover:text-white transition"
                >
                  🚪 {t('logout')} · {user?.email}
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Nav desktop */}
      <nav className="themed text-white shadow-sm transition-colors hidden sm:block">
        <div className="max-w-6xl mx-auto px-4 flex items-center gap-1">

          {/* Mi colección */}
          {mainLinks.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `px-4 py-2.5 text-sm font-medium transition border-b-2 whitespace-nowrap ${
                  isActive
                    ? 'border-yellow-400 text-yellow-300'
                    : 'border-transparent text-blue-200 dark:text-gray-300 hover:text-white'
                }`
              }
            >
              {label}
            </NavLink>
          ))}

          <div className="w-px self-stretch my-2 bg-white/20 dark:bg-gray-600/50 mx-1" />

          {/* Social */}
          {rightLinks.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `px-4 py-2.5 text-sm font-medium transition border-b-2 whitespace-nowrap ${
                  isActive
                    ? 'border-yellow-400 text-yellow-300'
                    : 'border-transparent text-blue-200 dark:text-gray-300 hover:text-white'
                }`
              }
            >
              {label}
            </NavLink>
          ))}

          <div className="w-px self-stretch my-2 bg-white/20 dark:bg-gray-600/50 mx-1" />

          {/* Dropdown "Personal" */}
          <div className="relative" ref={personalRef}>
            <button
              onClick={() => setShowPersonal(s => !s)}
              aria-expanded={showPersonal}
              aria-haspopup="menu"
              data-tour="personal"
              className={`px-4 py-2.5 text-sm font-medium transition border-b-2 whitespace-nowrap flex items-center gap-1 ${
                isPersonalActive
                  ? 'border-yellow-400 text-yellow-300'
                  : 'border-transparent text-blue-200 dark:text-gray-300 hover:text-white'
              }`}
            >
              👤 Personal
              <span className={`text-xs transition-transform ${showPersonal ? 'rotate-180' : ''}`}>▾</span>
            </button>

            {showPersonal && (
              <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-xl z-50 min-w-44 overflow-hidden border border-gray-100 dark:border-gray-700">
                {personalLinks.map(({ to, label }) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={() => setShowPersonal(false)}
                    className={({ isActive }) =>
                      `block px-4 py-2.5 text-sm transition ${
                        isActive
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium'
                          : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`
                    }
                  >
                    {label}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-3 sm:px-4 py-4 sm:py-6">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-blue-800 dark:bg-gray-800 text-white transition-colors">
        <div className="max-w-6xl mx-auto px-4 py-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">🪙</span>
              <span className="font-semibold text-white text-sm">EuroCollector</span>
              <span className="text-xs opacity-60">· Hecho con ❤️ para coleccionistas</span>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <NavLink to="/mapa" className="hover:text-white transition">Mapa</NavLink>
              <NavLink to="/coleccion" className="hover:text-white transition">Colección</NavLink>
              <NavLink to="/ranking" className="hover:text-white transition">Ranking</NavLink>
              <NavLink to="/comunidad" className="hover:text-white transition">Comunidad</NavLink>
            </div>
            <p className="text-xs opacity-50">
              {owned.size}/{ALL_COINS.length} monedas · {pct}% completado
            </p>
          </div>
        </div>
      </footer>

      {tourOpen && <Tour onClose={handleTourClose} />}
    </div>
  )
}