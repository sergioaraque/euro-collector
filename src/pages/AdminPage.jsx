import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAdmin } from '../hooks/useAdmin'
import { useCoins } from '../hooks/useCoins'
import { useTranslation } from 'react-i18next'

export default function AdminPage() {
  const { isAdmin, loading } = useAdmin()
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const { ALL_COINS, COUNTRIES }  = useCoins()
  const { t } = useTranslation()

  useEffect(() => {
    if (!loading && !isAdmin) navigate('/')
  }, [isAdmin, loading])

  useEffect(() => {
    if (!isAdmin) return

    async function loadUsers() {
      // Obtenemos usuarios via RPC
      const { data: authUsers, error } = await supabase
        .rpc('get_users_admin')

      if (error) {
        console.error('Error cargando usuarios:', error)
        setLoadingUsers(false)
        return
      }

      // Obtenemos conteo de colección por usuario
      const { data: collectionCounts, error: countError } = await supabase
        .rpc('get_collection_counts')

      if (countError) console.error('Error contando colecciones:', countError)

      const counts = {}
      for (const row of collectionCounts || []) {
        counts[row.user_id] = Number(row.owned_count)
      }

      // Obtenemos roles
      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id, role')

      const roleMap = {}
      for (const r of roles || []) {
        roleMap[r.user_id] = r.role
      }

      const userList = (authUsers || []).map(u => ({
        user_id: u.user_id,
        email: u.email,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
        role: roleMap[u.user_id] || 'user',
        owned_count: counts[u.user_id] || 0,
      })).sort((a, b) => b.owned_count - a.owned_count)

      setUsers(userList)
      setLoadingUsers(false)
    }

    loadUsers()
  }, [isAdmin])

  if (loading) return (
    <div className="text-center py-20 text-gray-400">{t('adminCheckingPermissions')}</div>
  )
  if (!isAdmin) return null

  const totalCoins = ALL_COINS.length

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="text-2xl">🛡️</span>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          {t('adminPanel')}
        </h1>
      </div>
      <button
        onClick={() => navigate('/admin/catalogo')}
        className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm transition"
      >
        📦 Gestionar catálogo →
      </button>

      {/* Resumen */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Usuarios registrados', value: users.length, icon: '👥' },
          { label: 'Monedas en catálogo', value: totalCoins, icon: '🪙' },
          { label: 'Media de colección', value: users.length
              ? Math.round(users.reduce((a, u) => a + u.owned_count, 0) / users.length)
              : 0, icon: '📊' },
          { label: 'Colección más grande', value: users[0]?.owned_count || 0, icon: '🏆' },
        ].map(({ label, value, icon }) => (
          <div key={label} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 text-center">
            <div className="text-2xl mb-1">{icon}</div>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Tabla */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
          <h2 className="font-semibold text-gray-700 dark:text-gray-200">
            Usuarios ({users.length})
          </h2>
        </div>

        {loadingUsers ? (
          <div className="text-center py-10 text-gray-400">{t('adminLoadingUsers')}</div>
        ) : users.length === 0 ? (
          <div className="text-center py-10 text-gray-400">{t('adminNoUsers')}</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-300 font-medium">
                  {t('adminEmail')}
                </th>
                <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-300 font-medium hidden md:table-cell">
                  {t('adminRegistered')}
                </th>
                <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-300 font-medium hidden lg:table-cell">
                  {t('adminLastSignIn')}
                </th>
                <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-300 font-medium">
                  {t('adminRole')}
                </th>
                <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-300 font-medium">
                  {t('adminCollection')}
                </th>
                <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-300 font-medium">
                  {t('adminProgress')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
              {users.map(u => {
                const pct = Math.round((u.owned_count / totalCoins) * 100)
                return (
                  <tr key={u.user_id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                    <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">
                      {u.email}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 hidden md:table-cell">
                      {new Date(u.created_at).toLocaleDateString('es')}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 hidden lg:table-cell">
                      {u.last_sign_in_at
                        ? new Date(u.last_sign_in_at).toLocaleDateString('es')
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        u.role === 'admin'
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-blue-700 dark:text-blue-400">
                      {u.owned_count}/{totalCoins}
                    </td>
                    <td className="px-4 py-3 w-40">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-100 dark:bg-gray-600 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 w-8">
                          {pct}%
                        </span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}