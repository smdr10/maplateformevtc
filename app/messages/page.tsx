'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Conversation {
  listingId: string
  listingTitle: string
  otherUserId: string
  otherUserName: string
  lastMessage: string
  lastMessageAt: string
  unreadCount: number
}

interface Message {
  id: string
  message: string
  senderId: string
  createdAt: string
  sender: { id: string; name: string }
}

export default function MessagesPage() {
  const router = useRouter()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selected, setSelected] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [currentUserId, setCurrentUserId] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const load = async () => {
      const meRes = await fetch('/api/auth/me', { credentials: 'include' })
      if (!meRes.ok) { router.push('/login?redirect=/messages'); return }
      const meData = await meRes.json()
      setCurrentUserId(meData.user.id)
      const convRes = await fetch('/api/messages', { credentials: 'include' })
      const convData = await convRes.json()
      setConversations(convData.conversations || [])
      setLoading(false)
    }
    load()
  }, [router])

  const openConversation = async (conv: Conversation) => {
    setSelected(conv)
    const res = await fetch(`/api/messages/${conv.listingId}/${conv.otherUserId}`, { credentials: 'include' })
    const data = await res.json()
    setMessages(data.messages || [])
    setConversations(prev => prev.map(c =>
      c.listingId === conv.listingId && c.otherUserId === conv.otherUserId ? { ...c, unreadCount: 0 } : c
    ))
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!newMessage.trim() || !selected) return
    setSending(true)
    const res = await fetch(`/api/messages/${selected.listingId}/${selected.otherUserId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ message: newMessage }),
    })
    if (res.ok) {
      const data = await res.json()
      setMessages(prev => [...prev, data.message])
      setNewMessage('')
    }
    setSending(false)
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const isToday = date.toDateString() === now.toDateString()
    if (isToday) return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
  }

  if (loading) return <div className="max-w-5xl mx-auto px-4 py-16 text-center text-gray-500">Chargement...</div>

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 min-h-screen">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden" style={{ height: '600px' }}>
        <div className="grid grid-cols-3 h-full">

          <div className="border-r border-gray-800 overflow-y-auto">
            <div className="p-4 border-b border-gray-800">
              <p className="font-bold text-white">Messages</p>
            </div>

            {conversations.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-600">Aucune conversation</div>
            ) : (
              conversations.map(conv => (
                <div
                  key={`${conv.listingId}-${conv.otherUserId}`}
                  onClick={() => openConversation(conv)}
                  className={`p-3 border-b border-gray-800 cursor-pointer transition-all ${selected?.listingId === conv.listingId && selected?.otherUserId === conv.otherUserId ? 'bg-orange-500/10 border-l-2 border-l-orange-500' : 'hover:bg-gray-900'}`}
                >
                  <div className="flex justify-between items-baseline mb-1">
                    <p className="text-sm font-medium text-white">{conv.otherUserName}</p>
                    <span className="text-xs text-gray-600">{formatTime(conv.lastMessageAt)}</span>
                  </div>
                  <p className="text-xs text-gray-600 truncate mb-1">{conv.listingTitle}</p>
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-gray-500 truncate flex-1">{conv.lastMessage}</p>
                    {conv.unreadCount > 0 && (
                      <span className="ml-2 w-5 h-5 rounded-full bg-orange-500 text-white text-xs flex items-center justify-center flex-shrink-0 font-bold">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="col-span-2 flex flex-col">
            {!selected ? (
              <div className="flex-1 flex items-center justify-center text-gray-600 text-sm">
                Selectionnez une conversation
              </div>
            ) : (
              <>
                <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white text-sm">{selected.otherUserName}</p>
                    <Link href={`/annonces/${selected.listingId}`} className="text-xs text-orange-500 hover:text-orange-400 transition-colors">
                      {selected.listingTitle}
                    </Link>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.senderId === currentUserId ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs px-4 py-2.5 rounded-2xl text-sm ${msg.senderId === currentUserId ? 'bg-orange-500 text-white' : 'bg-white/10 text-gray-200'}`}>
                        <p>{msg.message}</p>
                        <p className={`text-xs mt-1 ${msg.senderId === currentUserId ? 'text-orange-200' : 'text-gray-500'}`}>
                          {formatTime(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                <div className="p-3 border-t border-gray-800 flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendMessage()}
                    placeholder="Votre message..."
                    className="flex-1 px-4 py-2.5 bg-gray-900 border border-gray-800 text-white rounded-xl text-sm focus:outline-none focus:border-orange-500/50 transition-all placeholder-gray-500"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={sending || !newMessage.trim()}
                    className="px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-bold hover:bg-orange-600 disabled:opacity-50 transition-all hover:scale-105"
                  >
                    Envoyer
                  </button>
                </div>
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}