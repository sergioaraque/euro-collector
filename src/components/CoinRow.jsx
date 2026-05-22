import { useNavigate } from 'react-router-dom'
import { useCoinImage } from '../hooks/useCoinImage'

export default function CoinRow({ coin, isOwned, onToggle }) {
  const { src, status } = useCoinImage(coin)
  const navigate = useNavigate()

  return (
    <tr
      className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition ${
        isOwned ? 'bg-green-50 dark:bg-green-900/10' : ''
      }`}
      tabIndex={0}
      role="button"
      aria-label={`Ver ${coin.country} ${coin.year}`}
      onClick={() => navigate(`/moneda/${coin.id}`)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/moneda/${coin.id}`) } }}
    >
      {/* Imagen */}
      <td className="px-4 py-2">
        <div className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded">
          {status === 'error' ? (
            <span className="text-xl">🪙</span>
          ) : (
            <img
              src={src}
              alt={coin.description}
              loading="lazy"
              className={`w-10 h-10 object-contain transition-opacity ${
                status === 'ok' ? 'opacity-100' : 'opacity-0'
              }`}
            />
          )}
        </div>
      </td>

      {/* País */}
      <td className="px-4 py-2">
        <span className="font-medium text-blue-800">{coin.country}</span>
      </td>

      {/* Año */}
      <td className="px-4 py-2">
        <span className="font-bold text-gray-800">{coin.year}</span>
      </td>

      {/* Descripción */}
      <td className="px-4 py-2 hidden md:table-cell">
        <span className="text-gray-600 line-clamp-1">{coin.description}</span>
      </td>

      {/* Acuñación */}
      <td className="px-4 py-2 hidden lg:table-cell">
        <span className="text-gray-400 text-xs">
          {coin.mintage > 0 ? coin.mintage.toLocaleString('es') : '—'}
        </span>
      </td>

      {/* Toggle */}
      <td className="px-4 py-2 text-center" onClick={e => { e.stopPropagation(); onToggle() }}>
        <button className={`w-8 h-8 rounded-full text-sm font-bold transition ${
          isOwned
            ? 'bg-green-500 text-white hover:bg-red-400'
            : 'bg-gray-100 text-gray-400 hover:bg-green-100 hover:text-green-600'
        }`}>
          {isOwned ? '✓' : '+'}
        </button>
      </td>
    </tr>
  )
}