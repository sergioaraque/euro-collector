import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useCoins } from '../../hooks/useCoins'
import { useCoinImage } from '../../hooks/useCoinImage'
import { useSEO } from '../../hooks/useSEO'
import { supabase } from '../../supabase'
import ProposeModal from '../../components/ProposeModal'

function PublicCoinCard({ coin }) {
  const { src, status } = useCoinImage(coin)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition border-2 border-transparent hover:border-blue-300">
      <div className="bg-gray-50 dark:bg-gray-700 flex items-center justify-center h-28 relative">
        {status === 'error' ? (
          <span className="text-4xl">🪙</span>
        ) : (
          <>
            {status === 'loading' && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
              </div>
            )}
            <img
              src={src}
              alt={coin.description}
              className={`h-24 w-24 object-contain transition-opacity ${
                status === 'ok' ? 'opacity-100' : 'opacity-0'
              }`}
            />
          </>
        )}
        {coin.mintage > 0 && coin.mintage < 100000 && (
          <span className="absolute top-1 right-1 bg-purple-500 text-white text-xs rounded-full px-1.5 py-0.5">
            💎
          </span>
        )}
      </div>
      <div className="p-2">
        <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 truncate">{coin.country}</p>
        <p className="text-sm font-bold text-gray-800 dark:text-white">{coin.year}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-tight">{coin.description}</p>
      </div>
    </div>
  )
}

function LoginRequiredModal({ onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
        <div className="text-4xl mb-3">🔒</div>
        <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-2">
          Necesitas una cuenta
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
          Para proponer una moneda tienes que estar registrado. ¡Es gratis!
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 text-sm px-4 py-2"
          >
            Cancelar
          </button>
          <Link
            to="/register"
            className="bg-blue-700 hover:bg-blue-800 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition"
          >
            Crear cuenta →
          </Link>
        </div>
      </div>
    </div>
  )
}

const PREVIEW_LIMIT = 24

