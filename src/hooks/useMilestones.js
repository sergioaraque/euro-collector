import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { useCollection } from '../context/CollectionContext'
import { useCoins } from './useCoins'

// ── Helpers localStorage ───────────────────────────────────────────────────────

function isSeen(id)   { return !!localStorage.getItem(`ms_${id}`) }
function markSeen(id) { localStorage.setItem(`ms_${id}`, '1') }

// ── Definiciones de hitos ─────────────────────────────────────────────────────

function buildCandidates({ ownedCount, totalCoins, streak, completedCountries, firstDate }) {
  const pct = totalCoins > 0 ? Math.round((ownedCount / totalCoins) * 100) : 0
  const candidates = []

  // Aniversario (±3 días)
  if (firstDate) {
    const today = new Date()
    const years = today.getFullYear() - firstDate.getFullYear()
    if (years > 0) {
      const anniv = new Date(today.getFullYear(), firstDate.getMonth(), firstDate.getDate())
      const diff = Math.abs(today - anniv) / 86_400_000
      if (diff <= 3) {
        const id = `anniversary_${years}`
        if (!isSeen(id)) candidates.push({
          id, priority: 0,
          icon: '🎂',
          title: `¡${years} año${years > 1 ? 's' : ''} coleccionando!`,
          body: `Hoy hace ${years} año${years > 1 ? 's' : ''} que añadiste tu primera moneda. ¡Felicidades!`,
          gradient: 'from-pink-500 to-rose-600',
        })
      }
    }
  }

  // Países completados
  for (const n of [1, 3, 5, 10, 15, 20, 24]) {
    const id = `countries_${n}`
    if (completedCountries >= n && !isSeen(id)) {
      candidates.push({
        id, priority: 1,
        icon: n === 24 ? '🌟' : n >= 10 ? '🌍' : '🗺️',
        title: n === 1  ? '¡Primer país completado!'
             : n === 24 ? '¡Colección completa por países!'
             : `¡${n} países completados!`,
        body: n === 1
          ? '¡Has completado tu primer país de la eurozona. Buen comienzo!'
          : `¡Tienes ${n} países de la eurozona con todas sus monedas!`,
        gradient: 'from-teal-500 to-emerald-600',
      })
      break
    }
  }

  // Porcentaje del catálogo
  for (const p of [10, 25, 50, 75, 90, 100]) {
    const id = `pct_${p}`
    if (pct >= p && !isSeen(id)) {
      candidates.push({
        id, priority: 2,
        icon: p === 100 ? '👑' : p >= 75 ? '🏆' : p >= 50 ? '⭐' : '🎯',
        title: p === 100 ? '¡Colección completa!' : `¡${p}% del catálogo!`,
        body: p === 100
          ? '¡Increíble! Tienes todas las monedas conmemorativas de 2€. ¡Eres un leyenda!'
          : `Ya tienes el ${p}% de todas las monedas conmemorativas de 2€. ¡Sigue así!`,
        gradient: p === 100 ? 'from-yellow-300 to-amber-500'
                : p >= 75   ? 'from-yellow-400 to-orange-500'
                : 'from-blue-500 to-indigo-600',
      })
      break
    }
  }

  // Cantidad de monedas
  for (const n of [10, 25, 50, 75, 100, 150, 200, 250, 300]) {
    const id = `coins_${n}`
    if (ownedCount >= n && !isSeen(id)) {
      candidates.push({
        id, priority: 3,
        icon: '🪙',
        title: `¡${n} monedas en tu colección!`,
        body: n >= 200
          ? `${n} monedas y contando. Tu colección es impresionante.`
          : `Has alcanzado las ${n} monedas. ¡Vas muy bien!`,
        gradient: 'from-blue-600 to-blue-800',
      })
      break
    }
  }

  // Racha de días activos
  for (const days of [3, 7, 14, 30, 60, 100]) {
    const id = `streak_${days}`
    if (streak >= days && !isSeen(id)) {
      candidates.push({
        id, priority: 4,
        icon: '🔥',
        title: `¡${days} días de racha!`,
        body: days >= 30
          ? `Llevas ${days} días consecutivos añadiendo monedas. ¡Eres un coleccionista de verdad!`
          : `${days} días seguidos activo. ¡Mantén el ritmo!`,
        gradient: 'from-orange-400 to-red-600',
      })
      break
    }
  }

  return candidates.sort((a, b) => a.priority - b.priority)
}

// ── Hook principal ─────────────────────────────────────────────────────────────

export function useMilestones() {
  const { user } = useAuth()
  const { owned } = useCollection()
  const { ALL_COINS, COUNTRIES } = useCoins()
  const [logs, setLogs] = useState(null)
  const [milestone, setMilestone] = useState(null)

  // Carga el activity_log una sola vez
  useEffect(() => {
    if (!user) return
    supabase
      .from('activity_log')
      .select('action, created_at, country')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .then(({ data }) => setLogs(data || []))
  }, [user?.id])

  // Recalcula hitos cuando cambia la colección o los logs
  useEffect(() => {
    if (logs === null || !ALL_COINS.length || milestone) return

    // Primera moneda añadida
    const firstEntry = logs.find(l => l.action === 'add')
    const firstDate = firstEntry ? new Date(firstEntry.created_at) : null

    // Racha actual
    const activeDays = [...new Set(
      logs
        .filter(l => l.action === 'add' || l.action === 'remove')
        .map(l => l.created_at.slice(0, 10))
    )].sort()

    let streak = 0
    if (activeDays.length > 0) {
      const today     = new Date().toISOString().slice(0, 10)
      const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10)
      const last      = activeDays[activeDays.length - 1]
      if (last === today || last === yesterday) {
        streak = 1
        for (let i = activeDays.length - 1; i > 0; i--) {
          const diff = (new Date(activeDays[i]) - new Date(activeDays[i - 1])) / 86_400_000
          if (diff === 1) streak++
          else break
        }
      }
    }

    // Países completados
    const completedCountries = COUNTRIES.filter(c => {
      const coins = ALL_COINS.filter(x => x.country === c)
      return coins.length > 0 && coins.every(x => owned.has(x.id))
    }).length

    const candidates = buildCandidates({
      ownedCount: owned.size,
      totalCoins: ALL_COINS.length,
      streak,
      completedCountries,
      firstDate,
    })

    if (candidates.length > 0) setMilestone(candidates[0])
  }, [logs, owned, ALL_COINS, COUNTRIES])

  const dismiss = () => {
    if (milestone) {
      markSeen(milestone.id)
      setMilestone(null)
    }
  }

  return { milestone, dismiss }
}
