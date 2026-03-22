import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../supabase'
import { useCoins } from '../hooks/useCoins'
import { useAuth } from '../context/AuthContext'
import { useCoinImage } from '../hooks/useCoinImage'
import { showToast } from '../components/Toast'

const FILTERS = ['todas', 'ok', 'rejected', 'pending', 'sin_imagen']

function CoinImageCard({ coin, onReject, onUpload }) {
  const { src, status } = useCoinImage(coin)
  const [urlInput, setUrlInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const handleUpload = async () => {
    if (!urlInput.trim()) return
    setLoading(true)
    await onUpload(coin.id, urlInput.trim())
    setUrlInput('')
    setExpanded(false)
    setLoading(false)
  }

  const borderColor =
    coin.imgStatus === 'rejected' ? 'border-red-300' :
    coin.imgStatus === 'pending'  ? 'border-yellow-300' :
    !coin.supabaseUrl             ? 'border-gray-200' :
    'border-green-200'

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border-2 ${borderColor}`}>

      {/* Imagen */}
      <div className="bg-gray-50 dark:bg-gray-700 h-28 flex items-center justify-center relative">
        {!coin.supabaseUrl ? (
          <span className="text-3xl">❓</span>
        ) : status === 'error' ? (
          <span className="text-3xl">🪙</span>
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

        {/* Badge estado */}
        <span className={`absolute top-1 right-1 text-xs px-1.5 py-0.5 rounded-full font-medium ${
          coin.imgStatus === 'rejected' ? 'bg-red-100 text-red-600' :
          coin.imgStatus === 'pending'  ? 'bg-yellow-100 text-yellow-600' :
          !coin.supabaseUrl             ? 'bg-gray-100 text-gray-500' :
          'bg-green-100 text-green-600'
        }`}>
          {coin.imgStatus === 'rejected' ? '❌ Rechazada' :
           coin.imgStatus === 'pending'  ? '⏳ Pendiente' :
           !coin.supabaseUrl             ? '— Sin imagen' :
           '✅ OK'}
        </span>
      </div>

      {/* Info */}
      <div className="p-2 space-y-2">
        <div>
          <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 truncate">{coin.country}</p>
          <p className="text-sm font-bold text-gray-800 dark:text-white">{coin.year}</p>
          <p className="text-xs text-gray-400 truncate">{coin.id}</p>
        </div>

        {/* Acciones */}
        <div className="flex gap-1">
          {coin.supabaseUrl && coin.imgStatus !== 'rejected' && (
            <button
              onClick={() => onReject(coin.id)}
              className="flex-1 text-xs bg-red-50 hover:bg-red-100 text-red-600 py-1.5 rounded-lg transition"
            >
              ❌ Rechazar
            </button>
          )}
          <button
            onClick={() => setExpanded(e => !e)}
            className="flex-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 py-1.5 rounded-lg transition"
          >
            {expanded ? '✕ Cerrar' : '🔗 URL'}
          </button>
        </div>

        {/* Input URL */}
        {expanded && (
          <div className="space-y-1">
            <input
              type="text"
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              placeholder="https://..."
              className="w-full text-xs border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
              onKeyDown={e => e.key === 'Enter' && handleUpload()}
            />
            <button
              onClick={handleUpload}
              disabled={loading || !urlInput}
              className="w-full text-xs bg-blue-700 hover:bg-blue-800 text-white py-1.5 rounded-lg transition disabled:opacity-50"
            >
              {loading ? '⏳ Subiendo...' : '📤 Subir imagen'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AdminImagePage() {
  const { user } = useAuth()
  const [coinImages, setCoinImages] = useState({})
  const [filter, setFilter] = useState('todas')
  const [search, setSearch] = useState('')
  const [countryFilter, setCountryFilter] = useState('')
  const [loading, setLoading] = useState(true)
  
  const { ALL_COINS, COUNTRIES }  = useCoins()
  const [uploading, setUploading] = useState(null)

  useEffect(() => {
    loadImages()
  }, [])

  async function loadImages() {
    setLoading(true)
    const { data } = await supabase.from('coin_images').select('*')
    const map = {}
    for (const row of (data || [])) {
      map[row.coin_id] = row
    }
    setCoinImages(map)
    setLoading(false)
  }

  const countries = useMemo(() => {
    return [...new Set(ALL_COINS.map(c => c.country))].sort()
  }, [ALL_COINS])

  const coins = useMemo(() => {
    return ALL_COINS.map(coin => ({
      ...coin,
      supabaseUrl: coinImages[coin.id]?.supabase_url || coin.imageUrl || null,
      imgStatus: coinImages[coin.id]?.status || (coin.imageUrl ? 'ok' : 'pending'),
    }))
  }, [ALL_COINS, coinImages])

  const filtered = useMemo(() => {
    return coins.filter(coin => {
      const matchFilter =
        filter === 'todas'      ? true :
        filter === 'ok'         ? coin.imgStatus === 'ok' && coin.supabaseUrl :
        filter === 'rejected'   ? coin.imgStatus === 'rejected' :
        filter === 'pending'    ? coin.imgStatus === 'pending' :
        filter === 'sin_imagen' ? !coin.supabaseUrl :
        true
      const matchSearch = !search ||
        coin.country.toLowerCase().includes(search.toLowerCase()) ||
        coin.year.toString().includes(search) ||
        coin.id.toLowerCase().includes(search.toLowerCase()) ||
        coin.description.toLowerCase().includes(search.toLowerCase())
      const matchCountry = !countryFilter || coin.country === countryFilter
      return matchFilter && matchSearch && matchCountry
    })
  }, [coins, filter, search, countryFilter])

  const stats = useMemo(() => ({
    ok:         coins.filter(c => c.imgStatus === 'ok' && c.supabaseUrl).length,
    rejected:   coins.filter(c => c.imgStatus === 'rejected').length,
    pending:    coins.filter(c => c.imgStatus === 'pending').length,
    sin_imagen: coins.filter(c => !c.supabaseUrl).length,
  }), [coins])

  const handleReject = async (coinId) => {
    const url = coinImages[coinId]?.supabase_url || ''
    const ext = url.includes('.png') ? 'png' : 'jpg'

    // Borramos de Storage
    await supabase.storage.from('coins').remove([`${coinId}.${ext}`])

    // Actualizamos en coin_images
    await supabase.from('coin_images').upsert({
      coin_id: coinId,
      supabase_url: null,
      status: 'rejected',
      rejected_at: new Date().toISOString(),
      rejected_by: user.id
    })

    // Actualizamos estado local
    setCoinImages(prev => ({
      ...prev,
      [coinId]: { ...prev[coinId], supabase_url: null, status: 'rejected' }
    }))
  }

  const handleUpload = async (coinId, imageUrl) => {
    setUploading(coinId)
    try {
      const { data: { session } } = await supabase.auth.getSession()

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-coin-image`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ coinId, imageUrl })
        }
      )

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      // Forzamos recarga de imagen con timestamp
      setCoinImages(prev => ({
        ...prev,
        [coinId]: {
          coin_id: coinId,
          supabase_url: `${data.url}?t=${Date.now()}`,
          status: 'ok'
        }
      }))

    } catch (e) {
      showToast(`Error: ${e.message}`, 'error')
    }
    setUploading(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          🖼️ Gestión de imágenes
        </h1>
        <button
          onClick={loadImages}
          className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-gray-600 dark:text-gray-300 px-4 py-2 rounded-lg text-sm transition"
        >
          🔄 Recargar
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: '✅ OK',          value: stats.ok,          color: 'text-green-600' },
          { label: '❌ Rechazadas',  value: stats.rejected,    color: 'text-red-500' },
          { label: '⏳ Pendientes',  value: stats.pending,     color: 'text-yellow-500' },
          { label: '— Sin imagen',   value: stats.sin_imagen,  color: 'text-gray-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-3 text-center">
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-3 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="🔍 Buscar por país, año, ID o descripción..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-48 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <select
          value={countryFilter}
          onChange={e => setCountryFilter(e.target.value)}
          className="border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="">Todos los países</option>
          {countries.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <div className="flex gap-1 flex-wrap">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                filter === f
                  ? 'bg-blue-700 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {f === 'todas'      ? `Todas (${coins.length})` :
               f === 'ok'         ? `✅ OK (${stats.ok})` :
               f === 'rejected'   ? `❌ Rechazadas (${stats.rejected})` :
               f === 'pending'    ? `⏳ Pendientes (${stats.pending})` :
               `— Sin imagen (${stats.sin_imagen})`}
            </button>
          ))}
        </div>

        <span className="text-sm text-gray-400 self-center">
          {filtered.length} monedas
        </span>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">
          <div className="w-8 h-8 border-4 border-blue-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
          Cargando imágenes...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <span className="text-4xl">🔍</span>
          <p className="mt-2">No se encontraron monedas</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filtered.map(coin => (
            <CoinImageCard
              key={`${coin.id}-${coinImages[coin.id]?.supabase_url}`}
              coin={coin}
              onReject={handleReject}
              onUpload={handleUpload}
            />
          ))}
        </div>
      )}
    </div>
  )
}