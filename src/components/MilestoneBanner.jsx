import { useEffect, useState } from 'react'

const AUTO_DISMISS_MS = 9000

export default function MilestoneBanner({ milestone, onDismiss }) {
  const [phase, setPhase] = useState('entering') // entering | visible | leaving

  useEffect(() => {
    if (!milestone) return
    setPhase('entering')
    // Pequeño delay para que el navegador aplique la transición de entrada
    const enter = setTimeout(() => setPhase('visible'), 30)
    const auto  = setTimeout(() => handleDismiss(), AUTO_DISMISS_MS)
    return () => { clearTimeout(enter); clearTimeout(auto) }
  }, [milestone?.id])

  function handleDismiss() {
    setPhase('leaving')
    setTimeout(() => onDismiss(), 350)
  }

  if (!milestone) return null

  return (
    <>
      {/* Keyframe para la barra de progreso */}
      <style>{`
        @keyframes ms-shrink { from { width: 100% } to { width: 0% } }
      `}</style>

      <div
        role="status"
        aria-live="polite"
        className={`fixed bottom-6 left-1/2 z-[150] transition-all duration-350 ease-out
          ${phase === 'entering' ? 'opacity-0 translate-y-6 -translate-x-1/2'
          : phase === 'visible'  ? 'opacity-100 translate-y-0 -translate-x-1/2'
          :                        'opacity-0 translate-y-4 -translate-x-1/2'}`}
      >
        <div className={`bg-gradient-to-r ${milestone.gradient} text-white rounded-2xl shadow-2xl overflow-hidden w-80 sm:w-96`}>
          <div className="flex items-center gap-4 px-5 py-4">
            {/* Icono animado */}
            <span
              className="text-4xl shrink-0 select-none"
              style={{ animation: 'ms-bounce 0.6s ease-out' }}
            >
              {milestone.icon}
            </span>

            <div className="flex-1 min-w-0">
              <p className="font-bold text-base leading-tight">{milestone.title}</p>
              <p className="text-sm opacity-85 mt-0.5 leading-snug">{milestone.body}</p>
            </div>

            <button
              onClick={handleDismiss}
              aria-label="Cerrar"
              className="text-white/60 hover:text-white text-lg leading-none shrink-0 transition ml-1"
            >
              ✕
            </button>
          </div>

          {/* Barra de auto-dismiss */}
          <div className="h-0.5 bg-black/10">
            {phase === 'visible' && (
              <div
                className="h-full bg-white/40 rounded-full"
                style={{ animation: `ms-shrink ${AUTO_DISMISS_MS}ms linear forwards` }}
              />
            )}
          </div>
        </div>
      </div>
    </>
  )
}
