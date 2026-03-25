import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useCollection } from '../context/CollectionContext'
import { useCoins } from '../hooks/useCoins'
import { loadUserBadges } from '../lib/badges'
import { useTranslation } from 'react-i18next'
import { useSEO } from '../hooks/useSEO'

function getBadgeProgress(badgeId, owned, allCoins) {
  const ownedCount = owned.size
  const countries = [...new Set(allCoins.map(c => c.country))]
  const completedCountries = countries.filter(country =>
    allCoins.filter(c => c.country === country).every(c => owned.has(c.id))
  ).length
  const ownedRare = allCoins.filter(c => owned.has(c.id) && c.mintage > 0 && c.mintage < 100000).length
  const allYears = [...new Set(allCoins.map(c => c.year))]
  const coveredYears = allYears.filter(year => allCoins.some(c => c.year === year && owned.has(c.id))).length
  const coinsOf = (country) => allCoins.filter(c => c.country === country)
  const ownedOf = (country) => coinsOf(country).filter(c => owned.has(c.id)).length

  const map = {
    first_coin:        { current: ownedCount, target: 1 },
    coins_10:          { current: ownedCount, target: 10 },
    coins_25:          { current: ownedCount, target: 25 },
    coins_50:          { current: ownedCount, target: 50 },
    coins_100:         { current: ownedCount, target: 100 },
    coins_200:         { current: ownedCount, target: 200 },
    coins_all:         { current: ownedCount, target: allCoins.length },
    half_collection:   { current: ownedCount, target: Math.floor(allCoins.length / 2) },
    first_country:     { current: completedCountries, target: 1 },
    countries_5:       { current: completedCountries, target: 5 },
    countries_10:      { current: completedCountries, target: 10 },
    countries_all:     { current: completedCountries, target: countries.length },
    spain_complete:    { current: ownedOf('España'),   target: coinsOf('España').length },
    germany_complete:  { current: ownedOf('Alemania'), target: coinsOf('Alemania').length },
    vaticano_complete: { current: ownedOf('Vaticano'), target: coinsOf('Vaticano').length },
    monaco_complete:   { current: ownedOf('Mónaco'),   target: coinsOf('Mónaco').length },
    rare_coin:         { current: ownedRare, target: 1 },
    rare_5:            { current: ownedRare, target: 5 },
    all_years:         { current: coveredYears, target: allYears.length },
  }
  return map[badgeId] || null
}

const CATEGORY_LABELS = {
  collection: '🪙 Colección',
  countries:  '🗺️ Países',
  special:    '⭐ Especiales',
}

export default function BadgesPage() {
  useSEO({ title: 'Insignias y logros' })
  const { user } = useAuth()
  const { t } = useTranslation()
  const { owned } = useCollection()
  const { ALL_COINS } = useCoins()
  const [badges, setBadges] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    loadUserBadges(user.id).then(data => {
      setBadges(data)
      setLoading(false)
    })
  }, [user])

  const earned = badges.filter(b => b.earned).length
  const total = badges.length

  const byCategory = badges.reduce((acc, b) => {
    if (!acc[b.category]) acc[b.category] = []
    acc[b.category].push(b)
    return acc
  }, {})

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          🏆 Insignias y logros
        </h1>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm px-4 py-2 text-center">
          <span className="text-2xl font-extrabold text-blue-700 dark:text-blue-400">
            {earned}/{total}
          </span>
          <p className="text-xs text-gray-400">conseguidas</p>
        </div>
      </div>

      {/* Barra de progreso */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4">
        <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mb-2">
          <span>Progreso de insignias</span>
          <span>{Math.round((earned / total) * 100)}%</span>
        </div>
        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
          <div
            className="h-3 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-500 transition-all duration-700"
            style={{ width: `${(earned / total) * 100}%` }}
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Cargando insignias...</div>
      ) : (
        Object.entries(byCategory).map(([category, items]) => (
          <div key={category} className="space-y-3">
            <h2 className="font-semibold text-gray-600 dark:text-gray-300 text-sm uppercase tracking-wide px-1">
              {CATEGORY_LABELS[category] || category}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {items.map(badge => (
                <div
                  key={badge.id}
                  className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 transition ${
                    badge.earned
                      ? 'border-2 border-yellow-400'
                      : 'opacity-50 grayscale'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-3xl shrink-0">{badge.icon}</span>
                    <div className="min-w-0 w-full">
                      <p className="font-semibold text-gray-800 dark:text-white text-sm leading-tight">
                        {badge.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-tight">
                        {badge.description}
                      </p>
                      {badge.earned && badge.earned_at && (
                        <p className="text-xs text-yellow-500 mt-1">
                          ✓ {new Date(badge.earned_at).toLocaleDateString('es')}
                        </p>
                      )}
                      {!badge.earned && (() => {
                        const progress = getBadgeProgress(badge.id, owned, ALL_COINS)
                        if (!progress || progress.current === 0) return null
                        const pct = Math.min(100, Math.round((progress.current / progress.target) * 100))
                        return (
                          <div className="mt-2">
                            <div className="flex justify-between text-xs text-gray-400 mb-1">
                              <span>{progress.current}/{progress.target}</span>
                              <span>{pct}%</span>
                            </div>
                            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="h-1.5 rounded-full bg-blue-400 transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        )
                      })()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}