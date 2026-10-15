'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface Conversation {
  listingId: string | null
  serviceId: string | null
  otherUserId: string
  otherUserName: string
  listingTitle: string
  lastMessage: string
  lastMessageAt: string
  unreadCount: number
}

const convKey = (c: Conversation) => `${c.listingId ?? 's:' + c.serviceId}-${c.otherUserId}`

interface Message {
  id: string
  message: string
  senderId: string
  createdAt: string
}

export default function MessagesPage() {
  const router = useRouter()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [currentConv, setCurrentConv] = useState<Conversation | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [currentUserId, setCurrentUserId] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data?.user) { router.push('/login?redirect=/messages'); return }
        setCurrentUserId(data.user.id)
        return fetch('/api/messages', { credentials: 'include' })
      })
      .then(r => r?.json())
      .then(data => { setConversations(data?.conversations || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [router])

  const openConversation = async (conv: Conversation) => {
    setCurrentConv(conv)
    const url = conv.listingId
      ? `/api/messages/${conv.listingId}/${conv.otherUserId}`
      : `/api/messages/${conv.serviceId}/${conv.otherUserId}?type=service`
    const res = await fetch(url, { credentials: 'include' })
    const data = await res.json()
    setMessages(data.messages || [])
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentConv) return
    setSending(true)
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ listingId: currentConv.listingId, serviceId: currentConv.serviceId, receiverId: currentConv.otherUserId, message: newMessage }),
    })
    if (res.ok) {
      const data = await res.json()
      setMessages(prev => [...prev, data.message])
      setNewMessage('')
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    }
    setSending(false)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F3F1EA' }}>
      <div style={{ color: '#6B7789' }}>Chargement...</div>
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 min-h-screen" style={{ backgroundColor: '#F3F1EA' }}>
      <h1 className="text-xl font-bold mb-5" style={{ color: '#0B1F3A' }}>Mes messages</h1>

      <div className="rounded-[4px] overflow-hidden flex" style={{ backgroundColor: '#FFFFFF', border: '1px solid #D9D5C9', height: '600px' }}>

        {/* CONVERSATIONS */}
        <div className="w-72 flex-shrink-0 overflow-y-auto" style={{ borderRight: '1px solid #E6E2D6' }}>
          {conversations.length === 0 ? (
            <div className="text-center py-10 px-4">
              <p className="text-sm" style={{ color: '#6B7789' }}>Aucune conversation</p>
            </div>
          ) : conversations.map(conv => (
            <button key={convKey(conv)} onClick={() => openConversation(conv)}
              className="w-full text-left p-4 transition-colors hover:bg-gray-50"
              style={{ borderBottom: '1px solid #E6E2D6', backgroundColor: currentConv && convKey(currentConv) === convKey(conv) ? '#FFF3CC' : 'transparent' }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ backgroundColor: '#0B1F3A' }}>
                  {conv.otherUserName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm truncate" style={{ color: '#0B1F3A' }}>{conv.otherUserName}</p>
                    {conv.unreadCount > 0 && (
                      <span className="w-5 h-5 rounded-full text-white text-xs flex items-center justify-center font-bold flex-shrink-0" style={{ backgroundColor: '#0B1F3A' }}>{conv.unreadCount}</span>
                    )}
                  </div>
                  <p className="text-xs truncate mt-0.5" style={{ color: '#6B7789' }}>{conv.listingTitle}</p>
                  <p className="text-xs truncate mt-0.5" style={{ color: '#6B7789' }}>{conv.lastMessage}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* MESSAGES */}
        <div className="flex-1 flex flex-col">
          {!currentConv ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <svg className="w-12 h-12 mx-auto mb-3" style={{ color: '#D9D5C9' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                <p className="text-sm" style={{ color: '#6B7789' }}>Sélectionnez une conversation</p>
              </div>
            </div>
          ) : (
            <>
              <div className="p-4" style={{ borderBottom: '1px solid #E6E2D6' }}>
                <p className="font-bold text-sm" style={{ color: '#0B1F3A' }}>{currentConv.otherUserName}</p>
                <p className="text-xs" style={{ color: '#6B7789' }}>{currentConv.listingTitle}</p>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.senderId === currentUserId ? 'justify-end' : 'justify-start'}`}>
                    <div className="max-w-xs px-4 py-2.5 rounded-[4px] text-sm" style={{
                      backgroundColor: msg.senderId === currentUserId ? '#0B1F3A' : '#F3F1EA',
                      color: msg.senderId === currentUserId ? '#FFFFFF' : '#0B1F3A',
                      border: msg.senderId === currentUserId ? 'none' : '1px solid #D9D5C9',
                    }}>
                      {msg.message}
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
              <div className="p-4 flex gap-2" style={{ borderTop: '1px solid #E6E2D6' }}>
                <input
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder="Ecrivez votre message..."
                  className="flex-1 px-4 py-2.5 rounded-[3px] text-sm focus:outline-none transition-all"
                  style={{ backgroundColor: '#F3F1EA', border: '1px solid #D9D5C9', color: '#0B1F3A' }}
                />
                <button onClick={sendMessage} disabled={sending || !newMessage.trim()} className="px-4 py-2.5 rounded-[3px] text-white font-medium text-sm disabled:opacity-50 transition-all" style={{ backgroundColor: '#0B1F3A' }}>
                  Envoyer
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
