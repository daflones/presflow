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
  const [isRecording, setIsRecording] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isFetchingChatsRef = useRef(false)
  const isFetchingMessagesRef = useRef(false)
  const chatsRef = useRef<WhatsAppChat[]>([])
  const messagesRef = useRef<WhatsAppMessage[]>([])
  const selectedChatIdRef = useRef<string | null>(null)
  const messagesRequestTokenRef = useRef(0)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<BlobPart[]>([])

  // Neste modo a tela é "fonte de verdade = Evolution".
  // Persistir em Supabase exige `chat_id` UUID real. Como aqui usamos um `id` sintético,
  // deixamos persistência desligada para não quebrar o carregamento (erro 22P02).
  const persistToSupabase = false

  const instanceName = instance?.instanceName

  useEffect(() => {
    chatsRef.current = chats
  }, [chats])

  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  useEffect(() => {
    selectedChatIdRef.current = selectedChat?.id || null
    // Ao trocar de chat, limpar imediatamente para não mostrar histórico do chat anterior
    setMessages([])
    // Invalida respostas pendentes do chat anterior
    messagesRequestTokenRef.current += 1
  }, [selectedChat?.id])

  // Load chats
  const loadChats = useCallback(async () => {
    if (!instanceName) {
      setChats([])
      setSelectedChat(null)
      setMessages([])
      setIsLoading(false)
      return
    }

    if (isFetchingChatsRef.current) return
    isFetchingChatsRef.current = true
    
    try {
      // Só mostrar spinner grande no primeiro carregamento
      const shouldShowSpinner = chatsRef.current.length === 0
      if (shouldShowSpinner) setIsLoading(true)

      // Fonte de verdade: Evolution API (v2: POST /chat/findChats/{instance})
      const apiResponse = await evolutionApi.findChats(instanceName)
      const apiChats: any[] = Array.isArray(apiResponse) ? apiResponse : []
      console.log('[WhatsAppChat] Evolution findChats:', { instanceName, count: apiChats.length })

      const nowIso = new Date().toISOString()
      const mappedChats: WhatsAppChat[] = []

      for (const apiChat of apiChats) {
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

        if (!remoteJid) continue

        const isGroup = remoteJid.includes('@g.us')
        if (isGroup) continue

        // Evitar chamadas lentas em massa: preferir URL vinda no próprio chat (quando existir)
        const profilePicUrl = apiChat.profilePicUrl || apiChat.profilePictureUrl || ''

        const chat: WhatsAppChat = {
          id: `${instanceName}:${remoteJid}`,
          church_id: 'evolution',
          instance_name: instanceName,
          remote_jid: remoteJid,
          contact_name: apiChat.pushName || apiChat.notify || apiChat.verifiedName || apiChat.name || apiChat.subject,
          contact_push_name: apiChat.pushName || apiChat.notify || apiChat.verifiedName,
          profile_picture_url: profilePicUrl,
          is_group: false,
          unread_count: apiChat.unreadCount || apiChat.unread || 0,
          last_message_at: apiChat.lastMessage?.messageTimestamp
            ? new Date(apiChat.lastMessage.messageTimestamp * 1000).toISOString()
            : undefined,
          last_message_preview:
            apiChat.lastMessage?.message?.conversation ||
            apiChat.lastMessage?.message?.extendedTextMessage?.text ||
            '',
          is_archived: !!apiChat.archived,
          is_pinned: !!apiChat.pinned,
          created_at: nowIso,
          updated_at: nowIso,
        }

        mappedChats.push(chat)

        // Persistência opcional (desligada por padrão)
        if (persistToSupabase) {
          whatsappMessagesService
            .createOrUpdateChat({
              instance_name: instanceName,
              remote_jid: remoteJid,
              contact_name: chat.contact_name,
              contact_push_name: chat.contact_push_name,
              profile_picture_url: chat.profile_picture_url,
              is_group: false,
            })
            .catch((chatError) => {
              console.log('Erro ao salvar chat:', chatError)
            })
        }
      }

      setChats(mappedChats)
    } catch (error) {
      console.error('Erro ao carregar chats:', error)
      toast.error('Erro ao carregar conversas')
    } finally {
      setIsLoading(false)
      isFetchingChatsRef.current = false
    }
  }, [instanceName])

  // Load messages for selected chat
  const loadMessages = useCallback(async (chat: WhatsAppChat) => {
    if (!instanceName) return

    const requestToken = messagesRequestTokenRef.current
    isFetchingMessagesRef.current = true
    // Se o chat mudou antes do start, não busca
    if (selectedChatIdRef.current && selectedChatIdRef.current !== chat.id) {
      isFetchingMessagesRef.current = false
      return
    }
    
    try {
      const apiResponse = await evolutionApi.findMessages(instanceName, {
        where: {
          key: {
            remoteJid: chat.remote_jid
          }
        },
        limit: 100
      })

      const apiMessages = Array.isArray(apiResponse)
        ? apiResponse
        : (apiResponse as any)?.messages?.records || (apiResponse as any)?.messages || (apiResponse as any)?.data || []

      console.log('[WhatsAppChat] Evolution findMessages:', {
        instanceName,
        remoteJid: chat.remote_jid,
        count: Array.isArray(apiMessages) ? apiMessages.length : 0
      })

      const nowIso = new Date().toISOString()
      const mappedMessages: WhatsAppMessage[] = []

      if (Array.isArray(apiMessages)) {
        for (const msg of apiMessages) {
          if (!msg?.key?.id) continue

          const messageType = getMessageType(msg)
          const textContent = extractTextContent(msg)
          const timestampIso = new Date((msg.messageTimestamp || Date.now() / 1000) * 1000).toISOString()

          const m: WhatsAppMessage = {
            id: `${chat.id}:${msg.key.id}`,
            church_id: 'evolution',
            chat_id: chat.id,
            instance_name: instanceName,
            message_id: msg.key.id,
            remote_jid: msg.key.remoteJid,
            from_me: !!msg.key.fromMe,
            sender_jid: msg.key.participant,
            sender_name: msg.pushName,
            message_type: messageType,
            text_content: textContent,
            caption: msg.message?.imageMessage?.caption || msg.message?.videoMessage?.caption,
            media_url: undefined,
            media_mimetype: msg.message?.imageMessage?.mimetype || msg.message?.audioMessage?.mimetype || msg.message?.videoMessage?.mimetype || msg.message?.documentMessage?.mimetype,
            media_filename: msg.message?.documentMessage?.fileName,
            media_base64: undefined,
            thumbnail_base64: undefined,
            latitude: undefined,
            longitude: undefined,
            location_name: undefined,
            location_address: undefined,
            vcard: undefined,
            status: 'sent',
            is_edited: false,
            is_deleted: false,
            is_forwarded: false,
            quoted_message_id: undefined,
            quoted_message_preview: undefined,
            reaction_emoji: undefined,
            reaction_to_message_id: undefined,
            message_timestamp: timestampIso,
            created_at: nowIso,
            updated_at: nowIso,
          }

          mappedMessages.push(m)

          // Persistência opcional (desligada por padrão)
          if (persistToSupabase) {
            whatsappMessagesService
              .createMessage({
                chat_id: chat.id,
                instance_name: instanceName,
                message_id: msg.key.id,
                remote_jid: msg.key.remoteJid,
                from_me: !!msg.key.fromMe,
                sender_jid: msg.key.participant,
                sender_name: msg.pushName,
                message_type: messageType,
                text_content: textContent,
                caption: m.caption,
                media_mimetype: m.media_mimetype,
                media_filename: m.media_filename,
                message_timestamp: timestampIso,
              })
              .catch(() => {})
          }
        }
      }

      // Só aplicar resultado se ainda estivermos no mesmo chat e a requisição não foi invalidada
      if (requestToken !== messagesRequestTokenRef.current) return
      if (selectedChatIdRef.current !== chat.id) return

      // Mesclar apenas dentro do MESMO chat (para evitar piscar após envio)
      const existing = messagesRef.current
      const byId = new Map<string, WhatsAppMessage>()
      for (const m of existing) byId.set(m.id, m)
      for (const m of mappedMessages) byId.set(m.id, m)
      const merged = Array.from(byId.values()).sort((a, b) => {
        return new Date(a.message_timestamp).getTime() - new Date(b.message_timestamp).getTime()
      })
      setMessages(merged)

      if (persistToSupabase) {
        await whatsappMessagesService.updateChatUnreadCount(chat.id, 0)
      }

      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error)
    } finally {
      isFetchingMessagesRef.current = false
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
    
    const textToSend = newMessage.trim()

    console.log('[WhatsAppChat] Sending message to:', selectedChat.remote_jid)
    console.log('[WhatsAppChat] Selected chat:', selectedChat)

    // UX: limpar imediatamente
    setNewMessage('')

    // Mensagem otimista
    const nowIso = new Date().toISOString()
    const optimisticId = `local_${Date.now()}`
    const optimisticMsg: WhatsAppMessage = {
      id: `${selectedChat.id}:${optimisticId}`,
      church_id: 'evolution',
      chat_id: selectedChat.id,
      instance_name: instanceName,
      message_id: optimisticId,
      remote_jid: selectedChat.remote_jid,
      from_me: true,
      sender_jid: undefined,
      sender_name: undefined,
      message_type: 'text',
      text_content: textToSend,
      caption: undefined,
      media_url: undefined,
      media_mimetype: undefined,
      media_filename: undefined,
      media_size: undefined,
      media_duration: undefined,
      media_base64: undefined,
      thumbnail_base64: undefined,
      latitude: undefined,
      longitude: undefined,
      location_name: undefined,
      location_address: undefined,
      vcard: undefined,
      status: 'sent',
      is_edited: false,
      is_deleted: false,
      is_forwarded: false,
      quoted_message_id: undefined,
      quoted_message_preview: undefined,
      reaction_emoji: undefined,
      reaction_to_message_id: undefined,
      message_timestamp: nowIso,
      created_at: nowIso,
      updated_at: nowIso,
    }
    setMessages(prev => [...prev, optimisticMsg])
    
    setIsSending(true)
    try {
      // Send via Evolution API - use remote_jid directly (already in correct format)
      await evolutionApi.sendText(instanceName, {
        number: selectedChat.remote_jid,
        text: textToSend
      })

      // Atualizar histórico a partir da Evolution (sem depender de Supabase)
      await loadMessages(selectedChat)
      
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

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = error => reject(error)
    })
  }

  // Send media
  const handleSendMedia = async (file: File, type: 'image' | 'video' | 'document' | 'audio') => {
    if (!selectedChat || !instanceName) return

    setIsSending(true)
    try {
      const base64DataUrl = await fileToBase64(file)

      if (type === 'audio') {
        await evolutionApi.sendAudio(instanceName, {
          number: selectedChat.remote_jid,
          audio: base64DataUrl,
          encoding: true,
        })
      } else {
        await evolutionApi.sendMedia(instanceName, {
          number: selectedChat.remote_jid,
          mediatype: type,
          mimetype: file.type,
          fileName: file.name,
          media: base64DataUrl,
        })
      }

      await loadMessages(selectedChat)
      setShowAttachMenu(false)
      toast.success('Mídia enviada com sucesso!')

      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    } catch (error) {
      console.error('Erro ao enviar mídia:', error)
      toast.error('Erro ao enviar mídia')
    } finally {
      setIsSending(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    let type: 'image' | 'video' | 'document' | 'audio' = 'document'
    if (file.type.startsWith('image/')) type = 'image'
    else if (file.type.startsWith('video/')) type = 'video'
    else if (file.type.startsWith('audio/')) type = 'audio'

    handleSendMedia(file, type)
    e.target.value = ''
  }

  const handleToggleRecording = async () => {
    if (!selectedChat || !instanceName) return

    if (isRecording) {
      mediaRecorderRef.current?.stop()
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      audioChunksRef.current = []

      recorder.ondataavailable = (evt) => {
        if (evt.data && evt.data.size > 0) {
          audioChunksRef.current.push(evt.data)
        }
      }

      recorder.onstop = async () => {
        setIsRecording(false)
        stream.getTracks().forEach((t) => t.stop())

        try {
          const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' })
          const file = new File([blob], `audio_${Date.now()}.webm`, { type: blob.type })
          await handleSendMedia(file, 'audio')
        } catch (err) {
          console.error('Erro ao enviar áudio gravado:', err)
          toast.error('Erro ao enviar áudio')
        }
      }

      mediaRecorderRef.current = recorder
      recorder.start()
      setIsRecording(true)
    } catch (err) {
      console.error('Erro ao acessar microfone:', err)
      toast.error('Permita acesso ao microfone para gravar áudio')
    }
  }

  // Effects
  useEffect(() => {
    loadChats()
  }, [loadChats])

  // Poll chats for near real-time updates
  useEffect(() => {
    if (!instanceName) return
    const interval = setInterval(() => {
      loadChats()
    }, 30000)
    return () => clearInterval(interval)
  }, [instanceName, loadChats])

  useEffect(() => {
    if (selectedChat) {
      loadMessages(selectedChat)
    }
  }, [selectedChat, loadMessages])

  // Poll messages for near real-time updates when a chat is selected
  useEffect(() => {
    if (!instanceName || !selectedChat) return
    const interval = setInterval(() => {
      loadMessages(selectedChat)
    }, 5000)
    return () => clearInterval(interval)
  }, [instanceName, selectedChat, loadMessages])

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
                  <button
                    onClick={handleToggleRecording}
                    disabled={isSending}
                    className={`p-2 rounded-full ${isRecording ? 'bg-red-100 hover:bg-red-200' : 'hover:bg-gray-200'} disabled:opacity-50`}
                  >
                    <Mic className={`w-6 h-6 ${isRecording ? 'text-red-600' : 'text-gray-600'}`} />
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
