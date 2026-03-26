// Estimación de valor de mercado basada en acuñación (mintage)
// Valores orientativos para monedas conmemorativas de 2€

export const VALUE_TIERS = [
  { maxMintage: 50_000,    midValue: 80,  label: 'Muy rara',   color: 'text-purple-600 dark:text-purple-400',  bg: 'bg-purple-100 dark:bg-purple-900/30',  icon: '💎', range: '50€ – 200€+' },
  { maxMintage: 150_000,   midValue: 30,  label: 'Rara',       color: 'text-blue-600 dark:text-blue-400',      bg: 'bg-blue-100 dark:bg-blue-900/30',      icon: '🔵', range: '15€ – 50€'  },
  { maxMintage: 500_000,   midValue: 10,  label: 'Poco común', color: 'text-teal-600 dark:text-teal-400',      bg: 'bg-teal-100 dark:bg-teal-900/30',      icon: '🟢', range: '5€ – 15€'   },
  { maxMintage: 2_000_000, midValue: 4,   label: 'Normal',     color: 'text-gray-500 dark:text-gray-400',      bg: 'bg-gray-100 dark:bg-gray-700',          icon: '⚪', range: '3€ – 6€'    },
  { maxMintage: Infinity,  midValue: 2.5, label: 'Común',      color: 'text-gray-400 dark:text-gray-500',      bg: 'bg-gray-50 dark:bg-gray-700',           icon: '⚫', range: '2€ – 3€'    },
]

export function getCoinTier(coin) {
  if (!coin?.mintage || coin.mintage <= 0) {
    return { midValue: 3, label: 'Sin datos', color: 'text-gray-400', bg: 'bg-gray-50 dark:bg-gray-700', icon: '❓', range: '~2€' }
  }
  return VALUE_TIERS.find(t => coin.mintage < t.maxMintage) ?? VALUE_TIERS[VALUE_TIERS.length - 1]
}

export function getEstimatedValue(coin) {
  return getCoinTier(coin).midValue
}

export function formatValue(value) {
  return value % 1 === 0 ? `${value}€` : `${value.toFixed(1)}€`
}
