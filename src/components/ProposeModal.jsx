// src/components/ProposeModal.jsx
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabase'

const COUNTRIES_LIST = [
  'Alemania', 'Andorra', 'Austria', 'Bélgica', 'Chipre', 'Eslovaquia',
  'Eslovenia', 'España', 'Estonia', 'Finlandia', 'Francia', 'Grecia',
  'Irlanda', 'Italia', 'Letonia', 'Lituania', 'Luxemburgo', 'Malta',
  'Mónaco', 'Países Bajos', 'Portugal', 'San Marino', 'Vaticano', 'Croacia'
].sort()

export default function ProposeModal({ onClose, user }) {
  const [form, setForm] = useState({
    country: '',
    year: '',
    description: '',
    commemorates: '',
    mintage: '',
  })
  const [photo, setPhoto]     = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError]     = useState(null)

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  function handlePhoto(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen no puede superar 5 MB')
      return
    }
    setPhoto(file)
    setPreview(URL.createObjectURL(file))
    setError(null)
  }

  async function handleSubmit() {
    setError(null)
    if (!form.country || !form.year || !form.description) {
      setError('País, año y descripción son obligatorios')
      return
    }
    const year = parseInt(form.year)
    if (isNaN(year) || year < 1999 || year > new Date().getFullYear() + 1) {
      setError('Año no válido')
      return
    }

    setLoading(true)
    try {
      let image_url = null

      // 1. Subir foto si la hay
      if (photo) {
        const ext  = photo.name.split('.').pop()
        const path = `${user.id}/${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('proposals')
          .upload(path, photo, { upsert: false })

        if (uploadError) throw new Error('Error subiendo la imagen: ' + uploadError.message)

        const { data: urlData } = supabase.storage
          .from('proposals')
          .getPublicUrl(path)
        image_url = urlData.publicUrl
      }

      // 2. Insertar propuesta
      const { error: insertError } = await supabase
        .from('coin_proposals')
        .insert({
          user_id:      user.id,
          user_email:   user.email,
          country:      form.country,
          year,
          description:  form.description,
          commemorates: form.commemorates || null,
          mintage:      form.mintage ? parseInt(form.mintage) : null,
          image_url,
          status:       'pending',
        })

      if (insertError) throw new Error(insertError.message)

      setSuccess(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Pantalla de éxito ────────────────────────────────────────────────────
  if (success) {
    return (
      <Overlay onClose={onClose} labelledBy="propose-modal-title">
        <div className="text-center py-6 px-4">
          <div className="text-5xl mb-4">🎉</div>
          <h2 id="propose-modal-title" className="text-xl font-bold text-gray-800 dark:text-white mb-2">
            ¡Propuesta enviada!
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
            Revisaremos tu propuesta y la añadiremos al catálogo si es correcta.
            Gracias por contribuir.
          </p>
          <button
            onClick={onClose}
            className="bg-blue-700 hover:bg-blue-800 text-white font-semibold px-6 py-2.5 rounded-xl transition"
          >
            Cerrar
          </button>
        </div>
      </Overlay>
    )
  }

  // ── Formulario ───────────────────────────────────────────────────────────
  return (
    <Overlay onClose={onClose} labelledBy="propose-modal-title">
      <div className="flex items-center justify-between mb-5">
        <h2 id="propose-modal-title" className="text-lg font-bold text-gray-800 dark:text-white">
          🪙 Proponer una moneda
        </h2>
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl leading-none"
        >
          ✕
        </button>
      </div>

      <div className="space-y-4">
        {/* País */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
            País <span className="text-red-500">*</span>
          </label>
          <select
            name="country"
            value={form.country}
            onChange={handleChange}
            className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">Selecciona un país</option>
            {COUNTRIES_LIST.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Año */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
            Año <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="year"
            value={form.year}
            onChange={handleChange}
            placeholder="ej: 2018"
            min="1999"
            max={new Date().getFullYear() + 1}
            className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
            Descripción <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="ej: 200 años nacimiento de Beethoven"
            className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Conmemora */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
            Tema / Conmemora <span className="text-gray-400 font-normal">(opcional)</span>
          </label>
          <input
            type="text"
            name="commemorates"
            value={form.commemorates}
            onChange={handleChange}
            placeholder="ej: Beethoven"
            className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Acuñación */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
            Acuñación (nº de monedas) <span className="text-gray-400 font-normal">(opcional)</span>
          </label>
          <input
            type="number"
            name="mintage"
            value={form.mintage}
            onChange={handleChange}
            placeholder="ej: 1500000"
            min="0"
            className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Foto */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
            Foto de la moneda <span className="text-gray-400 font-normal">(opcional, máx 5 MB)</span>
          </label>
          <div className="flex items-center gap-3">
            <label className="cursor-pointer bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm px-4 py-2 rounded-lg transition">
              📎 Subir imagen
              <input
                type="file"
                accept="image/*"
                onChange={handlePhoto}
                className="hidden"
              />
            </label>
            {preview && (
              <img
                src={preview}
                alt="Vista previa de la imagen propuesta"
                className="h-12 w-12 object-contain rounded-lg border border-gray-200 dark:border-gray-600"
              />
            )}
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
            ⚠️ {error}
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition"
        >
          {loading ? 'Enviando...' : 'Enviar propuesta'}
        </button>
      </div>
    </Overlay>
  )
}

function Overlay({ children, onClose }) {
  const modalRef = useRef(null)

  useEffect(() => {
    const el = modalRef.current
    if (!el) return
    // focus the container so keyboard users land inside the dialog
    el.focus()

    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={e => e.target === e.currentTarget && onClose()}
      aria-hidden="false"
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={"propose-modal-title"}
        tabIndex={-1}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6"
      >
        {children}
      </div>
    </div>
  )
}