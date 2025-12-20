import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Send, 
  Paperclip, 
  Mic, 
  Image as ImageIcon, 
  FileText, 
  ArrowLeft,
  MoreVertical,
  Search,
  Phone,
  Video,
  Smile,
  Check,
  CheckCheck,
  Clock,
  Play,
  Pause,
  Download,
  X,
  Camera,
  MapPin,
  User
} from 'lucide-react'
import { evolutionApi } from '../services/api/evolutionApi'
import { whatsappMessagesService } from '../services/supabase/whatsappMessages'
import type { WhatsAppChat, WhatsAppMessage } from '../services/supabase/whatsappMessages'
import { useWhatsAppInstance } from '../hooks/useWhatsApp'
import { toast } from 'sonner'

// =====================================================
// MESSAGE BUBBLE COMPONENT
// =====================================================

function MessageBubble({ message, onMediaClick }: { message: WhatsAppMessage; onMediaClick?: (message: WhatsAppMessage) => void }) {
  const isFromMe = message.from_me
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  const getStatusIcon = () => {
    switch (message.status) {
      case 'sent':
        return <Check className="w-3 h-3 text-gray-400" />
      case 'delivered':
        return <CheckCheck className="w-3 h-3 text-gray-400" />
      case 'read':
        return <CheckCheck className="w-3 h-3 text-blue-500" />
      case 'failed':
        return <X className="w-3 h-3 text-red-500" />
      default:
        return <Clock className="w-3 h-3 text-gray-400" />
    }
  }

  const toggleAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const renderContent = () => {
    if (message.is_deleted) {
      return <span className="italic text-gray-500">Mensagem apagada</span>
    }

    switch (message.message_type) {
      case 'text':
        return <p className="whitespace-pre-wrap break-words">{message.text_content}</p>

      case 'image':
        return (
          <div className="cursor-pointer" onClick={() => onMediaClick?.(message)}>
            {message.media_base64 ? (
              <img 
                src={`data:${message.media_mimetype || 'image/jpeg'};base64,${message.media_base64}`}
                alt="Imagem"
                className="max-w-xs rounded-lg"
              />
            ) : message.media_url ? (
              <img 
                src={message.media_url}
                alt="Imagem"
                className="max-w-xs rounded-lg"
              />
            ) : (
              <div className="flex items-center gap-2 p-4 bg-gray-100 rounded-lg">
                <ImageIcon className="w-8 h-8 text-gray-400" />
                <span>Imagem</span>
              </div>
            )}
            {message.caption && <p className="mt-2">{message.caption}</p>}
          </div>
        )

      case 'audio':
        return (
          <div className="flex items-center gap-3 min-w-[200px]">
            <button 
              onClick={toggleAudio}
              className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </button>
            <div className="flex-1">
              <div className="h-1 bg-gray-300 rounded-full">
                <div className="h-1 bg-green-500 rounded-full w-0" />
              </div>
              <span className="text-xs text-gray-500">
                {message.media_duration ? `${Math.floor(message.media_duration / 60)}:${(message.media_duration % 60).toString().padStart(2, '0')}` : '0:00'}
              </span>
            </div>
            {message.media_base64 && (
              <audio 
                ref={audioRef} 
                src={`data:${message.media_mimetype || 'audio/ogg'};base64,${message.media_base64}`}
                onEnded={() => setIsPlaying(false)}
              />
            )}
          </div>
        )

      case 'video':
        return (
          <div className="cursor-pointer" onClick={() => onMediaClick?.(message)}>
            {message.thumbnail_base64 ? (
              <div className="relative">
                <img 
                  src={`data:image/jpeg;base64,${message.thumbnail_base64}`}
                  alt="Vídeo"
                  className="max-w-xs rounded-lg"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center">
                    <Play className="w-6 h-6 text-white ml-1" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-4 bg-gray-100 rounded-lg">
                <Video className="w-8 h-8 text-gray-400" />
                <span>Vídeo</span>
              </div>
            )}
            {message.caption && <p className="mt-2">{message.caption}</p>}
          </div>
        )

      case 'document':
        return (
          <div 
            className="flex items-center gap-3 p-3 bg-gray-100 rounded-lg cursor-pointer"
            onClick={() => onMediaClick?.(message)}
          >
            <FileText className="w-10 h-10 text-blue-500" />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{message.media_filename || 'Documento'}</p>
              {message.media_size && (
                <p className="text-xs text-gray-500">
                  {(message.media_size / 1024).toFixed(1)} KB
                </p>
              )}
            </div>
            <Download className="w-5 h-5 text-gray-400" />
          </div>
        )

      case 'location':
        return (
          <div className="p-3 bg-gray-100 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-5 h-5 text-red-500" />
              <span className="font-medium">{message.location_name || 'Localização'}</span>
            </div>
            {message.location_address && (
              <p className="text-sm text-gray-600">{message.location_address}</p>
            )}
            <a 
              href={`https://maps.google.com/?q=${message.latitude},${message.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-500 hover:underline"
            >
              Abrir no Google Maps
            </a>
          </div>
        )

      case 'contact':
        return (
          <div className="flex items-center gap-3 p-3 bg-gray-100 rounded-lg">
            <User className="w-10 h-10 text-gray-400" />
            <div>
              <p className="font-medium">Contato compartilhado</p>
              <p className="text-sm text-gray-500">{message.vcard?.split('FN:')[1]?.split('\n')[0] || 'Contato'}</p>
            </div>
          </div>
        )

      case 'sticker':
        return message.media_base64 ? (
          <img 
            src={`data:image/webp;base64,${message.media_base64}`}
            alt="Sticker"
            className="w-32 h-32"
          />
        ) : (
          <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center">
            <Smile className="w-12 h-12 text-gray-400" />
          </div>
        )

      default:
        return <p className="italic text-gray-500">[{message.message_type}]</p>
    }
  }

  return (
    <div className={`flex ${isFromMe ? 'justify-end' : 'justify-start'} mb-2`}>
      <div 
        className={`max-w-[70%] rounded-lg px-3 py-2 ${
          isFromMe 
            ? 'bg-green-100 rounded-br-none' 
            : 'bg-white rounded-bl-none shadow-sm'
        }`}
      >
        {!isFromMe && message.sender_name && (
          <p className="text-xs font-medium text-green-600 mb-1">{message.sender_name}</p>
        )}
        
        {message.quoted_message_preview && (
          <div className="border-l-4 border-green-500 pl-2 mb-2 text-sm text-gray-600 bg-black/5 rounded py-1">
            {message.quoted_message_preview}
          </div>
        )}

        {renderContent()}

        <div className={`flex items-center gap-1 mt-1 ${isFromMe ? 'justify-end' : 'justify-start'}`}>
          <span className="text-[10px] text-gray-500">{formatTime(message.message_timestamp)}</span>
          {message.is_edited && <span className="text-[10px] text-gray-400">editada</span>}
          {isFromMe && getStatusIcon()}
        </div>
      </div>
    </div>
  )
}

// =====================================================
// CHAT LIST ITEM COMPONENT
// =====================================================

function ChatListItem({ 
  chat, 
  isSelected, 
  onClick 
}: { 
  chat: WhatsAppChat
  isSelected: boolean
  onClick: () => void 
}) {
  const formatTime = (timestamp?: string) => {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    const now = new Date()
    const isToday = date.toDateString() === now.toDateString()
    
    if (isToday) {
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    }
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  }

  const displayName = chat.contact_name || chat.contact_push_name || chat.remote_jid.split('@')[0]

  return (
    <div 
      onClick={onClick}
      className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-100 transition-colors ${
        isSelected ? 'bg-gray-100' : ''
      }`}
    >
      {chat.profile_picture_url ? (
        <img 
          src={chat.profile_picture_url} 
          alt={displayName}
          className="w-12 h-12 rounded-full object-cover"
        />
      ) : (
        <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
          <User className="w-6 h-6 text-gray-500" />
        </div>
      )}
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900 truncate">{displayName}</h3>
          <span className="text-xs text-gray-500">{formatTime(chat.last_message_at)}</span>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500 truncate">{chat.last_message_preview || 'Sem mensagens'}</p>
          {chat.unread_count > 0 && (
            <span className="bg-green-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
              {chat.unread_count}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// =====================================================
// MAIN CHAT PAGE COMPONENT
// =====================================================

export default function WhatsAppChatPage() {
  const navigate = useNavigate()
  const { data: instance } = useWhatsAppInstance()
  
  const [chats, setChats] = useState<WhatsAppChat[]>([])
  const [selectedChat, setSelectedChat] = useState<WhatsAppChat | null>(null)
  const [messages, setMessages] = useState<WhatsAppMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAttachMenu, setShowAttachMenu] = useState(false)
  const [mediaPreview, setMediaPreview] = useState<WhatsAppMessage | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const instanceName = instance?.instanceName

  // Load chats
  const loadChats = useCallback(async () => {
    if (!instanceName) return
    
    try {
      // First try to load from database
      let dbChats: WhatsAppChat[] = []
      
      try {
        dbChats = await whatsappMessagesService.getChats(instanceName)
      } catch (dbError) {
        console.log('Erro ao carregar chats do banco:', dbError)
        // Continue - will try to load from API
      }
      
      // If no chats in DB, fetch from Evolution API and sync
      if (dbChats.length === 0) {
        try {
          // Try findChats first
          const apiResponse = await evolutionApi.findChats(instanceName)
          console.log('[WhatsAppChat] API findChats response:', JSON.stringify(apiResponse, null, 2))
          const apiChats: any[] = Array.isArray(apiResponse) ? apiResponse : []
          
          for (const apiChat of apiChats) {
            console.log('[WhatsAppChat] Processing chat:', JSON.stringify(apiChat, null, 2))
            
            // Evolution API retorna o JID em diferentes campos
            // Prioridade: remoteJid > id (se contém @) > owner > jid
            let remoteJid = ''
            
            if (apiChat.remoteJid && apiChat.remoteJid.includes('@')) {
              remoteJid = apiChat.remoteJid
            } else if (apiChat.id && typeof apiChat.id === 'string' && apiChat.id.includes('@')) {
              remoteJid = apiChat.id
            } else if (apiChat.owner && apiChat.owner.includes('@')) {
              remoteJid = apiChat.owner
            } else if (apiChat.jid && apiChat.jid.includes('@')) {
              remoteJid = apiChat.jid
            } else if (apiChat.chatId && apiChat.chatId.includes('@')) {
              remoteJid = apiChat.chatId
            }
            
            if (!remoteJid) {
              console.log('[WhatsAppChat] Skipping chat - no valid remoteJid found in:', Object.keys(apiChat))
              continue
            }
            
            console.log('[WhatsAppChat] Using remoteJid:', remoteJid)
            
            // Get profile picture
            let profilePicUrl = ''
            try {
              const profilePic = await evolutionApi.fetchProfilePictureUrl(instanceName, remoteJid)
              profilePicUrl = profilePic.profilePictureUrl || ''
            } catch (e) {
              // Profile picture not available
            }
            
            try {
              await whatsappMessagesService.createOrUpdateChat({
                instance_name: instanceName,
                remote_jid: remoteJid,
                contact_name: apiChat.name || apiChat.subject || apiChat.pushName,
                contact_push_name: apiChat.pushName || apiChat.notify || apiChat.verifiedName,
                profile_picture_url: profilePicUrl,
                is_group: remoteJid.includes('@g.us')
              })
            } catch (chatError) {
              console.log('Erro ao salvar chat:', chatError)
            }
          }
          
          try {
            dbChats = await whatsappMessagesService.getChats(instanceName)
          } catch (e) {
            // Use empty array if DB still fails
          }
        } catch (apiError) {
          console.log('Erro ao carregar chats da API:', apiError)
        }
      }
      
      setChats(dbChats)
    } catch (error) {
      console.error('Erro ao carregar chats:', error)
      toast.error('Erro ao carregar conversas')
    } finally {
      setIsLoading(false)
    }
  }, [instanceName])

  // Load messages for selected chat
  const loadMessages = useCallback(async (chat: WhatsAppChat) => {
    if (!instanceName) return
    
    try {
      // First load from database
      let dbMessages = await whatsappMessagesService.getMessages(chat.id)
      
      // If no messages in DB, fetch from Evolution API
      if (dbMessages.length === 0) {
        try {
          const apiResponse = await evolutionApi.findMessages(instanceName, {
            where: {
              key: {
                remoteJid: chat.remote_jid
              }
            },
            limit: 100
          })
          
          // Handle different response structures from Evolution API
          const apiMessages = Array.isArray(apiResponse) 
            ? apiResponse 
            : (apiResponse as any)?.messages || (apiResponse as any)?.data || []
          
          // Save messages to database
          if (Array.isArray(apiMessages)) {
            for (const msg of apiMessages) {
              if (!msg?.key?.id) continue // Skip invalid messages
              
              const messageType = getMessageType(msg)
              const textContent = extractTextContent(msg)
              
              await whatsappMessagesService.createMessage({
                chat_id: chat.id,
                instance_name: instanceName,
                message_id: msg.key.id,
                remote_jid: msg.key.remoteJid,
                from_me: msg.key.fromMe,
                sender_jid: msg.key.participant,
                sender_name: msg.pushName,
                message_type: messageType,
                text_content: textContent,
                caption: msg.message?.imageMessage?.caption || msg.message?.videoMessage?.caption,
                media_mimetype: msg.message?.imageMessage?.mimetype || msg.message?.audioMessage?.mimetype || msg.message?.videoMessage?.mimetype || msg.message?.documentMessage?.mimetype,
                media_filename: msg.message?.documentMessage?.fileName,
                message_timestamp: new Date((msg.messageTimestamp || Date.now() / 1000) * 1000).toISOString()
              })
            }
          }
          
          dbMessages = await whatsappMessagesService.getMessages(chat.id)
        } catch (apiError) {
          console.log('Não foi possível carregar mensagens da API:', apiError)
          // Continue without API messages - just show empty chat
        }
      }
      
      setMessages(dbMessages)
      
      // Mark as read
      await whatsappMessagesService.updateChatUnreadCount(chat.id, 0)
      
      // Scroll to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error)
    }
  }, [instanceName])

  // Helper functions
  const getMessageType = (msg: any): WhatsAppMessage['message_type'] => {
    if (msg.message?.conversation || msg.message?.extendedTextMessage) return 'text'
    if (msg.message?.imageMessage) return 'image'
    if (msg.message?.audioMessage) return 'audio'
    if (msg.message?.videoMessage) return 'video'
    if (msg.message?.documentMessage) return 'document'
    if (msg.message?.stickerMessage) return 'sticker'
    if (msg.message?.locationMessage) return 'location'
    if (msg.message?.contactMessage) return 'contact'
    if (msg.message?.pollCreationMessage) return 'poll'
    if (msg.message?.reactionMessage) return 'reaction'
    return 'text'
  }

  const extractTextContent = (msg: any): string => {
    return msg.message?.conversation || 
           msg.message?.extendedTextMessage?.text || 
           msg.message?.imageMessage?.caption ||
           msg.message?.videoMessage?.caption ||
           ''
  }

  // Send message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || !instanceName) return
    
    console.log('[WhatsAppChat] Sending message to:', selectedChat.remote_jid)
    console.log('[WhatsAppChat] Selected chat:', selectedChat)
    
    setIsSending(true)
    try {
      // Send via Evolution API - use remote_jid directly (already in correct format)
      const result = await evolutionApi.sendText(instanceName, {
        number: selectedChat.remote_jid,
        text: newMessage
      })
      
      // Save to database
      const savedMessage = await whatsappMessagesService.createMessage({
        chat_id: selectedChat.id,
        instance_name: instanceName,
        message_id: result.key?.id || `local_${Date.now()}`,
        remote_jid: selectedChat.remote_jid,
        from_me: true,
        message_type: 'text',
        text_content: newMessage,
        message_timestamp: new Date().toISOString()
      })
      
      setMessages(prev => [...prev, savedMessage])
      setNewMessage('')
      
      // Scroll to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
      toast.error('Erro ao enviar mensagem')
    } finally {
      setIsSending(false)
    }
  }

  // Send media
  const handleSendMedia = async (file: File, type: 'image' | 'video' | 'document' | 'audio') => {
    if (!selectedChat || !instanceName) return
    
    setIsSending(true)
    try {
      // Convert to base64
      const base64 = await fileToBase64(file)
      
      // Send via Evolution API
      const result = await evolutionApi.sendMedia(instanceName, {
        number: selectedChat.remote_jid,
        mediatype: type,
        mimetype: file.type,
        fileName: file.name,
        media: base64
      })
      
      // Save to database
      const savedMessage = await whatsappMessagesService.createMessage({
        chat_id: selectedChat.id,
        instance_name: instanceName,
        message_id: result.key?.id || `local_${Date.now()}`,
        remote_jid: selectedChat.remote_jid,
        from_me: true,
        message_type: type,
        media_mimetype: file.type,
        media_filename: file.name,
        media_size: file.size,
        media_base64: base64.split(',')[1],
        message_timestamp: new Date().toISOString()
      })
      
      setMessages(prev => [...prev, savedMessage])
      setShowAttachMenu(false)
      
      toast.success('Mídia enviada com sucesso!')
    } catch (error) {
      console.error('Erro ao enviar mídia:', error)
      toast.error('Erro ao enviar mídia')
    } finally {
      setIsSending(false)
    }
  }

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = error => reject(error)
    })
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    let type: 'image' | 'video' | 'document' | 'audio' = 'document'
    if (file.type.startsWith('image/')) type = 'image'
    else if (file.type.startsWith('video/')) type = 'video'
    else if (file.type.startsWith('audio/')) type = 'audio'
    
    handleSendMedia(file, type)
  }

  // Effects
  useEffect(() => {
    loadChats()
  }, [loadChats])

  useEffect(() => {
    if (selectedChat) {
      loadMessages(selectedChat)
    }
  }, [selectedChat, loadMessages])

  // Filter chats by search
  const filteredChats = chats.filter(chat => {
    const name = chat.contact_name || chat.contact_push_name || chat.remote_jid
    return name.toLowerCase().includes(searchQuery.toLowerCase())
  })

  if (!instanceName) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Nenhuma instância WhatsApp conectada</p>
          <button 
            onClick={() => navigate('/whatsapp')}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            Configurar WhatsApp
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-80px)] bg-gray-100">
      {/* Chat List Sidebar */}
      <div className="w-96 bg-white border-r flex flex-col">
        {/* Header */}
        <div className="p-4 bg-gray-50 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Conversas</h2>
            <button 
              onClick={() => navigate('/whatsapp')}
              className="p-2 hover:bg-gray-200 rounded-full"
            >
              <MoreVertical className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Pesquisar conversas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500" />
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhuma conversa encontrada
            </div>
          ) : (
            filteredChats.map(chat => (
              <ChatListItem
                key={chat.id}
                chat={chat}
                isSelected={selectedChat?.id === chat.id}
                onClick={() => setSelectedChat(chat)}
              />
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="p-4 bg-gray-50 border-b flex items-center gap-4">
              <button 
                onClick={() => setSelectedChat(null)}
                className="lg:hidden p-2 hover:bg-gray-200 rounded-full"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              
              {selectedChat.profile_picture_url ? (
                <img 
                  src={selectedChat.profile_picture_url}
                  alt=""
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-500" />
                </div>
              )}
              
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">
                  {selectedChat.contact_name || selectedChat.contact_push_name || selectedChat.remote_jid.split('@')[0]}
                </h3>
                <p className="text-sm text-gray-500">
                  {selectedChat.remote_jid.split('@')[0]}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-gray-200 rounded-full">
                  <Search className="w-5 h-5 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-200 rounded-full">
                  <MoreVertical className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div 
              className="flex-1 overflow-y-auto p-4"
              style={{ backgroundImage: 'url(/whatsapp-bg.png)', backgroundColor: '#e5ddd5' }}
            >
              {messages.map(message => (
                <MessageBubble 
                  key={message.id} 
                  message={message}
                  onMediaClick={setMediaPreview}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-gray-50 border-t">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <button 
                    onClick={() => setShowAttachMenu(!showAttachMenu)}
                    className="p-2 hover:bg-gray-200 rounded-full"
                  >
                    <Paperclip className="w-6 h-6 text-gray-600" />
                  </button>
                  
                  {showAttachMenu && (
                    <div className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-lg p-2 flex flex-col gap-1">
                      <button 
                        onClick={() => {
                          fileInputRef.current?.click()
                        }}
                        className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-lg"
                      >
                        <ImageIcon className="w-5 h-5 text-purple-500" />
                        <span>Imagem</span>
                      </button>
                      <button 
                        onClick={() => {
                          fileInputRef.current?.click()
                        }}
                        className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-lg"
                      >
                        <Camera className="w-5 h-5 text-pink-500" />
                        <span>Vídeo</span>
                      </button>
                      <button 
                        onClick={() => {
                          fileInputRef.current?.click()
                        }}
                        className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-lg"
                      >
                        <FileText className="w-5 h-5 text-blue-500" />
                        <span>Documento</span>
                      </button>
                    </div>
                  )}
                </div>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden"
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx"
                />

                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Digite uma mensagem..."
                  className="flex-1 px-4 py-2 bg-white border rounded-full focus:outline-none focus:ring-2 focus:ring-green-500"
                />

                {newMessage.trim() ? (
                  <button 
                    onClick={handleSendMessage}
                    disabled={isSending}
                    className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 disabled:opacity-50"
                  >
                    <Send className="w-6 h-6" />
                  </button>
                ) : (
                  <button className="p-2 hover:bg-gray-200 rounded-full">
                    <Mic className="w-6 h-6 text-gray-600" />
                  </button>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="w-64 h-64 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                <Phone className="w-24 h-24 text-gray-400" />
              </div>
              <h3 className="text-xl font-medium text-gray-700 mb-2">WhatsApp Web</h3>
              <p className="text-gray-500">Selecione uma conversa para começar</p>
            </div>
          </div>
        )}
      </div>

      {/* Media Preview Modal */}
      {mediaPreview && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center"
          onClick={() => setMediaPreview(null)}
        >
          <button 
            className="absolute top-4 right-4 p-2 text-white hover:bg-white/20 rounded-full"
            onClick={() => setMediaPreview(null)}
          >
            <X className="w-8 h-8" />
          </button>
          
          {mediaPreview.message_type === 'image' && (
            <img 
              src={mediaPreview.media_base64 
                ? `data:${mediaPreview.media_mimetype};base64,${mediaPreview.media_base64}`
                : mediaPreview.media_url || ''
              }
              alt=""
              className="max-w-[90vw] max-h-[90vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          )}
          
          {mediaPreview.message_type === 'video' && (
            <video 
              src={mediaPreview.media_base64 
                ? `data:${mediaPreview.media_mimetype};base64,${mediaPreview.media_base64}`
                : mediaPreview.media_url || ''
              }
              controls
              autoPlay
              className="max-w-[90vw] max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </div>
      )}
    </div>
  )
}
