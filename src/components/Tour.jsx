import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'

const PAD = 8

const STEPS = [
  {
    title: '¡Bienvenido a EuroCollector! 👋',
    body: 'Esta guía rápida te explica las secciones principales. Puedes saltarla y volver a abrirla cuando quieras con el botón ❓ de la cabecera.',
    target: null,
  },
  {
    title: '🔍 Búsqueda rápida',
    body: 'Busca cualquier moneda por país, año o descripción. En escritorio pulsa Ctrl+K (o ⌘K en Mac) para abrirla al instante desde cualquier página.',
    target: '[data-tour="search"]',
  },
  {
    title: '📦 Tu colección',
    body: 'Aquí ves todas las monedas del catálogo. Usa los filtros y vistas para encontrarlas. Pulsa sobre cualquiera para ver sus detalles y añadirla a tu colección.',
    target: 'a[href="/coleccion"]',
  },
  {
    title: '🗺️ Mapa de progreso',
    body: 'Visualiza qué países tienes completos en el mapa. Cuanto más verde, más completo. También hay un mapa global con los datos de todos los coleccionistas.',
    target: 'a[href="/mapa"]',
  },
  {
    title: '👤 Tu zona personal',
    body: 'Aquí encontrarás tus estadísticas de progreso, gráficas de crecimiento, insignias desbloqueadas y tu historial de actividad.',
    target: '[data-tour="personal"]',
  },
  {
    title: '💬 Comunidad',
    body: 'Habla con otros coleccionistas, mira el ranking global y el mapa de quién colecciona qué en el mundo.',
    target: 'a[href="/comunidad"]',
  },
  {
    title: '¡Ya lo tienes todo! 🎉',
    body: '¿Necesitas recordar algo? Pulsa el botón ❓ en la cabecera para volver a ver esta guía. ¡Que disfrutes coleccionando!',
    target: null,
  },
]

function getTooltipPos(rect, vw, vh) {
  const width = Math.min(320, vw - 24)
  if (!rect) {
    return { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width }
  }
  // Center horizontally over target, clamped to viewport
  let left = rect.left + rect.width / 2 - width / 2
  left = Math.max(12, Math.min(left, vw - width - 12))

  // Below target, flip above if needed
  const spaceBelow = vh - rect.bottom - PAD - 16
  const top = spaceBelow > 180
    ? rect.bottom + PAD + 12
    : rect.top - PAD - 12 - 180  // rough height estimate above

  return { position: 'fixed', top: Math.max(8, top), left, width }
}

export default function Tour({ onClose }) {
  const [step, setStep] = useState(0)
  const [rect, setRect] = useState(null)
  const [vp, setVp] = useState({ w: window.innerWidth, h: window.innerHeight })

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  const measure = useCallback(() => {
    setVp({ w: window.innerWidth, h: window.innerHeight })
    if (!current.target) { setRect(null); return }
    const el = document.querySelector(current.target)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      // Small delay so scrollIntoView has time to settle
      setTimeout(() => setRect(el.getBoundingClientRect()), 100)
    } else {
      setRect(null)
    }
  }, [current.target])

  useEffect(() => { measure() }, [measure])
  useEffect(() => {
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [measure])

  // Keyboard: →/Enter next, ←  prev, Esc close
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key === 'ArrowRight' || (e.key === 'Enter' && e.target.tagName !== 'BUTTON')) next()
      if (e.key === 'ArrowLeft') prev()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  })

  const next = () => isLast ? onClose() : setStep(s => s + 1)
  const prev = () => { if (step > 0) setStep(s => s - 1) }

  // 4-rect overlay
  const overlayRects = rect ? [
    // top
    { top: 0, left: 0, right: 0, height: Math.max(0, rect.top - PAD) },
    // bottom
    { top: rect.bottom + PAD, left: 0, right: 0, bottom: 0 },
    // left
    { top: rect.top - PAD, left: 0, width: Math.max(0, rect.left - PAD), height: rect.height + PAD * 2 },
    // right
    { top: rect.top - PAD, left: rect.right + PAD, right: 0, height: rect.height + PAD * 2 },
  ] : [{ top: 0, left: 0, right: 0, bottom: 0 }]

  return createPortal(
    <div className="fixed inset-0 z-[200]" aria-modal="true" role="dialog">
      {/* Overlay pieces */}
      {overlayRects.map((style, i) => (
        <div
          key={i}
          className="absolute bg-black/65 transition-all duration-200"
          style={style}
        />
      ))}

      {/* Spotlight ring */}
      {rect && (
        <div
          className="absolute rounded-xl ring-2 ring-blue-400 pointer-events-none transition-all duration-200"
          style={{
            top: rect.top - PAD,
            left: rect.left - PAD,
            width: rect.width + PAD * 2,
            height: rect.height + PAD * 2,
          }}
        />
      )}

      {/* Tooltip card */}
      <div
        className="absolute bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-5 transition-all duration-200"
        style={getTooltipPos(rect, vp.w, vp.h)}
      >
        {/* Progress dots */}
        <div className="flex gap-1.5 mb-3">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`rounded-full transition-all duration-200 ${
                i === step
                  ? 'w-4 h-2 bg-blue-600'
                  : 'w-2 h-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300'
              }`}
            />
          ))}
        </div>

        <h3 className="font-bold text-gray-800 dark:text-white text-base mb-1.5">
          {current.title}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-4">
          {current.body}
        </p>

        <div className="flex items-center justify-between">
          <button
            onClick={onClose}
            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
          >
            Saltar guía
          </button>
          <div className="flex gap-2">
            {step > 0 && (
              <button
                onClick={prev}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                ← Anterior
              </button>
            )}
            <button
              onClick={next}
              className="px-4 py-1.5 text-sm rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-medium transition"
            >
              {isLast ? '¡Entendido! 🎉' : 'Siguiente →'}
            </button>
          </div>
        </div>

        <p className="text-xs text-gray-300 dark:text-gray-600 text-center mt-3">
          {step + 1} / {STEPS.length} · ← → navegar · Esc cerrar
        </p>
      </div>
    </div>,
    document.body
  )
}
