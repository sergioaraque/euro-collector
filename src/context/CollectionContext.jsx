import { createContext, useContext, useCallback, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../supabase'
import { useAuth } from './AuthContext'
import { useCoins } from '../hooks/useCoins'
import { notifyCountryComplete } from '../lib/discord'
import { showToast } from '../components/Toast'
import { checkAndAwardBadges } from '../lib/badges'

const CollectionContext = createContext(null)

export function CollectionProvider({ children }) {
  const { user, profile } = useAuth()
  const queryClient = useQueryClient()
  const { ALL_COINS, COUNTRIES}  = useCoins()

  // Clave de caché única por usuario
  const queryKey = ['collection', user?.id]
  const extrasKey = ['extras', user?.id]

  // Fetch con React Query — cachea 5 minutos, no refetch en cada navegación
  const { data: owned = new Set(), isLoading: loading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!user) return new Set()
      const { data } = await supabase
        .from('collection')
        .select('coin_id')
        .eq('user_id', user.id)
      return new Set((data || []).map(r => r.coin_id))
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  })

  const { data: extras = new Map() } = useQuery({
    queryKey: extrasKey,
    queryFn: async () => {
      if (!user) return new Map()
      const { data } = await supabase
        .from('coin_extras')
        .select('coin_id, quantity')
        .eq('user_id', user.id)
      const map = new Map()
      for (const row of data || []) map.set(row.coin_id, row.quantity)
      return map
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  })

  const updateExtra = useCallback(async (coinId, quantity) => {
    if (!user) return
    const key = ['extras', user.id]
    if (quantity < 2) {
      await supabase.from('coin_extras').delete()
        .eq('user_id', user.id).eq('coin_id', coinId)
      queryClient.setQueryData(key, prev => {
        const next = new Map(prev)
        next.delete(coinId)
        return next
      })
    } else {
      await supabase.from('coin_extras').upsert({ user_id: user.id, coin_id: coinId, quantity })
      queryClient.setQueryData(key, prev => new Map(prev).set(coinId, quantity))
    }
  }, [user, queryClient])

  const logActivity = async (action, coinId, country) => {
    try {
      await supabase.from('activity_log').insert({
        user_id: user.id,
        action,
        coin_id: coinId || null,
        country: country || null,
      })
    } catch (e) {
      console.error('Error guardando actividad:', e)
    }
  }

  const togglingRef = useRef(new Set())

  const toggleCoin = useCallback(async (coinId) => {
    if (!user || togglingRef.current.has(coinId)) return
    togglingRef.current.add(coinId)
    const isOwned = owned.has(coinId)
    const coin = ALL_COINS.find(c => c.id === coinId)

    if (isOwned) {
      // Actualización optimista — actualiza caché antes de la llamada a Supabase
      const newOwned = new Set(owned)
      newOwned.delete(coinId)
      queryClient.setQueryData(queryKey, newOwned)

      const { error: deleteError } = await supabase.from('collection').delete()
        .eq('user_id', user.id).eq('coin_id', coinId)

      if (deleteError) {
        queryClient.setQueryData(queryKey, owned) // revertir
        showToast('Error al eliminar la moneda', 'error')
        togglingRef.current.delete(coinId)
        return
      }

      showToast(`${coin?.country} ${coin?.year} eliminada`, 'info')
      await logActivity('remove', coinId, coin?.country)
    } else {
      // Actualización optimista
      const newOwned = new Set([...owned, coinId])
      queryClient.setQueryData(queryKey, newOwned)

      const { error: insertError } = await supabase.from('collection').insert({ user_id: user.id, coin_id: coinId })

      if (insertError) {
        queryClient.setQueryData(queryKey, owned) // revertir
        showToast('Error al añadir la moneda', 'error')
        togglingRef.current.delete(coinId)
        return
      }

      showToast(`🪙 ${coin?.country} ${coin?.year} añadida`, 'success')
      await logActivity('add', coinId, coin?.country)

      if (coin) {
        const countryCoins = ALL_COINS.filter(c => c.country === coin.country)
        const allOwned = countryCoins.every(c => newOwned.has(c.id))
        if (allOwned) {
          showToast(`🏆 ¡${coin.country} completado al 100%!`, 'success')
          await notifyCountryComplete(user.email, profile?.username, coin.country, countryCoins.length)
          await logActivity('complete_country', null, coin.country)
        }
      }

      // Verificamos insignias después de añadir
      const newBadges = await checkAndAwardBadges(user.id, newOwned, ALL_COINS)
      for (const badgeId of newBadges) {
        const { data } = await supabase
          .from('badges')
          .select('name, icon')
          .eq('id', badgeId)
          .maybeSingle()
        if (data) showToast(`${data.icon} ¡Insignia desbloqueada! ${data.name}`, 'success')
      }
    }
    togglingRef.current.delete(coinId)
  }, [user, profile, owned, queryKey, queryClient])

  return (
    <CollectionContext.Provider value={{ owned, loading, toggleCoin, extras, updateExtra }}>
      {children}
    </CollectionContext.Provider>
  )
}

export const useCollection = () => useContext(CollectionContext)