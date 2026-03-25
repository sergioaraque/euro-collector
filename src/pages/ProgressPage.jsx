import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { useCollection } from '../context/CollectionContext'
import { useCoins } from '../hooks/useCoins'
import { useSEO } from '../hooks/useSEO'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, ResponsiveContainer
} from 'recharts'

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('es', { day: 'numeric', month: 'short' })
}

function formatWeek(dateStr) {
  const d = new Date(dateStr)
  return `${d.getDate()}/${d.getMonth() + 1}`
}


export default function ProgressPage() {
  
  const { ALL_COINS, COUNTRIES } = useCoins()
  useSEO({ title: 'Mi progreso' })
  const { user } = useAuth()
  const { owned } = useCollection()
  const navigate = useNavigate()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [granularity, setGranularity] = useState('day')

const TOTAL = ALL_COINS.length
  useEffect(() => {
    if (!user) return
    supabase
      .from('activity_log')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setLogs(data || [])
        setLoading(false)
      })
  }, [user])

  // Gráfica 1: crecimiento acumulado (por día / semana / mes)
  const growthData = useMemo(() => {
    if (!logs.length) return []
    let total = 0
    const byPeriod = {}

    function getPeriodKey(dateStr) {
      if (granularity === 'month') return dateStr.slice(0, 7)
      if (granularity === 'week') {
        const d = new Date(dateStr)
        const day = d.getDay()
        const monday = new Date(d)
        monday.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
        return monday.toISOString().slice(0, 10)
      }
      return dateStr.slice(0, 10)
    }

    function formatPeriod(key) {
      if (granularity === 'month') {
        const [year, month] = key.split('-')
        return new Date(year, month - 1, 1).toLocaleDateString('es', { month: 'short', year: '2-digit' })
      }
      return formatDate(key)
    }

    for (const log of logs) {
      if (log.action === 'add') total++
      if (log.action === 'remove') total--
      const key = getPeriodKey(log.created_at)
      byPeriod[key] = total
    }

    return Object.entries(byPeriod)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, count]) => ({
        date: key,
        label: formatPeriod(key),
        count,
        pct: Math.round((count / TOTAL) * 100)
      }))
  }, [logs, granularity, TOTAL])

  // Gráfica 2: actividad por semana (añadidas - eliminadas)
  const weeklyData = useMemo(() => {
    if (!logs.length) return []
    const byWeek = {}
    for (const log of logs) {
      if (log.action !== 'add' && log.action !== 'remove') continue
      const d = new Date(log.created_at)
      // Lunes de esa semana
      const day = d.getDay()
      const diff = d.getDate() - day + (day === 0 ? -6 : 1)
      const monday = new Date(d.setDate(diff))
      const key = monday.toISOString().slice(0, 10)
      if (!byWeek[key]) byWeek[key] = { added: 0, removed: 0 }
      if (log.action === 'add') byWeek[key].added++
      if (log.action === 'remove') byWeek[key].removed++
    }
    return Object.entries(byWeek)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({
        label: formatWeek(date),
        añadidas: v.added,
        eliminadas: v.removed,
      }))
  }, [logs])

  // Países completados en orden
  const completedCountries = useMemo(() => {
    return logs
      .filter(l => l.action === 'complete_country')
      .map(l => ({ country: l.country, date: l.created_at }))
  }, [logs])

  // Estadísticas de racha
  const streakStats = useMemo(() => {
    if (!logs.length) return { current: 0, best: 0 }
    const activeDays = new Set(
      logs
        .filter(l => l.action === 'add' || l.action === 'remove')
        .map(l => l.created_at.slice(0, 10))
    )
    const sorted = [...activeDays].sort()

    let currentStreak = 0
    let bestStreak = 0
    let streak = 1

    for (let i = 1; i < sorted.length; i++) {
      const prev = new Date(sorted[i - 1])
      const curr = new Date(sorted[i])
      const diff = (curr - prev) / 86400000
      if (diff === 1) {
        streak++
      } else {
        bestStreak = Math.max(bestStreak, streak)
        streak = 1
      }
    }
    bestStreak = Math.max(bestStreak, streak)

    // Racha actual — ¿el último día activo fue ayer o hoy?
    const today = new Date().toISOString().slice(0, 10)
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
    const lastDay = sorted[sorted.length - 1]
    if (lastDay === today || lastDay === yesterday) {
      let s = 1
      for (let i = sorted.length - 1; i > 0; i--) {
        const prev = new Date(sorted[i - 1])
        const curr = new Date(sorted[i])
        if ((curr - prev) / 86400000 === 1) s++
        else break
      }
      currentStreak = s
    }

    return { current: currentStreak, best: bestStreak, activeDays: activeDays.size }
  }, [logs])

  // Esta semana vs semana pasada
  const weekComparison = useMemo(() => {
    const now = new Date()
    const startOfThisWeek = new Date(now)
    const day = startOfThisWeek.getDay()
    startOfThisWeek.setDate(startOfThisWeek.getDate() - (day === 0 ? 6 : day - 1))
    startOfThisWeek.setHours(0, 0, 0, 0)

    const startOfLastWeek = new Date(startOfThisWeek)
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7)

    let thisWeek = 0, lastWeek = 0
    for (const log of logs) {
      if (log.action !== 'add') continue
      const d = new Date(log.created_at)
      if (d >= startOfThisWeek) thisWeek++
      else if (d >= startOfLastWeek) lastWeek++
    }
    return { thisWeek, lastWeek, diff: thisWeek - lastWeek }
  }, [logs])

  const countriesLeft = useMemo(() => {
    return COUNTRIES
      .map(c => {
        const coins = ALL_COINS.filter(x => x.country === c)
        const got = coins.filter(x => owned.has(x.id)).length
        const missing = coins.length - got
        const pct = Math.round((got / coins.length) * 100)
        return { country: c, total: coins.length, got, missing, pct }
      })
      .filter(c => c.pct < 100)
      .sort((a, b) => a.missing - b.missing)
  }, [COUNTRIES, ALL_COINS, owned])

  const currentTotal = owned.size
  const currentPct = Math.round((currentTotal / TOTAL) * 100)

  if (loading) return (
    <div className="flex items-center justify-center py-20 gap-2 text-gray-400">
      <div className="w-6 h-6 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
      Cargando progreso...
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
        📈 Mi progreso
      </h1>

      {/* Resumen rápido */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 text-center">
          <p className="text-3xl font-bold text-blue-700 dark:text-blue-400">{currentTotal}</p>
          <p className="text-xs text-gray-400 mt-1">monedas totales</p>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-300">{currentPct}% del catálogo</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 text-center">
          <p className="text-3xl font-bold text-green-600">{weekComparison.thisWeek}</p>
          <p className="text-xs text-gray-400 mt-1">esta semana</p>
          <p className={`text-xs font-medium mt-0.5 ${weekComparison.diff > 0 ? 'text-green-500' : weekComparison.diff < 0 ? 'text-red-400' : 'text-gray-400'}`}>
            {weekComparison.diff > 0 ? `+${weekComparison.diff}` : weekComparison.diff === 0 ? '= igual' : weekComparison.diff} vs semana pasada
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 text-center">
          <p className="text-3xl font-bold text-yellow-500">🔥 {streakStats.current}</p>
          <p className="text-xs text-gray-400 mt-1">racha actual (días)</p>
          <p className="text-xs text-gray-400">récord: {streakStats.best} días</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 text-center">
          <p className="text-3xl font-bold text-purple-600">{completedCountries.length}</p>
          <p className="text-xs text-gray-400 mt-1">países completados</p>
          <p className="text-xs text-gray-400">{streakStats.activeDays} días activo</p>
        </div>
      </div>

      {/* Gráfica crecimiento */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="font-semibold text-gray-700 dark:text-gray-200">
            📊 Crecimiento de la colección
          </h2>
          <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 text-xs">
            {[
              { value: 'day',   label: 'Día' },
              { value: 'week',  label: 'Semana' },
              { value: 'month', label: 'Mes' },
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setGranularity(value)}
                className={`px-3 py-1.5 transition ${
                  granularity === value
                    ? 'bg-blue-700 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        {growthData.length < 2 ? (
          <p className="text-sm text-gray-400 text-center py-8">Aún no hay suficientes datos — añade más monedas</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={growthData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip
                formatter={(value) => [`${value} monedas`, 'Total']}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#colorCount)"
                dot={false}
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Gráfica actividad semanal */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 sm:p-6">
        <h2 className="font-semibold text-gray-700 dark:text-gray-200 mb-4">
          📅 Actividad semanal
        </h2>
        {weeklyData.length < 2 ? (
          <p className="text-sm text-gray-400 text-center py-8">Aún no hay suficientes datos</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
              />
              <Bar dataKey="añadidas" fill="#4ade80" radius={[4, 4, 0, 0]} />
              <Bar dataKey="eliminadas" fill="#f87171" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Países completados */}
      {completedCountries.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 sm:p-6">
          <h2 className="font-semibold text-gray-700 dark:text-gray-200 mb-4">
            🏆 Países completados
          </h2>
          <div className="space-y-2">
            {completedCountries.map((c, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-700 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-yellow-500 font-bold text-sm">#{i + 1}</span>
                  <span className="font-medium text-gray-700 dark:text-gray-200 text-sm">{c.country}</span>
                </div>
                <span className="text-xs text-gray-400">{formatDate(c.date)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Barra progreso total */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 sm:p-6">
        <div className="flex justify-between items-center mb-2">
          <h2 className="font-semibold text-gray-700 dark:text-gray-200">🎯 Progreso hacia el catálogo completo</h2>
          <span className="text-sm font-bold text-blue-700 dark:text-blue-400">{currentTotal}/{TOTAL}</span>
        </div>
        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
          <div
            className="h-4 rounded-full bg-gradient-to-r from-blue-500 to-blue-700 transition-all duration-500"
            style={{ width: `${currentPct}%` }}
          />
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-xs text-gray-400">{currentPct}% completado</span>
          <span className="text-xs text-gray-400">Faltan {TOTAL - currentTotal} monedas</span>
        </div>
      </div>

      {/* Países por completar */}
      {countriesLeft.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-700 dark:text-gray-200">🎯 Países por completar</h2>
            <span className="text-xs text-gray-400">{countriesLeft.length} restantes</span>
          </div>
          <div className="space-y-3">
            {countriesLeft.map(({ country, total, got, missing, pct }) => (
              <button
                key={country}
                onClick={() => navigate(`/coleccion?country=${encodeURIComponent(country)}`)}
                className="w-full text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl p-2.5 transition group"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                    {country}
                  </span>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    {missing <= 3 && (
                      <span className="text-xs font-semibold text-orange-400">¡Casi!</span>
                    )}
                    <span className="text-xs text-gray-400">{got}/{total}</span>
                    <span className="text-xs bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-300 rounded-full px-2 py-0.5 font-medium">
                      faltan {missing}
                    </span>
                  </div>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-600 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                      pct >= 80 ? 'bg-orange-400' :
                      pct >= 50 ? 'bg-blue-500' :
                      pct > 0   ? 'bg-yellow-400' : 'bg-gray-200 dark:bg-gray-500'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}