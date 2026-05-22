import { useNavigate } from 'react-router-dom'
import { useCoinImage } from '../hooks/useCoinImage'
import { useTranslation } from 'react-i18next'

export default function CoinCard({ coin, isOwned, onToggle, hasNote = false, quantity = 1 }) {
  const { src, status } = useCoinImage(coin)
  const navigate = useNavigate()
  const { t } = useTranslation()

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden transition-all hover:shadow-md border-2 ${
      isOwned ? 'border-green-400' : 'border-transparent'
    }`}>

      {/* Imagen — click navega al detalle */}
      <div
        className="relative bg-gray-50 dark:bg-gray-700 flex items-center justify-center h-28 cursor-pointer"
        role="button"
        aria-label={`Ver ${coin.country} ${coin.year}`}
        tabIndex={0}
        onClick={() => navigate(`/moneda/${coin.id}`)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/moneda/${coin.id}`) } }}
      >
        {status === 'error' ? (
          <div className="flex flex-col items-center gap-1 text-gray-300">
            <span className="text-4xl">🪙</span>
            <span className="text-xs">{t('noImage')}</span>
          </div>
        ) : (
          <>
            {status === 'loading' && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
              </div>
            )}
            <img
              src={src}
              alt={coin.description}
              loading="lazy"
              className={`h-24 w-24 object-contain transition-opacity duration-300 ${
                status === 'ok' ? 'opacity-100' : 'opacity-0'
              }`}
            />
          </>
        )}
        {isOwned && (
          <span className="absolute top-1 right-1 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow">
            ✓
          </span>
        )}
        {quantity > 1 && (
          <span className="absolute bottom-1 right-1 bg-blue-600 text-white font-bold shadow rounded-full px-1.5 py-0.5 leading-none" style={{ fontSize: 10 }}>
            ×{quantity}
          </span>
        )}
        {hasNote && (
          <span
            className="absolute top-1 left-1 bg-yellow-400 text-yellow-900 text-xs rounded-full w-5 h-5 flex items-center justify-center shadow"
            title="Tiene nota"
          >
            📝
          </span>
        )}
      </div>

      {/* Info — click navega al detalle */}
      <div
        className="p-2 cursor-pointer flex flex-col"
        role="button"
        aria-label={`Ver ${coin.country} ${coin.year}`}
        tabIndex={0}
        onClick={() => navigate(`/moneda/${coin.id}`)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/moneda/${coin.id}`) } }}
      >
        <p className="text-xs font-semibold text-blue-800 dark:text-blue-400 truncate">{coin.country}</p>
        <p className="text-sm font-bold text-gray-800 dark:text-white">{coin.year}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight truncate">{coin.description}</p>
        {coin.mintage > 0 && (
          <p className="text-xs text-gray-400 mt-1">{coin.mintage.toLocaleString('es')} uds.</p>
        )}
      </div>

      {/* Botón toggle */}
      <div
        onClick={onToggle}
        className={`py-1.5 text-center text-xs font-medium transition cursor-pointer ${
          isOwned ? 'bg-green-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-gray-200'
        }`}
      >
        {isOwned ? '✅ En mi colección' : '+ ' + t('addCoin')}
      </div>
    </div>
  )
}