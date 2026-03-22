import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'

export function useWallMessages(parentId = null, limit = 50) {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchMessages = useCallback(async () => {
    let query = supabase
      .from('wall_messages')
      .select(`
        *,
        reactions:wall_reactions(id, user_id, emoji)
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (parentId) {
      query = query.eq('parent_id', parentId)
    } else {
      query = query.is('parent_id', null)
    }

    try {
      const { data } = await query
      setMessages(data || [])
    } finally {
      setLoading(false)
    }
  }, [parentId, limit])

  useEffect(() => {
    fetchMessages()

    // Realtime — actualiza automáticamente cuando hay mensajes nuevos
    const channel = supabase
      .channel(`wall_messages_${parentId ?? 'root'}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'wall_messages'
      }, () => fetchMessages())
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'wall_reactions'
      }, () => fetchMessages())
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [fetchMessages])

  const sendMessage = async ({ message, type = 'general', coinId = null, parentId = null, username }) => {
    if (!user || !message.trim()) return
    const { error } = await supabase.from('wall_messages').insert({
      user_id: user.id,
      username,
      message: message.trim(),
      type,
      coin_id: coinId || null,
      parent_id: parentId || null,
    })
    if (error) return { error }
    return { error: null }
  }

  const deleteMessage = async (messageId) => {
    await supabase.from('wall_messages').delete().eq('id', messageId)
  }

    const toggleReaction = async (messageId, emoji) => {
    if (!user) return
    
    // Verificamos directamente en Supabase
    const { data: existing } = await supabase
        .from('wall_reactions')
        .select('id')
        .eq('message_id', messageId)
        .eq('user_id', user.id)
        .eq('emoji', emoji)
        .maybeSingle()

        if (existing) {
            await supabase.from('wall_reactions').delete().eq('id', existing.id)
        } else {
            await supabase.from('wall_reactions').insert({
            message_id: messageId,
            user_id: user.id,
            emoji
            })
        }
        
        await fetchMessages()
    }

  return { messages, loading, sendMessage, deleteMessage, toggleReaction, refetch: fetchMessages }
}