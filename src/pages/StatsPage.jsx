import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCoins } from '../hooks/useCoins'
import { useCollection } from '../context/CollectionContext'
import { useSEO } from '../hooks/useSEO'
import { getEstimatedValue, getCoinTier, VALUE_TIERS, formatValue } from '../lib/coinValue'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Legend, PieChart, Pie, Cell
} from 'recharts'

export default function StatsPage() {
  useSEO({ title: 'Estadísticas' })
  const { ALL_COINS, COUNTRIES, loading } = useCoins()
  const { owned } = useCollection()
  const navigate = useNavigate()

  const total = ALL_COINS.length
  const ownedCount = owned.size
  const pct = total > 0 ? Math.round((ownedCount / total) * 100) : 0

  const ownedCoins = useMemo(() =>
    ALL_COINS.filter(c => owned.has(c.id)), [owned])

  // Valor estimado total (monedas propias)
  const totalValue = useMemo(() =>
    ownedCoins.reduce((sum, c) => sum + getEstimatedValue(c), 0), [ownedCoins])

  // Valor potencial si tuvieras todo el catálogo
  const potentialValue = useMemo(() =>
    ALL_COINS.reduce((sum, c) => sum + getEstimatedValue(c), 0), [ALL_COINS])

  // Top 5 monedas más valiosas de tu colección
  const topCoins = useMemo(() =>
    [...ownedCoins]
      .sort((a, b) => getEstimatedValue(b) - getEstimatedValue(a))
      .slice(0, 5),
  [ownedCoins])

  // Moneda más rara que tienes
  const rarestCoin = useMemo(() =>
    ownedCoins.length === 0 ? null :
    ownedCoins.reduce((prev, curr) =>
      (curr.mintage > 0 && (prev.mintage === 0 || curr.mintage < prev.mintage)) ? curr : prev
    ), [ownedCoins])

  // Distribución por rareza (usando VALUE_TIERS)
  const rarityData = useMemo(() =>
    VALUE_TIERS.slice(0, 4).map(tier => ({
      name: `${tier.icon} ${tier.label}`,
      value: ownedCoins.filter(c => {
        const t = getCoinTier(c)
        return t.label === tier.label
      }).length,
      fill: tier.icon === '💎' ? '#7c3aed' : tier.icon === '🔵' ? '#3b82f6' : tier.icon === '🟢' ? '#14b8a6' : '#9ca3af',
    })),
  [ownedCoins])

  // Distribución por rareza — valor acumulado por tier
  const valueByTier = useMemo(() =>
    VALUE_TIERS.slice(0, 4).map(tier => {
      const coins = ownedCoins.filter(c => getCoinTier(c).label === tier.label)
      return {
        ...tier,
        count: coins.length,
        value: coins.reduce((s, c) => s + getEstimatedValue(c), 0),
      }
    }),
  [ownedCoins])

  const byCountry = useMemo(() =>
    COUNTRIES.map(c => {
      const coins = ALL_COINS.filter(x => x.country === c)
      const got = coins.filter(x => owned.has(x.id)).length
      return {
        country: c.length > 10 ? c.slice(0, 8) + '…' : c,
        total: coins.length, tengo: got, faltan: coins.length - got
      }
    }).sort((a, b) => b.tengo - a.tengo), [owned])

  const byYear = useMemo(() => {
    const years = [...new Set(ALL_COINS.map(c => c.year))].sort()
    return years.map(y => {
      const coins = ALL_COINS.filter(c => c.year === y)
      return { año: y, total: coins.length, tengo: coins.filter(c => owned.has(c.id)).length }
    })
  }, [owned])

  const pieData = [
    { name: 'Tengo', value: ownedCount },
    { name: 'Faltan', value: total - ownedCount },
  ]


  return (
    <div className="space-y-6">

      {/* KPIs principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total monedas', value: total, color: 'text-blue-700 dark:text-blue-400', icon: '🪙' },
          { label: 'En mi colección', value: ownedCount, color: 'text-green-600', icon: '✅' },
          { label: 'Me faltan', value: total - ownedCount, color: 'text-red-500', icon: '❌' },
          { label: 'Completado', value: `${pct}%`, color: 'text-yellow-500', icon: '🎯' },
        ].map(({ label, value, color, icon }) => (
          <div key={label} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 text-center">
            <div className="text-2xl mb-1">{icon}</div>
            <p className={`text-3xl font-bold ${color}`}>{value}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Valor estimado — cabecera */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5">
        <h2 className="font-semibold text-gray-700 dark:text-gray-200 mb-4">💰 Valor estimado de tu colección</h2>

        {/* Cifras principales */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-5">
          <div className="text-center">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Tu colección vale</p>
            <p className="text-3xl font-bold text-yellow-500">~{Math.round(totalValue).toLocaleString('es')}€</p>
            <p className="text-xs text-gray-400 mt-1">{ownedCoins.length} monedas</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Catálogo completo</p>
            <p className="text-3xl font-bold text-gray-300 dark:text-gray-600">~{Math.round(potentialValue).toLocaleString('es')}€</p>
            <p className="text-xs text-gray-400 mt-1">si tuvieras todo</p>
          </div>
          <div className="col-span-2 md:col-span-1 text-center">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">% del valor total</p>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {potentialValue > 0 ? Math.round((totalValue / potentialValue) * 100) : 0}%
            </p>
            <p className="text-xs text-gray-400 mt-1">del valor posible</p>
          </div>
        </div>

        {/* Barra de progreso de valor */}
        <div className="mb-5">
          <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
            <div
              className="h-3 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 transition-all duration-700"
              style={{ width: `${potentialValue > 0 ? (totalValue / potentialValue) * 100 : 0}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1 text-right">
            {Math.round(totalValue).toLocaleString('es')}€ de ~{Math.round(potentialValue).toLocaleString('es')}€
          </p>
        </div>

        {/* Desglose por tier de rareza */}
        <div className="space-y-2 mb-5">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Desglose por rareza</p>
          {valueByTier.map(tier => (
            <div key={tier.label} className="flex items-center gap-3">
              <span className="text-base w-5 shrink-0 text-center">{tier.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between text-xs mb-0.5">
                  <span className={tier.color}>{tier.label}</span>
                  <span className="text-gray-400">{tier.count} monedas · ~{Math.round(tier.value).toLocaleString('es')}€</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-1.5 rounded-full transition-all duration-500"
                    style={{
                      width: `${totalValue > 0 ? (tier.value / totalValue) * 100 : 0}%`,
                      backgroundColor: tier.icon === '💎' ? '#7c3aed' : tier.icon === '🔵' ? '#3b82f6' : tier.icon === '🟢' ? '#14b8a6' : '#9ca3af',
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Top 5 más valiosas */}
        {topCoins.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              Tus 5 monedas más valiosas
            </p>
            <div className="space-y-1.5">
              {topCoins.map((coin, i) => {
                const tier = getCoinTier(coin)
                return (
                  <button
                    key={coin.id}
                    onClick={() => navigate(`/moneda/${coin.id}`)}
                    className="w-full flex items-center gap-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg px-2 py-1.5 transition group"
                  >
                    <span className="text-xs font-bold text-gray-300 dark:text-gray-600 w-4">#{i + 1}</span>
                    <span className="text-sm">{tier.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                        {coin.country} · {coin.year}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{coin.description}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-sm font-bold ${tier.color}`}>~{formatValue(getEstimatedValue(coin))}</p>
                      {coin.mintage > 0 && (
                        <p className="text-xs text-gray-400">{coin.mintage.toLocaleString('es')} ud.</p>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <p className="text-xs text-gray-300 dark:text-gray-600 mt-4 text-center">
          * Estimación orientativa basada en acuñación. Los precios reales varían según estado y mercado.
        </p>
      </div>

      {/* Barra progreso */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
        <h2 className="font-semibold text-gray-700 dark:text-gray-200 mb-3">Progreso general</h2>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-600 to-green-500 h-4 rounded-full transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-sm text-gray-500 mt-2 text-right">
          {ownedCount} de {total} monedas ({pct}%)
        </p>
      </div>

      {/* Distribución por rareza */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
          <h2 className="font-semibold text-gray-700 dark:text-gray-200 mb-3">
            Distribución colección
          </h2>
          <div className="flex items-center justify-center">
            <PieChart width={180} height={180}>
              <Pie data={pieData} cx={90} cy={90} innerRadius={50} outerRadius={85} dataKey="value">
                <Cell fill="#16a34a" />
                <Cell fill="#e5e7eb" />
              </Pie>
              <Tooltip />
            </PieChart>
            <div className="ml-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="w-3 h-3 rounded-full bg-green-600 inline-block" />
                <span className="dark:text-gray-300">Tengo: {ownedCount}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="w-3 h-3 rounded-full bg-gray-200 inline-block" />
                <span className="dark:text-gray-300">Faltan: {total - ownedCount}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
          <h2 className="font-semibold text-gray-700 dark:text-gray-200 mb-3">
            Mis monedas por rareza
          </h2>
          <div className="flex items-center justify-center">
            <PieChart width={180} height={180}>
              <Pie data={rarityData} cx={90} cy={90} innerRadius={50} outerRadius={85} dataKey="value">
                {rarityData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Pie>
              <Tooltip />
            </PieChart>
            <div className="ml-4 space-y-2">
              {rarityData.map(({ name, value, fill }) => (
                <div key={name} className="flex items-center gap-2 text-xs">
                  <span className="w-3 h-3 rounded-full inline-block shrink-0" style={{ backgroundColor: fill }} />
                  <span className="dark:text-gray-300">{name}: {value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Por país */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
        <h2 className="font-semibold text-gray-700 dark:text-gray-200 mb-4">Monedas por país</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={byCountry} margin={{ bottom: 60 }}>
            <XAxis dataKey="country" angle={-45} textAnchor="end" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="tengo" name="Tengo" fill="#16a34a" stackId="a" />
            <Bar dataKey="faltan" name="Faltan" fill="#e5e7eb" stackId="a" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Por año */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
        <h2 className="font-semibold text-gray-700 dark:text-gray-200 mb-4">Evolución por año</h2>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={byYear}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="año" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="total" name="Total" stroke="#1d4ed8" dot={false} />
            <Line type="monotone" dataKey="tengo" name="Tengo" stroke="#16a34a" dot={false} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}