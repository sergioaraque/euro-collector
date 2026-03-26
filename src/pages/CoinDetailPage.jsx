import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useCoins } from '../hooks/useCoins'
import { useCollection } from '../context/CollectionContext'
import { useCoinImage } from '../hooks/useCoinImage'
import { useCoinNote } from '../hooks/useCoinNote'
import { useTranslation } from 'react-i18next'
import { useSEO } from '../hooks/useSEO'
import { supabase } from '../supabase'
import { getCoinTier, formatValue, getEstimatedValue } from '../lib/coinValue'

export default function CoinDetailPage() {
  const { coinId } = useParams()
  const navigate = useNavigate()
  const { owned, toggleCoin, extras, updateExtra } = useCollection()
  const { ALL_COINS, COUNTRIES, loading } = useCoins()
  const coin = ALL_COINS.find(c => c.id === coinId)
  const { src, status } = useCoinImage(coin || {})
  const { t } = useTranslation()
  const { note, setNote, saving, loading: noteLoading, saveNote } = useCoinNote(coinId)
  const [editingNote, setEditingNote] = useState(false)
  const [noteInput, setNoteInput] = useState('')
  const [showImageModal, setShowImageModal] = useState(false)
  const [ownerCount, setOwnerCount] = useState(null)

  useSEO({ title: coin?.description || 'Detalle de moneda' })

  useEffect(() => {
    window.scrollTo(0, 0)
    setOwnerCount(null)
  }, [coinId])

  useEffect(() => {
    if (!coin) return
    supabase
      .from('global_coin_stats')
      .select('owner_count')
      .eq('coin_id', coin.id)
      .maybeSingle()
      .then(({ data }) => setOwnerCount(data?.owner_count ?? 0))
  }, [coin?.id])

  if (loading) return (
    <div className="text-center py-20 text-gray-400">Cargando...</div>
  )

  if (!coin) return (
    <div className="text-center py-20">
      <p className="text-gray-400">{t('coinNotFound')}</p>
      <button onClick={() => navigate(-1)} className="mt-4 text-blue-600 hover:underline">
        {t('back')}
      </button>
    </div>
  )

  const isOwned = owned.has(coin.id)
  const quantity = extras.get(coin.id) || 1

  const countryCoins = ALL_COINS
    .filter(c => c.country === coin.country)
    .sort((a, b) => a.year - b.year)
  const currentIndex = countryCoins.findIndex(c => c.id === coin.id)
  const prevCoin = currentIndex > 0 ? countryCoins[currentIndex - 1] : null
  const nextCoin = currentIndex < countryCoins.length - 1 ? countryCoins[currentIndex + 1] : null
  const sameCountry = countryCoins.filter(c => c.id !== coin.id)
  const sameYear = ALL_COINS.filter(c => c.year === coin.year && c.id !== coin.id)

  const handleEditNote = () => {
    setNoteInput(note)
    setEditingNote(true)
  }

  const handleSaveNote = async () => {
    await saveNote(noteInput)
    setEditingNote(false)
  }

  const handleCancelNote = () => {
    setNoteInput(note)
    setEditingNote(false)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
            {/* Modal imagen */}
      {showImageModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setShowImageModal(false)}
        >
          <div className="relative max-w-lg w-full" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute -top-10 right-0 text-white text-2xl hover:text-gray-300 transition"
            >
              ✕
            </button>
            <img
              src={src}
              alt={coin.description}
              className="w-full h-auto object-contain rounded-2xl shadow-2xl"
            />
            <p className="text-center text-white text-sm mt-3 opacity-70">
              {coin.country} · {coin.year} · {coin.description}
            </p>
          </div>
        </div>
      )}
      
      {/* Navegación */}
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={() => navigate(-1)}
          className="text-blue-600 dark:text-blue-400 hover:underline text-sm flex items-center gap-1"
        >
          {t('backToCollection')}
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => prevCoin && navigate(`/moneda/${prevCoin.id}`)}
            disabled={!prevCoin}
            className="px-2.5 py-1.5 rounded-lg text-sm border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
            title={prevCoin ? `${prevCoin.year} — ${prevCoin.description}` : ''}
          >
            ← {prevCoin?.year ?? ''}
          </button>
          <span className="text-xs text-gray-400">{currentIndex + 1}/{countryCoins.length}</span>
          <button
            onClick={() => nextCoin && navigate(`/moneda/${nextCoin.id}`)}
            disabled={!nextCoin}
            className="px-2.5 py-1.5 rounded-lg text-sm border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
            title={nextCoin ? `${nextCoin.year} — ${nextCoin.description}` : ''}
          >
            {nextCoin?.year ?? ''} →
          </button>
        </div>
      </div>

      {/* Card principal */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-br from-blue-800 to-blue-900 p-8 flex justify-center cursor-zoom-in"
            onClick={() => status === 'ok' && setShowImageModal(true)}
          >
          {status === 'error' ? (
            <span className="text-8xl">🪙</span>
          ) : (
            <img
              src={src}
              alt={coin.description}
              className={`h-48 w-48 object-contain drop-shadow-2xl transition-opacity ${
                status === 'ok' ? 'opacity-100' : 'opacity-0'
              }`}
            />
          )}
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                {coin.country} · {coin.year}
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">{coin.description}</p>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <button
                onClick={() => toggleCoin(coin.id)}
                className={`px-4 py-2 rounded-xl font-medium text-sm transition ${
                  isOwned
                    ? 'bg-green-500 text-white hover:bg-red-400'
                    : 'bg-blue-700 text-white hover:bg-blue-800'
                }`}
              >
                {isOwned ? t('inCollection') : '+ ' + t('addCoin')}
              </button>
              {isOwned && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-gray-400">Copias:</span>
                  <button
                    onClick={() => updateExtra(coin.id, quantity - 1)}
                    disabled={quantity <= 1}
                    className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed text-sm font-bold transition flex items-center justify-center"
                  >−</button>
                  <span className="w-5 text-center text-sm font-bold text-gray-800 dark:text-white">{quantity}</span>
                  <button
                    onClick={() => updateExtra(coin.id, quantity + 1)}
                    className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 text-sm font-bold transition flex items-center justify-center"
                  >+</button>
                  {quantity > 1 && (
                    <span className="text-xs text-blue-500 font-medium">{quantity - 1} extra{quantity - 1 > 1 ? 's' : ''}</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Detalles */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100 dark:border-gray-700">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">{t('commemorates')}</p>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mt-0.5">
                {coin.commemorates || '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">{t('mintage')}</p>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mt-0.5">
                {coin.mintage > 0 ? coin.mintage.toLocaleString('es') + ' ' + t('units') : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">{t('country')}</p>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mt-0.5">
                {coin.country}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">{t('year')}</p>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mt-0.5">
                {coin.year}
              </p>
            </div>
          </div>

          {/* Coleccionistas */}
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Coleccionistas</p>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mt-0.5">
              {ownerCount === null
                ? <span className="text-gray-300 dark:text-gray-600">—</span>
                : ownerCount === 0
                  ? 'Ninguno aún'
                  : `${ownerCount} la tienen`}
            </p>
          </div>

          {/* Valor estimado */}
          {(() => {
            const tier = getCoinTier(coin)
            return (
              <div className={`${tier.bg} rounded-xl p-3 flex items-center gap-3`}>
                <span className="text-2xl">{tier.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">{t('estimatedMarketValue')}</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${tier.bg} ${tier.color} border border-current/20`}>
                      {tier.label}
                    </span>
                  </div>
                  <p className={`text-xl font-bold mt-0.5 ${tier.color}`}>
                    {tier.range}
                  </p>
                  {coin.mintage > 0 && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {coin.mintage.toLocaleString('es')} unidades acuñadas
                    </p>
                  )}
                </div>
              </div>
            )
          })()}

          {/* Nota privada */}
          <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-300 flex items-center gap-1.5">
                📝 Nota privada
                <span className="text-xs font-normal text-gray-400">(solo tú la ves)</span>
              </p>
              {!editingNote && !noteLoading && (
                <button
                  onClick={handleEditNote}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {note ? 'Editar' : 'Añadir nota'}
                </button>
              )}
            </div>

            {noteLoading ? (
              <div className="h-8 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
            ) : editingNote ? (
              <div className="space-y-2">
                <textarea
                  value={noteInput}
                  onChange={e => setNoteInput(e.target.value)}
                  placeholder="Dónde la conseguiste, cuánto pagaste, si es un regalo..."
                  rows={3}
                  className="w-full text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                  autoFocus
                />
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={handleCancelNote}
                    className="text-xs text-gray-400 hover:text-gray-600 px-3 py-1.5 rounded-lg transition"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveNote}
                    disabled={saving}
                    className="text-xs bg-blue-700 hover:bg-blue-800 text-white px-4 py-1.5 rounded-lg transition disabled:opacity-50"
                  >
                    {saving ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </div>
            ) : note ? (
              <div
                onClick={handleEditNote}
                className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition border border-yellow-200 dark:border-yellow-800"
              >
                {note}
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">Sin nota — pulsa "Añadir nota" para escribir algo</p>
            )}
          </div>
        </div>
      </div>

      {/* Otras monedas del mismo año */}
      {sameYear.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
          <h2 className="font-semibold text-gray-700 dark:text-gray-200 mb-3">
            🌍 {t('commonIssue')} {coin.year} — {t('otherCountries')}
          </h2>
          <div className="flex flex-wrap gap-2">
            {sameYear.slice(0, 12).map(c => (
              <button
                key={c.id}
                onClick={() => navigate(`/moneda/${c.id}`)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  owned.has(c.id)
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                {owned.has(c.id) ? '✓ ' : ''}{c.country}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Otras monedas del mismo país */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
        <h2 className="font-semibold text-gray-700 dark:text-gray-200 mb-3">
          {t('otherCoinsFrom')} {coin.country}
        </h2>
        <div className="flex flex-wrap gap-2">
          {sameCountry.map(c => (
            <button
              key={c.id}
              onClick={() => navigate(`/moneda/${c.id}`)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                owned.has(c.id)
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              {owned.has(c.id) ? '✓ ' : ''}{c.year}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}