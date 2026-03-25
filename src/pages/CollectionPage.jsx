import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useCoins } from '../hooks/useCoins'
import { useCollection } from '../context/CollectionContext'
import { useAuth } from '../context/AuthContext'
import CoinCard from '../components/CoinCard'
import CoinRow from '../components/CoinRow'
import { useTranslation } from 'react-i18next'
import { useSEO } from '../hooks/useSEO'
import ProposeModal from '../components/ProposeModal'
import CoinScanner from '../components/CoinScanner'

export default function CollectionPage() {
  useSEO({ title: 'Mi colección' })
  const { owned, toggleCoin } = useCollection()
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const { ALL_COINS, COUNTRIES } = useCoins()

  const [search, setSearch] = useState('')
  const [country, setCountry] = useState(searchParams.get('country') || '')
  const [filter, setFilter] = useState('all')
  const [rarity, setRarity] = useState('')
  const [sort, setSort] = useState('')
  const [viewMode, setViewMode] = useState('grid')
  const [collapsedCountries, setCollapsedCountries] = useState(new Set())

  const handleViewMode = (mode) => {
    if (mode === 'country') {
      const empty = new Set(
        COUNTRIES.filter(c => !ALL_COINS.some(coin => coin.country === c && owned.has(coin.id)))
      )
      setCollapsedCountries(empty)
    }
    setViewMode(mode)
  }
  const [page, setPage] = useState(1)
  const [showPropose, setShowPropose] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const { t } = useTranslation()

  const PAGE_SIZE = 40

  // Resetear página al cambiar cualquier filtro
  useEffect(() => { setPage(1) }, [search, country, filter, rarity, sort])

  const hasActiveFilters = search || country || filter !== 'all' || rarity || sort

  const clearFilters = () => {
    setSearch('')
    setCountry('')
    setFilter('all')
    setRarity('')
    setSort('')
  }

  const toggleCountryCollapse = (c) => {
    setCollapsedCountries(prev => {
      const next = new Set(prev)
      if (next.has(c)) next.delete(c)
      else next.add(c)
      return next
    })
  }

  const filtered = useMemo(() => {
    return ALL_COINS.filter(coin => {
      const matchSearch = !search ||
        coin.description.toLowerCase().includes(search.toLowerCase()) ||
        coin.country.toLowerCase().includes(search.toLowerCase()) ||
        coin.year.toString().includes(search) ||
        coin.commemorates?.toLowerCase().includes(search.toLowerCase())

      const matchCountry = !country || coin.country === country

      const matchFilter =
        filter === 'all' ? true :
        filter === 'owned' ? owned.has(coin.id) :
        !owned.has(coin.id)

      const matchRarity =
        rarity === '' ? true :
        rarity === 'rare'   ? coin.mintage > 0 && coin.mintage < 100000 :
        rarity === 'medium' ? coin.mintage >= 100000 && coin.mintage < 1000000 :
        rarity === 'common' ? coin.mintage >= 1000000 : true

      return matchSearch && matchCountry && matchFilter && matchRarity
    })
  }, [search, country, filter, rarity, owned, ALL_COINS])

  const sorted = useMemo(() => {
    if (!sort) return filtered
    return [...filtered].sort((a, b) => {
      if (sort === 'year-asc') return a.year - b.year
      if (sort === 'year-desc') return b.year - a.year
      if (sort === 'mintage-asc') {
        const ma = a.mintage > 0 ? a.mintage : Infinity
        const mb = b.mintage > 0 ? b.mintage : Infinity
        return ma - mb
      }
      if (sort === 'mintage-desc') {
        const ma = a.mintage > 0 ? a.mintage : -1
        const mb = b.mintage > 0 ? b.mintage : -1
        return mb - ma
      }
      if (sort === 'country') return a.country.localeCompare(b.country, 'es')
      return 0
    })
  }, [filtered, sort])

  const paginated = sorted.slice(0, page * PAGE_SIZE)
  const hasMore = sorted.length > paginated.length

  const countryProgress = useMemo(() => {
    return COUNTRIES.map(c => {
      const coins = ALL_COINS.filter(x => x.country === c)
      const got = coins.filter(x => owned.has(x.id)).length
      return { country: c, total: coins.length, got, pct: Math.round((got / coins.length) * 100) }
    })
  }, [owned, ALL_COINS, COUNTRIES])

  const countryGroups = useMemo(() => {
    return COUNTRIES
      .map(c => {
        const coins = filtered.filter(coin => coin.country === c)
        if (coins.length === 0) return null
        const totalInCatalog = ALL_COINS.filter(coin => coin.country === c).length
        const got = ALL_COINS.filter(coin => coin.country === c && owned.has(coin.id)).length
        const pct = Math.round((got / totalInCatalog) * 100)
        return { country: c, coins, total: totalInCatalog, got, pct }
      })
      .filter(Boolean)
  }, [filtered, COUNTRIES, ALL_COINS, owned])

  return (
    <div>
      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 mb-4 flex flex-wrap gap-3 items-center">

        {/* Búsqueda */}
        <input
          type="text"
          placeholder={`🔍 ${t('searchPlaceholder')}`}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-48 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />

        {/* País */}
        <select
          value={country}
          onChange={e => setCountry(e.target.value)}
          className="border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="">{t('allCountries')}</option>
          {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        {/* Rareza */}
        <select
          value={rarity}
          onChange={e => setRarity(e.target.value)}
          className="border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="">{t('allRarities')}</option>
          <option value="rare">{t('rare')} (&lt;100k)</option>
          <option value="medium">{t('medium')} (100k-1M)</option>
          <option value="common">{t('common')} (&gt;1M)</option>
        </select>

        {/* Ordenar */}
        {viewMode !== 'country' && (
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            className="border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">Ordenar...</option>
            <option value="year-asc">Año ↑</option>
            <option value="year-desc">Año ↓</option>
            <option value="mintage-asc">Más rara primero</option>
            <option value="mintage-desc">Más común primero</option>
            <option value="country">País A→Z</option>
          </select>
        )}

        {/* Tengo / Faltan */}
        <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
          {[
            { value: 'all',     label: t('filterAll') },
            { value: 'owned',   label: '✅ ' + t('filterOwned') },
            { value: 'missing', label: '❌ ' + t('filterMissing') },
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`px-3 py-2 text-sm transition ${
                filter === value
                  ? 'bg-blue-700 text-white'
                  : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Vistas */}
        <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
          <button
            onClick={() => handleViewMode('grid')}
            title="Cuadrícula"
            className={`px-3 py-2 text-sm transition ${
              viewMode === 'grid'
                ? 'bg-blue-700 text-white'
                : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50'
            }`}
          >
            ⊞
          </button>
          <button
            onClick={() => handleViewMode('list')}
            title="Lista"
            className={`px-3 py-2 text-sm transition ${
              viewMode === 'list'
                ? 'bg-blue-700 text-white'
                : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50'
            }`}
          >
            ☰
          </button>
          <button
            onClick={() => handleViewMode('country')}
            title="Por país"
            className={`px-3 py-2 text-sm transition ${
              viewMode === 'country'
                ? 'bg-blue-700 text-white'
                : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50'
            }`}
          >
            🌍
          </button>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <span className="text-sm text-gray-500 dark:text-gray-400">{filtered.length} {t('coins')}</span>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-gray-400 hover:text-red-500 transition px-2 py-1 rounded border border-gray-200 dark:border-gray-600"
            >
              ✕ Limpiar
            </button>
          )}
          <button
            onClick={() => setShowScanner(true)}
            className="text-xs bg-blue-700 hover:bg-blue-800 text-white font-semibold px-3 py-2 rounded-lg transition"
            title="Escanear moneda con la cámara"
          >
            📷 Escanear
          </button>
          <button
            onClick={() => setShowPropose(true)}
            className="text-xs bg-yellow-400 hover:bg-yellow-300 text-blue-900 font-semibold px-3 py-2 rounded-lg transition"
          >
            + Proponer moneda
          </button>
        </div>
      </div>

      {/* Progreso por país — oculto en vista por país (ya se muestra inline) */}
      {!search && !country && filter === 'all' && rarity === '' && viewMode !== 'country' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 mb-4">
          <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-3">
            {t('countryProgress')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {countryProgress.map(({ country: c, total, got, pct }) => (
              <button
                key={c}
                onClick={() => setCountry(c)}
                className="text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg p-2 transition group"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-200 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition truncate">
                    {c}
                  </span>
                  <span className="text-xs text-gray-400 ml-2 shrink-0 flex items-center gap-1">
                    {pct >= 80 && pct < 100 && <span className="text-orange-400 font-semibold">¡Casi!</span>}
                    {got}/{total}
                  </span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-600 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                      pct === 100 ? 'bg-green-500' :
                      pct >= 80  ? 'bg-orange-400' :
                      pct >= 50  ? 'bg-blue-500' :
                      pct > 0    ? 'bg-yellow-400' : 'bg-gray-200'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Resultados */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <span className="text-4xl">🔍</span>
          <p className="mt-2">No se encontraron monedas</p>
          <button
            onClick={() => setShowPropose(true)}
            className="mt-4 bg-yellow-400 hover:bg-yellow-300 text-blue-900 font-semibold px-5 py-2.5 rounded-xl transition text-sm"
          >
            ¿La conoces? Proponla al catálogo →
          </button>
        </div>
      ) : viewMode === 'country' ? (
        <div className="space-y-3">
          {countryGroups.map(({ country: c, coins, total, got, pct }) => {
            const isCollapsed = collapsedCountries.has(c)
            return (
              <div key={c} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                <button
                  onClick={() => toggleCountryCollapse(c)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition text-left"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-semibold text-gray-800 dark:text-white text-sm">{c}</span>
                      <span className="text-xs text-gray-400 shrink-0 ml-2 flex items-center gap-1">
                        {pct >= 80 && pct < 100 && <span className="text-orange-400 font-semibold">¡Casi!</span>}
                        {got}/{total}
                        {pct === 100 && <span className="ml-0.5 text-green-500">✓</span>}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-600 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-1.5 rounded-full transition-all duration-500 ${
                          pct === 100 ? 'bg-green-500' :
                          pct >= 80  ? 'bg-orange-400' :
                          pct >= 50  ? 'bg-blue-500' :
                          pct > 0    ? 'bg-yellow-400' : 'bg-gray-200 dark:bg-gray-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <span className={`text-gray-400 text-xs transition-transform duration-200 shrink-0 ${isCollapsed ? '' : 'rotate-180'}`}>
                    ▼
                  </span>
                </button>
                {!isCollapsed && (
                  <div className="px-4 pb-4 pt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 border-t border-gray-100 dark:border-gray-700">
                    {coins.map(coin => (
                      <CoinCard
                        key={coin.id}
                        coin={coin}
                        isOwned={owned.has(coin.id)}
                        onToggle={() => toggleCoin(coin.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : viewMode === 'grid' ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {paginated.map(coin => (
              <CoinCard
                key={coin.id}
                coin={coin}
                isOwned={owned.has(coin.id)}
                onToggle={() => toggleCoin(coin.id)}
              />
            ))}
          </div>
          {hasMore && (
            <div className="mt-6 text-center">
              <button
                onClick={() => setPage(p => p + 1)}
                className="px-6 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition shadow-sm"
              >
                Cargar más · {sorted.length - paginated.length} restantes
              </button>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-100 dark:border-gray-600">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-300 font-medium w-16">Imagen</th>
                  <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-300 font-medium">País</th>
                  <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-300 font-medium">Año</th>
                  <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-300 font-medium hidden md:table-cell">Descripción</th>
                  <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-300 font-medium hidden lg:table-cell">Acuñación</th>
                  <th className="text-center px-4 py-3 text-gray-500 dark:text-gray-300 font-medium">Tengo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                {paginated.map(coin => (
                  <CoinRow
                    key={coin.id}
                    coin={coin}
                    isOwned={owned.has(coin.id)}
                    onToggle={() => toggleCoin(coin.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
          {hasMore && (
            <div className="mt-4 text-center">
              <button
                onClick={() => setPage(p => p + 1)}
                className="px-6 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition shadow-sm"
              >
                Cargar más · {sorted.length - paginated.length} restantes
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal propuesta */}
      {showPropose && user && (
        <ProposeModal user={user} onClose={() => setShowPropose(false)} />
      )}

      {/* Modal escáner */}
      {showScanner && (
        <CoinScanner
          allCoins={ALL_COINS}
          owned={owned}
          onToggle={toggleCoin}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  )
}
