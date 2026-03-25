import { useWallMessages } from '../hooks/useWallMessages'
import WallMessage from '../components/WallMessage'
import WallComposer from '../components/WallComposer'
import { useAuth } from '../context/AuthContext'
import { useAdmin } from '../hooks/useAdmin'
import { useSEO } from '../hooks/useSEO'

export default function CommunityPage() {
  useSEO({ title: 'Comunidad' })
  const { user } = useAuth()
  const { messages, loading, sendMessage } = useWallMessages()
  const isAdmin = useAdmin()

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          💬 Comunidad
        </h1>
        <p className="text-sm text-gray-400">
          {messages.length} mensajes
        </p>
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400">
        Comparte novedades, busca monedas que te faltan o anota las que tienes de sobra.
      </p>

      {/* Composer */}
      <WallComposer onSend={sendMessage} />

      {/* Mensajes */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">
          <div className="w-8 h-8 border-4 border-blue-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
          Cargando mensajes...
        </div>
      ) : messages.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <span className="text-4xl block mb-2">💬</span>
          <p>Sé el primero en escribir algo</p>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map(message => (
            <WallMessage
              key={message.id}
              message={message}
              username={message.username}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      )}
    </div>
  )
}