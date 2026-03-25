import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useCoins, invalidateCoinsCache } from '../hooks/useCoins'
import { useAuth } from '../context/AuthContext'
import { useAdmin } from '../hooks/useAdmin'
import { useCoinImage } from '../hooks/useCoinImage'
import { showToast } from '../components/Toast'

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_LABELS = {
  pending:  { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300' },
  approved: { label: 'Aprobada',  color: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' },
  rejected: { label: 'Rechazada', color: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300' },
}

const COUNTRY_CODES = {
  'Alemania': 'de', 'Andorra': 'ad', 'Austria': 'at', 'Bélgica': 'be',
  'Chipre': 'cy', 'Croacia': 'hr', 'Eslovaquia': 'sk', 'Eslovenia': 'si',
  'España': 'es', 'Estonia': 'ee', 'Finlandia': 'fi', 'Francia': 'fr',
  'Grecia': 'gr', 'Irlanda': 'ie', 'Italia': 'it', 'Letonia': 'lv',
  'Lituania': 'lt', 'Luxemburgo': 'lu', 'Malta': 'mt', 'Mónaco': 'mc',
  'Países Bajos': 'nl', 'Portugal': 'pt', 'San Marino': 'sm', 'Vaticano': 'va',
}

function generateCoinId(country, year) {
  const code = COUNTRY_CODES[country] || country.toLowerCase().slice(0, 2)
  return `${code}_${year}`
}

// ── CoinAdminCard ─────────────────────────────────────────────────────────────

function CoinAdminCard({ coin, onEdit }) {
  const { src, status } = useCoinImage(coin)

  const borderColor =
    coin.imgStatus === 'rejected' ? 'border-red-300' :
    coin.imgStatus === 'pending'  ? 'border-yellow-300' :
    !coin.supabaseUrl             ? 'border-gray-200 dark:border-gray-600' :
    'border-green-200'

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border-2 ${borderColor}`}>
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
              loading="lazy"
              className={`h-24 w-24 object-contain transition-opacity ${status === 'ok' ? 'opacity-100' : 'opacity-0'}`}
            />
          </>
        )}
        <span className={`absolute top-1 right-1 text-xs px-1.5 py-0.5 rounded-full font-medium ${
          coin.imgStatus === 'rejected' ? 'bg-red-100 text-red-600' :
          coin.imgStatus === 'pending'  ? 'bg-yellow-100 text-yellow-700' :
          !coin.supabaseUrl             ? 'bg-gray-100 text-gray-500' :
          'bg-green-100 text-green-600'
        }`}>
          {coin.imgStatus === 'rejected' ? '❌' :
           coin.imgStatus === 'pending'  ? '⏳' :
           !coin.supabaseUrl             ? '—' : '✅'}
        </span>
      </div>

      <div className="p-2 space-y-1.5">
        <div>
          <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 truncate">{coin.country}</p>
          <p className="text-sm font-bold text-gray-800 dark:text-white">{coin.year}</p>
          <p className="text-xs text-gray-400 truncate">{coin.description}</p>
        </div>
        <button
          onClick={() => onEdit(coin)}
          className="w-full text-xs bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 py-1.5 rounded-lg transition font-medium"
        >
          ✏️ Editar
        </button>
      </div>
    </div>
  )
}

// ── CoinAdminRow ──────────────────────────────────────────────────────────────

function CoinAdminRow({ coin, onEdit }) {
  const { src, status } = useCoinImage(coin)

  const imgBadge =
    coin.imgStatus === 'rejected' ? '❌' :
    coin.imgStatus === 'pending'  ? '⏳' :
    !coin.supabaseUrl             ? '—' : '✅'

  const rowBorder =
    coin.imgStatus === 'rejected' ? 'border-l-red-400' :
    coin.imgStatus === 'pending'  ? 'border-l-yellow-400' :
    !coin.supabaseUrl             ? 'border-l-gray-300 dark:border-l-gray-600' :
    'border-l-green-400'

  return (
    <div className={`flex items-center gap-3 px-3 py-2 bg-white dark:bg-gray-800 border-l-4 ${rowBorder} hover:bg-gray-50 dark:hover:bg-gray-700/50 transition`}>
      {/* Imagen */}
      <div className="w-10 h-10 shrink-0 flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden">
        {!coin.supabaseUrl ? (
          <span className="text-xl">❓</span>
        ) : status === 'error' ? (
          <span className="text-xl">🪙</span>
        ) : (
          <img
            src={src}
            alt={coin.description}
            loading="lazy"
            className={`w-9 h-9 object-contain transition-opacity ${status === 'ok' ? 'opacity-100' : 'opacity-0'}`}
          />
        )}
      </div>

      {/* Estado */}
      <span className="text-base w-5 shrink-0">{imgBadge}</span>

      {/* ID */}
      <span className="text-xs font-mono text-gray-400 w-20 shrink-0 truncate hidden lg:block">{coin.id}</span>

      {/* País · año */}
      <div className="w-28 shrink-0">
        <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 truncate">{coin.country}</p>
        <p className="text-sm font-bold text-gray-800 dark:text-white">{coin.year}</p>
      </div>

      {/* Descripción */}
      <p className="flex-1 text-xs text-gray-500 dark:text-gray-400 truncate min-w-0">{coin.description}</p>

      {/* Acuñación */}
      <span className="text-xs text-gray-400 w-24 shrink-0 text-right hidden sm:block">
        {coin.mintage > 0 ? coin.mintage.toLocaleString('es') : '—'}
      </span>

      {/* Editar */}
      <button
        onClick={() => onEdit(coin)}
        className="shrink-0 text-xs bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-lg transition font-medium"
      >
        ✏️ Editar
      </button>
    </div>
  )
}

// ── EditCoinModal ─────────────────────────────────────────────────────────────

function EditCoinModal({ coin, onClose, onSaved, onUpload, onReject }) {
  const { src, status } = useCoinImage(coin)
  const [form, setForm] = useState({
    country:      coin.country,
    year:         String(coin.year),
    description:  coin.description,
    commemorates: coin.commemorates || '',
    mintage:      coin.mintage ? String(coin.mintage) : '',
  })
  const [urlInput, setUrlInput] = useState('')
  const [saving, setSaving]     = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError]       = useState(null)

  async function handleSave() {
    setError(null)
    setSaving(true)
    try {
      const { error: err } = await supabase
        .from('coins')
        .update({
          country:      form.country,
          year:         parseInt(form.year),
          description:  form.description,
          commemorates: form.commemorates || null,
          mintage:      form.mintage ? parseInt(form.mintage) : null,
        })
        .eq('id', coin.id)
      if (err) throw new Error(err.message)
      invalidateCoinsCache()
      showToast('Moneda actualizada', 'success')
      onSaved()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleUploadImage() {
    if (!urlInput.trim()) return
    setUploading(true)
    await onUpload(coin.id, urlInput.trim())
    setUrlInput('')
    setUploading(false)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">

        {/* Cabecera */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-gray-800 dark:text-white">Editar moneda</h2>
            <p className="text-xs text-gray-400 font-mono mt-0.5">{coin.id}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        {/* Imagen */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 mb-5">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3">Imagen</p>
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 flex items-center justify-center bg-white dark:bg-gray-600 rounded-xl border border-gray-200 dark:border-gray-500 shrink-0">
              {!coin.supabaseUrl ? (
                <span className="text-2xl">❓</span>
              ) : status === 'error' ? (
                <span className="text-2xl">🪙</span>
              ) : (
                <img
                  src={src}
                  alt={coin.description}
                  className={`w-16 h-16 object-contain transition-opacity ${status === 'ok' ? 'opacity-100' : 'opacity-0'}`}
                />
              )}
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={urlInput}
                  onChange={e => setUrlInput(e.target.value)}
                  placeholder="URL de nueva imagen..."
                  className="flex-1 text-xs border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  onKeyDown={e => e.key === 'Enter' && handleUploadImage()}
                />
                <button
                  onClick={handleUploadImage}
                  disabled={uploading || !urlInput.trim()}
                  className="text-xs bg-blue-700 hover:bg-blue-800 text-white px-3 py-1.5 rounded-lg transition disabled:opacity-50 shrink-0"
                >
                  {uploading ? '⏳' : '📤 Subir'}
                </button>
              </div>
              {coin.supabaseUrl && coin.imgStatus !== 'rejected' && (
                <button
                  onClick={() => onReject(coin.id)}
                  className="text-xs bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 px-3 py-1.5 rounded-lg transition w-full"
                >
                  ❌ Eliminar imagen actual
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Campos */}
        <div className="space-y-3">
          {[
            { name: 'country',      label: 'País' },
            { name: 'year',         label: 'Año' },
            { name: 'description',  label: 'Descripción' },
            { name: 'commemorates', label: 'Conmemora' },
            { name: 'mintage',      label: 'Acuñación' },
          ].map(({ name, label }) => (
            <div key={name}>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">{label}</label>
              <input
                type="text"
                value={form[name]}
                onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))}
                className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          ))}
        </div>

        {error && (
          <p className="mt-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">⚠️ {error}</p>
        )}

        <div className="mt-5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium py-2.5 rounded-xl transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-blue-700 hover:bg-blue-800 text-white font-semibold py-2.5 rounded-xl transition disabled:opacity-60"
          >
            {saving ? 'Guardando...' : '💾 Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── ProposalDetailModal ───────────────────────────────────────────────────────

function ProposalDetailModal({ proposal, onClose, onRefresh }) {
  const [form, setForm] = useState({
    country:      proposal.country,
    year:         String(proposal.year),
    description:  proposal.description,
    commemorates: proposal.commemorates || '',
    mintage:      proposal.mintage ? String(proposal.mintage) : '',
    admin_notes:  proposal.admin_notes || '',
    coinId:       generateCoinId(proposal.country, String(proposal.year)),
  })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState(null)
  const isPending = proposal.status === 'pending'

  function handleChange(e) {
    const { name, value } = e.target
    setForm(f => {
      const updated = { ...f, [name]: value }
      if ((name === 'country' || name === 'year') &&
          f.coinId === generateCoinId(f.country, f.year)) {
        updated.coinId = generateCoinId(
          name === 'country' ? value : f.country,
          name === 'year'    ? value : f.year,
        )
      }
      return updated
    })
  }

  async function handleApprove() {
    setError(null)
    setSaving(true)
    try {
      const coinId = form.coinId.trim()
      if (!coinId) throw new Error('El ID no puede estar vacío')

      const { error: coinErr } = await supabase.from('coins').insert({
        id:           coinId,
        country:      form.country,
        year:         parseInt(form.year),
        description:  form.description,
        commemorates: form.commemorates || null,
        mintage:      form.mintage ? parseInt(form.mintage) : null,
        image_url:    proposal.image_url || null,
      })
      if (coinErr) throw new Error('Error al crear moneda: ' + coinErr.message)

      const { error: propErr } = await supabase.from('coin_proposals').update({
        status:      'approved',
        admin_notes: form.admin_notes || null,
        reviewed_at: new Date().toISOString(),
      }).eq('id', proposal.id)
      if (propErr) throw new Error('Error al actualizar propuesta: ' + propErr.message)

      invalidateCoinsCache()
      onRefresh()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleReject() {
    setError(null)
    setSaving(true)
    try {
      const { error } = await supabase.from('coin_proposals').update({
        status:      'rejected',
        admin_notes: form.admin_notes || null,
        reviewed_at: new Date().toISOString(),
      }).eq('id', proposal.id)
      if (error) throw new Error(error.message)
      onRefresh()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white">Propuesta de moneda</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        {proposal.image_url && (
          <div className="mb-5 flex justify-center">
            <img
              src={proposal.image_url}
              alt="foto propuesta"
              className="h-36 w-36 object-contain rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700"
            />
          </div>
        )}

        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2 mb-5 text-xs text-gray-500 dark:text-gray-400 flex justify-between flex-wrap gap-1">
          <span>👤 {proposal.user_email || 'Anónimo'}</span>
          <span>📅 {new Date(proposal.created_at).toLocaleString('es-ES')}</span>
          <span className={`font-semibold px-2 py-0.5 rounded-full ${STATUS_LABELS[proposal.status]?.color}`}>
            {STATUS_LABELS[proposal.status]?.label}
          </span>
        </div>

        <div className="space-y-3">
          {[
            { name: 'country',      label: 'País' },
            { name: 'year',         label: 'Año' },
            { name: 'description',  label: 'Descripción' },
            { name: 'commemorates', label: 'Conmemora' },
            { name: 'mintage',      label: 'Acuñación' },
          ].map(({ name, label }) => (
            <div key={name}>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">{label}</label>
              <input
                type="text"
                name={name}
                value={form[name]}
                onChange={handleChange}
                disabled={!isPending}
                className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>
          ))}

          {isPending && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
                ID de la moneda
                <span className="text-gray-400 font-normal ml-1">(edítalo si ya existe, ej: de_2020b)</span>
              </label>
              <input
                type="text"
                name="coinId"
                value={form.coinId}
                onChange={handleChange}
                className="w-full border border-blue-300 dark:border-blue-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
              Nota admin {isPending ? '(opcional)' : ''}
            </label>
            <textarea
              name="admin_notes"
              value={form.admin_notes}
              onChange={handleChange}
              disabled={!isPending}
              rows={2}
              placeholder="Motivo del rechazo, correcciones realizadas..."
              className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-60 disabled:cursor-not-allowed resize-none"
            />
          </div>
        </div>

        {error && (
          <p className="mt-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">⚠️ {error}</p>
        )}

        {isPending ? (
          <div className="mt-5 flex gap-3">
            <button onClick={handleReject} disabled={saving}
              className="flex-1 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 font-semibold py-2.5 rounded-xl transition disabled:opacity-60">
              {saving ? '...' : '❌ Rechazar'}
            </button>
            <button onClick={handleApprove} disabled={saving}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-xl transition disabled:opacity-60">
              {saving ? '...' : '✅ Aprobar y añadir'}
            </button>
          </div>
        ) : (
          <p className="mt-5 text-center text-sm text-gray-400">
            Esta propuesta ya fue {proposal.status === 'approved' ? 'aprobada' : 'rechazada'} el{' '}
            {proposal.reviewed_at ? new Date(proposal.reviewed_at).toLocaleDateString('es-ES') : '—'}
          </p>
        )}
      </div>
    </div>
  )
}

// ── AdminCatalogPage ──────────────────────────────────────────────────────────

const IMG_FILTERS = ['todas', 'ok', 'rejected', 'pending', 'sin_imagen']

export default function AdminCatalogPage() {
  const { isAdmin, loading: adminLoading } = useAdmin()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { ALL_COINS, COUNTRIES } = useCoins()

  const [tab, setTab] = useState('catalog')

  // — Catálogo state —
  const [coinImages, setCoinImages]   = useState({})
  const [imgFilter, setImgFilter]     = useState('todas')
  const [search, setSearch]           = useState('')
  const [countryFilter, setCountry]   = useState('')
  const [loadingImgs, setLoadingImgs] = useState(true)
  const [editingCoin, setEditingCoin] = useState(null)
  const [viewMode, setViewMode]       = useState('grid')

  // — Propuestas state —
  const [proposals, setProposals]             = useState([])
  const [proposalFilter, setProposalFilter]   = useState('pending')
  const [loadingProps, setLoadingProps]       = useState(false)
  const [selectedProposal, setSelectedProposal] = useState(null)

  useEffect(() => {
    if (!adminLoading && !isAdmin) navigate('/')
  }, [isAdmin, adminLoading])

  useEffect(() => {
    if (isAdmin) loadImages()
  }, [isAdmin])

  useEffect(() => {
    if (isAdmin && tab === 'proposals') fetchProposals()
  }, [isAdmin, tab, proposalFilter])

  // — Image helpers —

  async function loadImages() {
    setLoadingImgs(true)
    const { data } = await supabase.from('coin_images').select('*')
    const map = {}
    for (const row of data || []) map[row.coin_id] = row
    setCoinImages(map)
    setLoadingImgs(false)
  }

  async function handleReject(coinId) {
    const url = coinImages[coinId]?.supabase_url || ''
    const storagePath = url ? url.split('/').pop()?.split('?')[0] : null
    try {
      if (storagePath) {
        await supabase.storage.from('coins').remove([storagePath])
      }
      await supabase.from('coin_images').upsert({
        coin_id: coinId, supabase_url: null, status: 'rejected',
        rejected_at: new Date().toISOString(), rejected_by: user.id,
      })
      await supabase.from('coins').update({ image_url: null }).eq('id', coinId)
      setCoinImages(prev => ({ ...prev, [coinId]: { ...prev[coinId], supabase_url: null, status: 'rejected' } }))
      if (editingCoin?.id === coinId) {
        setEditingCoin(c => ({ ...c, supabaseUrl: null, imgStatus: 'rejected' }))
      }
      showToast('Imagen eliminada', 'info')
    } catch (e) {
      showToast(`Error: ${e.message}`, 'error')
    }
  }

  async function handleUpload(coinId, imageUrl) {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-coin-image`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
          body: JSON.stringify({ coinId, imageUrl }),
        }
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      const newUrl = `${data.url}?t=${Date.now()}`
      setCoinImages(prev => ({ ...prev, [coinId]: { coin_id: coinId, supabase_url: newUrl, status: 'ok' } }))
      if (editingCoin?.id === coinId) {
        setEditingCoin(c => ({ ...c, supabaseUrl: newUrl, imgStatus: 'ok' }))
      }
      showToast('Imagen actualizada', 'success')
    } catch (e) {
      showToast(`Error: ${e.message}`, 'error')
    }
  }

  // — Proposals helpers —

  async function fetchProposals() {
    setLoadingProps(true)
    const query = supabase.from('coin_proposals').select('*').order('created_at', { ascending: false })
    if (proposalFilter !== 'all') query.eq('status', proposalFilter)
    const { data, error } = await query
    if (!error) setProposals(data || [])
    setLoadingProps(false)
  }

  // — Derived catalog data —

  const enrichedCoins = useMemo(() => {
    return ALL_COINS.map(coin => ({
      ...coin,
      supabaseUrl: coinImages[coin.id]?.supabase_url || coin.imageUrl || null,
      imgStatus:   coinImages[coin.id]?.status || (coin.imageUrl ? 'ok' : 'pending'),
    }))
  }, [ALL_COINS, coinImages])

  const filteredCoins = useMemo(() => {
    return enrichedCoins.filter(coin => {
      const matchImg =
        imgFilter === 'todas'      ? true :
        imgFilter === 'ok'         ? coin.imgStatus === 'ok' && coin.supabaseUrl :
        imgFilter === 'rejected'   ? coin.imgStatus === 'rejected' :
        imgFilter === 'pending'    ? coin.imgStatus === 'pending' :
        imgFilter === 'sin_imagen' ? !coin.supabaseUrl : true
      const matchSearch = !search ||
        coin.country.toLowerCase().includes(search.toLowerCase()) ||
        coin.year.toString().includes(search) ||
        coin.id.toLowerCase().includes(search.toLowerCase()) ||
        coin.description.toLowerCase().includes(search.toLowerCase())
      const matchCountry = !countryFilter || coin.country === countryFilter
      return matchImg && matchSearch && matchCountry
    })
  }, [enrichedCoins, imgFilter, search, countryFilter])

  const imgStats = useMemo(() => ({
    ok:         enrichedCoins.filter(c => c.imgStatus === 'ok' && c.supabaseUrl).length,
    rejected:   enrichedCoins.filter(c => c.imgStatus === 'rejected').length,
    pending:    enrichedCoins.filter(c => c.imgStatus === 'pending').length,
    sin_imagen: enrichedCoins.filter(c => !c.supabaseUrl).length,
  }), [enrichedCoins])

  const pendingCount = proposals.filter(p => p.status === 'pending').length

  if (adminLoading) return <div className="text-center py-20 text-gray-400">Verificando permisos...</div>
  if (!isAdmin) return null

  return (
    <div className="space-y-4">

      {/* Cabecera + tabs */}
      <div className="flex items-center gap-4 flex-wrap">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">🗂️ Catálogo admin</h1>
        <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600">
          <button
            onClick={() => setTab('catalog')}
            className={`px-5 py-2 text-sm font-medium transition ${
              tab === 'catalog'
                ? 'bg-blue-700 text-white'
                : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
            }`}
          >
            📦 Catálogo
          </button>
          <button
            onClick={() => setTab('proposals')}
            className={`px-5 py-2 text-sm font-medium transition flex items-center gap-1.5 ${
              tab === 'proposals'
                ? 'bg-blue-700 text-white'
                : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
            }`}
          >
            📬 Propuestas
            {pendingCount > 0 && (
              <span className={`text-xs rounded-full px-1.5 py-0.5 font-bold ${
                tab === 'proposals' ? 'bg-white/30 text-white' : 'bg-yellow-400 text-yellow-900'
              }`}>
                {pendingCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── CATÁLOGO ── */}
      {tab === 'catalog' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: '✅ OK',          value: imgStats.ok,         color: 'text-green-600' },
              { label: '❌ Rechazadas',  value: imgStats.rejected,   color: 'text-red-500' },
              { label: '⏳ Pendientes',  value: imgStats.pending,    color: 'text-yellow-500' },
              { label: '— Sin imagen',   value: imgStats.sin_imagen, color: 'text-gray-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-3 text-center">
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Filtros */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-3 flex flex-wrap gap-3 items-center">
            <input
              type="text"
              placeholder="🔍 Buscar por país, año, ID o descripción..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 min-w-48 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <select
              value={countryFilter}
              onChange={e => setCountry(e.target.value)}
              className="border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="">Todos los países</option>
              {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <div className="flex gap-1 flex-wrap">
              {IMG_FILTERS.map(f => (
                <button
                  key={f}
                  onClick={() => setImgFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    imgFilter === f
                      ? 'bg-blue-700 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {f === 'todas'      ? `Todas (${enrichedCoins.length})` :
                   f === 'ok'         ? `✅ OK (${imgStats.ok})` :
                   f === 'rejected'   ? `❌ Rechazadas (${imgStats.rejected})` :
                   f === 'pending'    ? `⏳ Pendientes (${imgStats.pending})` :
                   `— Sin imagen (${imgStats.sin_imagen})`}
                </button>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-sm text-gray-400">{filteredCoins.length} monedas</span>
              <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
                <button
                  onClick={() => setViewMode('grid')}
                  title="Vista cuadrícula"
                  className={`px-2.5 py-1.5 text-sm transition ${viewMode === 'grid' ? 'bg-blue-700 text-white' : 'bg-white dark:bg-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-600'}`}
                >⊞</button>
                <button
                  onClick={() => setViewMode('list')}
                  title="Vista listado"
                  className={`px-2.5 py-1.5 text-sm transition ${viewMode === 'list' ? 'bg-blue-700 text-white' : 'bg-white dark:bg-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-600'}`}
                >≡</button>
              </div>
              <button
                onClick={loadImages}
                className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-gray-600 dark:text-gray-300 px-3 py-1.5 rounded-lg text-xs transition"
              >
                🔄 Recargar
              </button>
            </div>
          </div>

          {/* Grid */}
          {loadingImgs ? (
            <div className="text-center py-16 text-gray-400">
              <div className="w-8 h-8 border-4 border-blue-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
              Cargando...
            </div>
          ) : filteredCoins.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <span className="text-4xl">🔍</span>
              <p className="mt-2">No se encontraron monedas</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {filteredCoins.map(coin => (
                <CoinAdminCard
                  key={`${coin.id}-${coinImages[coin.id]?.supabase_url}`}
                  coin={coin}
                  onEdit={setEditingCoin}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden divide-y divide-gray-100 dark:divide-gray-700">
              {filteredCoins.map(coin => (
                <CoinAdminRow
                  key={`${coin.id}-${coinImages[coin.id]?.supabase_url}`}
                  coin={coin}
                  onEdit={setEditingCoin}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── PROPUESTAS ── */}
      {tab === 'proposals' && (
        <>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 text-sm">
              {[
                { value: 'pending',  label: '⏳ Pendientes' },
                { value: 'approved', label: '✅ Aprobadas' },
                { value: 'rejected', label: '❌ Rechazadas' },
                { value: 'all',      label: 'Todas' },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setProposalFilter(value)}
                  className={`px-3 py-2 transition ${
                    proposalFilter === value
                      ? 'bg-blue-700 text-white'
                      : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {loadingProps ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-4 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
            </div>
          ) : proposals.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <span className="text-4xl">📭</span>
              <p className="mt-2">No hay propuestas {proposalFilter !== 'all' ? STATUS_LABELS[proposalFilter]?.label.toLowerCase() + 's' : ''}</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-100 dark:border-gray-600">
                  <tr>
                    <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-300 font-medium">Moneda</th>
                    <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-300 font-medium hidden md:table-cell">Usuario</th>
                    <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-300 font-medium hidden sm:table-cell">Fecha</th>
                    <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-300 font-medium">Estado</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                  {proposals.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-800 dark:text-white">{p.country} · {p.year}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">{p.description}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 hidden md:table-cell">{p.user_email || '—'}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs hidden sm:table-cell">
                        {new Date(p.created_at).toLocaleDateString('es-ES')}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_LABELS[p.status]?.color}`}>
                          {STATUS_LABELS[p.status]?.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setSelectedProposal(p)}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 text-xs font-semibold"
                        >
                          Ver detalle →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Modal editar moneda */}
      {editingCoin && (
        <EditCoinModal
          coin={editingCoin}
          onClose={() => setEditingCoin(null)}
          onSaved={() => setEditingCoin(null)}
          onUpload={handleUpload}
          onReject={handleReject}
        />
      )}

      {/* Modal propuesta */}
      {selectedProposal && (
        <ProposalDetailModal
          proposal={selectedProposal}
          onClose={() => setSelectedProposal(null)}
          onRefresh={() => { fetchProposals(); setSelectedProposal(null) }}
        />
      )}
    </div>
  )
}
