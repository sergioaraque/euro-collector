import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useCoins } from '../hooks/useCoins'
import { showToast } from './Toast'

const MESSAGE_TYPES = [
  { value: 'general',     label: '💬 General' },
  { value: 'looking_for', label: '🔍 Busco moneda' },
  { value: 'have_extra',  label: '🤝 Tengo de sobra' },
]

export default function WallComposer({
  onSend,
  placeholder = '¿Qué quieres compartir con la comunidad?',
  compact = false,
  hideTypeSelector = false,
}) {
  const [message, setMessage] = useState('')
  const [type, setType] = useState('general')
  const [coinSearch, setCoinSearch] = useState('')
  const [selectedCoin, setSelectedCoin] = useState(null)
  const [showCoinSearch, setShowCoinSearch] = useState(false)
  const { ALL_COINS, COUNTRIES, loading } = useCoins()
  const [sending, setSending] = useState(false)

    const { user, profile } = useAuth()
    const username = profile?.username || user?.email?.split('@')[0] || 'Usuario'

  const coinResults = coinSearch.length > 1
    ? ALL_COINS.filter(c =>
        c.country.toLowerCase().includes(coinSearch.toLowerCase()) ||
        c.description.toLowerCase().includes(coinSearch.toLowerCase()) ||
        c.year.toString().includes(coinSearch)
      ).slice(0, 5)
    : []

  const handleSend = async () => {
    if (!message.trim() || sending) return
    setSending(true)
    try {
      const result = await onSend({
        message,
        type,
        coinId: selectedCoin?.id || null,
        username,
      })
      if (result?.error) {
        if (result.error.message?.includes('Rate limit')) {
          showToast('Has alcanzado el límite de 10 mensajes por hora. Inténtalo más tarde.', 'error')
        } else {
          showToast('Error al enviar el mensaje. Inténtalo de nuevo.', 'error')
        }
        return
      }
      setMessage('')
      setSelectedCoin(null)
      setCoinSearch('')
      setType('general')
      setShowCoinSearch(false)
    } catch {
      showToast('Error al enviar el mensaje. Inténtalo de nuevo.', 'error')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 space-y-3 ${compact ? 'shadow-none border border-gray-100 dark:border-gray-700' : ''}`}>
      {!compact && (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-800 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0">
            {username[0]?.toUpperCase()}
          </div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{username}</p>
        </div>
      )}

      {/* Selector de tipo */}
      {!hideTypeSelector && (
        <div className="flex gap-2 flex-wrap">
          {MESSAGE_TYPES.map(t => (
            <button
              key={t.value}
              onClick={() => {
                setType(t.value)
                setShowCoinSearch(t.value !== 'general')
              }}
              className={`text-xs px-3 py-1.5 rounded-full transition font-medium ${
                type === t.value
                  ? 'bg-blue-700 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 hover:bg-gray-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Textarea */}
      <textarea
        value={message}
        onChange={e => setMessage(e.target.value)}
        placeholder={placeholder}
        rows={compact ? 2 : 3}
        className="w-full text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
        onKeyDown={e => {
          if (e.key === 'Enter' && e.metaKey) handleSend()
        }}
      />

      {/* Buscar moneda */}
      {showCoinSearch && (
        <div className="relative">
          <input
            type="text"
            value={selectedCoin ? `🪙 ${selectedCoin.country} ${selectedCoin.year} — ${selectedCoin.description}` : coinSearch}
            onChange={e => {
              setSelectedCoin(null)
              setCoinSearch(e.target.value)
            }}
            placeholder="🔍 Busca la moneda (país, año, descripción)..."
            className="w-full text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          {selectedCoin && (
            <button
              onClick={() => { setSelectedCoin(null); setCoinSearch('') }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-400 text-xs"
            >
              ✕
            </button>
          )}
          {coinResults.length > 0 && !selectedCoin && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 z-10 overflow-hidden">
              {coinResults.map(coin => (
                <button
                  key={coin.id}
                  onClick={() => { setSelectedCoin(coin); setCoinSearch('') }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 transition"
                >
                  <span className="font-medium text-gray-800 dark:text-white">{coin.country} {coin.year}</span>
                  <span className="text-gray-400 ml-2 text-xs">{coin.description}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        {!hideTypeSelector && (
          <button
            onClick={() => setShowCoinSearch(s => !s)}
            className="text-xs text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
          >
            {showCoinSearch ? '✕ Quitar moneda' : '🪙 Mencionar moneda'}
          </button>
        )}
        <div className={`flex items-center gap-2 ${hideTypeSelector ? 'ml-auto' : ''}`}>
          <span className="text-xs text-gray-300">{message.length}/500</span>
          <button
            onClick={handleSend}
            disabled={!message.trim() || sending || message.length > 500}
            className="bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium px-4 py-2 rounded-xl transition disabled:opacity-50"
          >
            {sending ? '...' : compact ? 'Responder' : 'Publicar'}
          </button>
        </div>
      </div>
    </div>
  )
}