export default function PublicCatalogPage() {
  useSEO({ title: 'Catálogo', description: 'Más de 500 monedas conmemorativas de 2€ de todos los países de la eurozona' })

  const { ALL_COINS, COUNTRIES, loading } = useCoins()
  const [search, setSearch]             = useState('')
  const [country, setCountry]           = useState('')
  const [rarity, setRarity]             = useState('')
  const [showPropose, setShowPropose]   = useState(false)
  const [proposeUser, setProposeUser]   = useState(null)
  const [checkingUser, setCheckingUser] = useState(false)

  const isFiltering = !!(search || country || rarity)

  const filtered = useMemo(() => {
    return ALL_COINS.filter(coin => {
      const matchSearch = !search ||
        coin.country.toLowerCase().includes(search.toLowerCase()) ||
        coin.description.toLowerCase().includes(search.toLowerCase()) ||
        coin.year.toString().includes(search) ||
        coin.commemorates?.toLowerCase().includes(search.toLowerCase())
      const matchCountry = !country || coin.country === country
      const matchRarity =
        rarity === '' ? true :
        rarity === 'rare'   ? coin.mintage > 0 && coin.mintage < 100000 :
        rarity === 'medium' ? coin.mintage >= 100000 && coin.mintage < 1000000 :
        coin.mintage >= 1000000
      return matchSearch && matchCountry && matchRarity
    })
  }, [ALL_COINS, search, country, rarity])

  // Cuando no hay filtros activos, limitamos las monedas visibles
  const visibleCoins = isFiltering ? filtered : filtered.slice(0, PREVIEW_LIMIT)
  const hiddenCount  = isFiltering ? 0 : Math.max(0, filtered.length - PREVIEW_LIMIT)

  async function handleProposeClick() {
    setCheckingUser(true)
    const { data: { user } } = await supabase.auth.getUser()
    setCheckingUser(false)
    setProposeUser(user)
    setShowPropose(true)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">

      {/* Header */}
      <header className="bg-blue-800 dark:bg-gray-800 text-white shadow">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/landing" className="flex items-center gap-2">
            <span className="text-2xl">🪙</span>
            <span className="font-bold text-lg">EuroCollector</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/estadisticas-publicas" className="text-sm text-blue-200 hover:text-white transition hidden sm:block">
              Estadísticas
            </Link>
            <Link to="/ranking-publico" className="text-sm text-blue-200 hover:text-white transition hidden sm:block">
              Ranking
            </Link>
            <Link to="/login" className="text-sm text-blue-200 hover:text-white transition">
              Iniciar sesión
            </Link>
            <Link to="/register" className="bg-yellow-400 hover:bg-yellow-300 text-blue-900 font-semibold text-sm px-4 py-2 rounded-lg transition">
              Registrarse
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            🪙 Catálogo de monedas
          </h1>
          <Link
            to="/register"
            className="bg-blue-700 hover:bg-blue-800 text-white text-sm px-4 py-2 rounded-lg transition"
          >
            ✅ Registrarse para marcar monedas
          </Link>
        </div>

        {/* Filtros */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-3 sm:p-4 flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="🔍 Buscar moneda, país, año..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 min-w-48 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <select
            value={country}
            onChange={e => setCountry(e.target.value)}
            className="border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">Todos los países</option>
            {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={rarity}
            onChange={e => setRarity(e.target.value)}
            className="border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">Todas las rarezas</option>
            <option value="rare">💎 Raras (&lt;100k)</option>
            <option value="medium">🔵 Medias (100k-1M)</option>
            <option value="common">⚪ Comunes (&gt;1M)</option>
          </select>
          <span className="text-sm text-gray-500 dark:text-gray-400 self-center">
            {loading ? '...' : isFiltering ? `${filtered.length} monedas` : `${ALL_COINS.length} monedas`}
          </span>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="relative">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {visibleCoins.map(coin => (
                <PublicCoinCard key={coin.id} coin={coin} />
              ))}
            </div>

            {/* Teaser: difuminado + CTA cuando hay monedas ocultas */}
            {hiddenCount > 0 && (
              <div className="relative mt-3">
                {/* Filas fantasma difuminadas */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 blur-sm pointer-events-none select-none" aria-hidden="true">
                  {ALL_COINS.slice(PREVIEW_LIMIT, PREVIEW_LIMIT + 5).map(coin => (
                    <PublicCoinCard key={coin.id} coin={coin} />
                  ))}
                </div>

                {/* Overlay degradado + CTA */}
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-transparent via-gray-50/80 to-gray-50 dark:via-gray-900/80 dark:to-gray-900 rounded-xl">
                  <div className="text-center px-4 py-6 max-w-md">
                    <p className="text-3xl mb-2">🔒</p>
                    <p className="text-lg font-bold text-gray-800 dark:text-white mb-1">
                      Y {hiddenCount.toLocaleString()} monedas más...
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      Regístrate gratis para ver el catálogo completo, marcar las monedas que tienes y seguir tu progreso.
                    </p>
                    <div className="flex gap-3 justify-center flex-wrap">
                      <Link
                        to="/register"
                        className="bg-yellow-400 hover:bg-yellow-300 text-blue-900 font-bold px-6 py-2.5 rounded-xl transition text-sm"
                      >
                        Crear cuenta gratis →
                      </Link>
                      <Link
                        to="/login"
                        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 px-5 py-2.5 rounded-xl transition text-sm hover:bg-gray-50"
                      >
                        Ya tengo cuenta
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Estado vacío con CTA de propuesta */}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <span className="text-4xl">🔍</span>
            <p className="mt-2 mb-4">No se encontraron monedas</p>
            <button
              onClick={handleProposeClick}
              disabled={checkingUser}
              className="bg-yellow-400 hover:bg-yellow-300 text-blue-900 font-semibold px-5 py-2.5 rounded-xl transition text-sm"
            >
              {checkingUser ? 'Comprobando...' : '¿La conoces? Proponla al catálogo →'}
            </button>
          </div>
        )}

        {/* Banner propuesta — visible cuando hay resultados */}
        {!loading && filtered.length > 0 && (
          <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-3 justify-between">
            <p className="text-sm text-yellow-800 dark:text-yellow-300">
              🔎 ¿No encuentras una moneda que debería estar en el catálogo?
            </p>
            <button
              onClick={handleProposeClick}
              disabled={checkingUser}
              className="shrink-0 bg-yellow-400 hover:bg-yellow-300 text-blue-900 font-semibold text-sm px-5 py-2 rounded-xl transition"
            >
              {checkingUser ? 'Comprobando...' : 'Proponer moneda →'}
            </button>
          </div>
        )}

        {/* Banner CTA coleccionista */}
        {!loading && (
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-4 justify-between">
            <div>
              <p className="font-semibold text-blue-800 dark:text-blue-300">
                ¿Te gustaría marcar las monedas que tienes?
              </p>
              <p className="text-sm text-blue-600 dark:text-blue-400 mt-0.5">
                Regístrate gratis y lleva el control de tu colección
              </p>
            </div>
            <Link
              to="/register"
              className="shrink-0 bg-blue-700 hover:bg-blue-800 text-white font-semibold px-6 py-2.5 rounded-xl transition"
            >
              Crear cuenta →
            </Link>
          </div>
        )}
      </main>

      <footer className="bg-blue-900 dark:bg-gray-900 text-blue-200 text-center py-4 text-xs">
        EuroCollector · Hecho con ❤️ para coleccionistas
      </footer>

      {/* Modales */}
      {showPropose && (
        proposeUser
          ? <ProposeModal user={proposeUser} onClose={() => setShowPropose(false)} />
          : <LoginRequiredModal onClose={() => setShowPropose(false)} />
      )}
    </div>
  )
}