import { useEffect, useState } from 'react'

let toastQueue = []
let listeners = []

export function showToast(message, type = 'success') {
  const toast = { id: crypto.randomUUID(), message, type }
  toastQueue = [...toastQueue, toast]
  listeners.forEach(l => l([...toastQueue]))
  setTimeout(() => {
    toastQueue = toastQueue.filter(t => t.id !== toast.id)
    listeners.forEach(l => l([...toastQueue]))
  }, 3000)
}

export function ToastContainer() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    listeners.push(setToasts)
    return () => { listeners = listeners.filter(l => l !== setToasts) }
  }, [])

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium
            flex items-center gap-2 animate-slide-in pointer-events-auto
            ${toast.type === 'success' ? 'bg-green-500' :
              toast.type === 'error' ? 'bg-red-500' :
              toast.type === 'info' ? 'bg-blue-500' : 'bg-gray-700'}`}
        >
          {toast.type === 'success' && '✅'}
          {toast.type === 'error' && '❌'}
          {toast.type === 'info' && 'ℹ️'}
          {toast.message}
        </div>
      ))}
    </div>
  )
}