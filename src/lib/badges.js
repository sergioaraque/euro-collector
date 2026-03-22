import { supabase } from '../supabase'

// Evalúa qué insignias debe recibir el usuario y las otorga
export async function checkAndAwardBadges(userId, owned, allCoins) {
  if (!userId || !owned) return []

  // Obtenemos las insignias que ya tiene
  const { data: existing } = await supabase
    .from('user_badges')
    .select('badge_id')
    .eq('user_id', userId)

  const alreadyHas = new Set((existing || []).map(b => b.badge_id))
  const newBadges = []

  const ownedCount = owned.size
  const ownedSet = owned
  const ALL_COINS = allCoins || []

  // Helper: monedas de un país
  const coinsOfCountry = (country) => ALL_COINS.filter(c => c.country === country)
  const hasAllOfCountry = (country) =>
    coinsOfCountry(country).every(c => ownedSet.has(c.id))

  // Helper: países completados
  const completedCountries = [...new Set(ALL_COINS.map(c => c.country))]
    .filter(country => hasAllOfCountry(country))

  // Helper: monedas raras que tiene
  const ownedRare = ALL_COINS.filter(c => ownedSet.has(c.id) && c.mintage > 0 && c.mintage < 100000)

  // Helper: años cubiertos
  const allYears = [...new Set(ALL_COINS.map(c => c.year))]
  const coveredYears = allYears.filter(year =>
    ALL_COINS.some(c => c.year === year && ownedSet.has(c.id))
  )

  const candidates = [
    { id: 'first_coin',       condition: ownedCount >= 1 },
    { id: 'coins_10',         condition: ownedCount >= 10 },
    { id: 'coins_25',         condition: ownedCount >= 25 },
    { id: 'coins_50',         condition: ownedCount >= 50 },
    { id: 'coins_100',        condition: ownedCount >= 100 },
    { id: 'coins_200',        condition: ownedCount >= 200 },
    { id: 'coins_all',        condition: ownedCount >= ALL_COINS.length },
    { id: 'half_collection',  condition: ownedCount >= Math.floor(ALL_COINS.length / 2) },
    { id: 'first_country',    condition: completedCountries.length >= 1 },
    { id: 'countries_5',      condition: completedCountries.length >= 5 },
    { id: 'countries_10',     condition: completedCountries.length >= 10 },
    { id: 'countries_all',    condition: completedCountries.length >= new Set(ALL_COINS.map(c => c.country)).size },
    { id: 'spain_complete',   condition: hasAllOfCountry('España') },
    { id: 'germany_complete', condition: hasAllOfCountry('Alemania') },
    { id: 'vaticano_complete',condition: hasAllOfCountry('Vaticano') },
    { id: 'monaco_complete',  condition: hasAllOfCountry('Mónaco') },
    { id: 'rare_coin',        condition: ownedRare.length >= 1 },
    { id: 'rare_5',           condition: ownedRare.length >= 5 },
    { id: 'all_years',        condition: coveredYears.length >= allYears.length },
  ]

  for (const { id, condition } of candidates) {
    if (condition && !alreadyHas.has(id)) {
      const { error } = await supabase
        .from('user_badges')
        .insert({ user_id: userId, badge_id: id })

      if (!error) {
        newBadges.push(id)
      }
    }
  }

  return newBadges
}

// Carga todas las insignias con estado (obtenida o no)
export async function loadUserBadges(userId) {
  const [{ data: allBadges }, { data: userBadges }] = await Promise.all([
    supabase.from('badges').select('*').order('category'),
    supabase.from('user_badges').select('badge_id, earned_at').eq('user_id', userId)
  ])

  const earnedMap = {}
  for (const ub of (userBadges || [])) {
    earnedMap[ub.badge_id] = ub.earned_at
  }

  return (allBadges || []).map(badge => ({
    ...badge,
    earned: !!earnedMap[badge.id],
    earned_at: earnedMap[badge.id] || null
  }))
}