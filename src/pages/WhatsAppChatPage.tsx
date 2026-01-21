import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Cropper from 'react-easy-crop'
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
  User,
  Square
} from 'lucide-react'
import { evolutionApi } from '../services/api/evolutionApi'
import { useWhatsAppInstance } from '../hooks/useWhatsApp'
import { toast } from 'sonner'
import { useAuth } from '../contexts/AuthContext'

type WhatsAppChat = {
  id: string
  church_id: string
  instance_name: string
  remote_jid: string
  contact_name?: string
  contact_push_name?: string
  profile_picture_url?: string
  is_group?: boolean
  unread_count?: number
  last_message_at?: string
  last_message_preview?: string
  is_archived?: boolean
  is_pinned?: boolean
  created_at: string
  updated_at: string
}

type WhatsAppMessage = {
  id: string
  church_id: string
  chat_id: string
  instance_name: string
  message_id: string
  remote_jid: string
  from_me: boolean
  sender_jid?: string
  sender_name?: string
  message_type:
    | 'text'
    | 'image'
    | 'audio'
    | 'video'
    | 'document'
    | 'sticker'
    | 'location'
    | 'contact'
    | 'poll'
    | 'reaction'
  text_content?: string
  caption?: string
  media_url?: string
  media_mimetype?: string
  media_filename?: string
  media_size?: number
  media_duration?: number
  media_base64?: string
  thumbnail_base64?: string
  latitude?: number
  longitude?: number
  location_name?: string
  location_address?: string
  vcard?: string
  status?: string
  is_edited?: boolean
  is_deleted?: boolean
  is_forwarded?: boolean
  quoted_message_id?: string
  quoted_message_preview?: string
  reaction_emoji?: string
  reaction_to_message_id?: string
  message_timestamp: string
  created_at: string
  updated_at: string
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.setAttribute('crossOrigin', 'anonymous')
    image.src = url
  })
}

async function getCroppedDataUrl(imageSrc: string, crop: { x: number; y: number; width: number; height: number }): Promise<string> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.floor(crop.width))
  canvas.height = Math.max(1, Math.floor(crop.height))
  const ctx = canvas.getContext('2d')
  if (!ctx) return imageSrc
  ctx.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', 0.92)
}

async function dataUrlToFile(dataUrl: string, fileName: string): Promise<File> {
  const res = await fetch(dataUrl)
  const blob = await res.blob()
  return new File([blob], fileName, { type: blob.type || 'image/jpeg' })
}

// =====================================================
// MESSAGE BUBBLE COMPONENT
// =====================================================

function MessageBubble({
  message,
  onMediaClick,
}: {
  message: WhatsAppMessage
  onMediaClick?: (message: WhatsAppMessage, opts?: { openModal?: boolean }) => void
}) {
  const isFromMe = message.from_me
  const [isPlaying, setIsPlaying] = useState(false)
  const [shouldAutoPlay, setShouldAutoPlay] = useState(false)
  const [audioDuration, setAudioDuration] = useState<number>(message.media_duration || 0)
  const [audioCurrentTime, setAudioCurrentTime] = useState<number>(0)
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
    // Se ainda não temos base64 carregado, buscar on-demand
    if (!message.media_base64) {
      setShouldAutoPlay(true)
      onMediaClick?.(message, { openModal: false })
      return
    }

    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
      setShouldAutoPlay(false)
      return
    }

    audioRef.current
      .play()
      .then(() => {
        setIsPlaying(true)
        setShouldAutoPlay(false)
      })
      .catch(() => {
        // ignore
      })
  }

  useEffect(() => {
    if (!shouldAutoPlay) return
    if (!message.media_base64) return
    // Quando a mídia chegar, tocar automaticamente
    setTimeout(() => {
      audioRef.current
        ?.play()
        .then(() => setIsPlaying(true))
        .catch(() => {})
      setShouldAutoPlay(false)
    }, 0)
  }, [shouldAutoPlay, message.media_base64])

  useEffect(() => {
    // Atualiza duração inicial se veio no payload
    if (message.media_duration && message.media_duration !== audioDuration) {
      setAudioDuration(message.media_duration)
    }
  }, [message.media_duration])

  useEffect(() => {
    const el = audioRef.current
    if (!el) return

    const onLoaded = () => {
      const d = Number.isFinite(el.duration) ? el.duration : 0
      if (d > 0) setAudioDuration(Math.floor(d))
    }

    const onTime = () => {
      setAudioCurrentTime(el.currentTime || 0)
    }

    el.addEventListener('loadedmetadata', onLoaded)
    el.addEventListener('timeupdate', onTime)

    return () => {
      el.removeEventListener('loadedmetadata', onLoaded)
      el.removeEventListener('timeupdate', onTime)
    }
  }, [message.media_base64])

  const formatAudioTime = (seconds: number) => {
    const s = Math.max(0, Math.floor(seconds))
    const mm = Math.floor(s / 60)
    const ss = s % 60
    return `${mm}:${ss.toString().padStart(2, '0')}`
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
            ) : message.thumbnail_base64 ? (
              <img 
                src={`data:image/jpeg;base64,${message.thumbnail_base64}`}
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
                <div
                  className="h-1 bg-green-500 rounded-full"
                  style={{
                    width: audioDuration > 0 ? `${Math.min(100, (audioCurrentTime / audioDuration) * 100)}%` : '0%'
                  }}
                />
              </div>
              <span className="text-xs text-gray-500">
                {audioDuration > 0 ? formatAudioTime(audioDuration) : '0:00'}
              </span>
            </div>
            <audio 
              ref={audioRef} 
              src={message.media_base64 ? `data:${message.media_mimetype || 'audio/ogg'};base64,${message.media_base64}` : undefined}
              onEnded={() => setIsPlaying(false)}
              onPause={() => setIsPlaying(false)}
            />
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
          {(chat.unread_count || 0) > 0 && (
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
  const { canSendWhatsapp } = useAuth()

  const waDebugRaw = String(((import.meta as any)?.env?.VITE_WA_DEBUG ?? '')).trim().toLowerCase()
  const WA_DEBUG = waDebugRaw === '1' || waDebugRaw === 'true' || waDebugRaw === 'yes'
  const waDebug = useCallback(
    (...args: any[]) => {
      if (!WA_DEBUG) return
      // padronizar prefixo para facilitar filtro no console
      // eslint-disable-next-line no-console
      console.log('[wa]', ...args)
    },
    [WA_DEBUG]
  )

  useEffect(() => {
    if (!WA_DEBUG) return
    waDebug('debug enabled', { VITE_WA_DEBUG: waDebugRaw })
  }, [WA_DEBUG, waDebugRaw, waDebug])
  
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
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const [isRecordingPaused, setIsRecordingPaused] = useState(false)
  const [pendingMedia, setPendingMedia] = useState<{ file: File; type: 'image' | 'video' | 'document' } | null>(null)
  const [pendingCaption, setPendingCaption] = useState('')
  const [isImageEditing, setIsImageEditing] = useState(false)
  const [imageEditorMode, setImageEditorMode] = useState<'crop' | 'draw' | 'text'>('crop')
  const [imageEditorSrc, setImageEditorSrc] = useState<string>('')
  const [imageWorkingSrc, setImageWorkingSrc] = useState<string>('')
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const [drawColor, setDrawColor] = useState('#16a34a')
  const [drawSize, setDrawSize] = useState(4)
  const [textToAdd, setTextToAdd] = useState('')
  const [textBoxPos, setTextBoxPos] = useState<{ x: number; y: number }>({ x: 0.5, y: 0.1 })
  const [isDraggingText, setIsDraggingText] = useState(false)
  const [editedImageFile, setEditedImageFile] = useState<File | null>(null)
  const drawCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const drawCtxRef = useRef<CanvasRenderingContext2D | null>(null)
  const isDrawingRef = useRef(false)
  const editorStageRef = useRef<HTMLDivElement | null>(null)
  const editorSquareRef = useRef<HTMLDivElement | null>(null)
  const [editorSquareSize, setEditorSquareSize] = useState<number>(0)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isFetchingChatsRef = useRef(false)
  const isFetchingMessagesRef = useRef(false)
  const chatsRef = useRef<WhatsAppChat[]>([])
  const messagesRef = useRef<WhatsAppMessage[]>([])
  const selectedChatIdRef = useRef<string | null>(null)
  const messagesRequestTokenRef = useRef(0)
  const shouldAutoScrollRef = useRef(true)
  const userScrolledUpRef = useRef(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<BlobPart[]>([])
  const profileNameCacheRef = useRef<Map<string, string>>(new Map())
  const profilePicCacheRef = useRef<Map<string, string>>(new Map())
  const contactsLoadedRef = useRef(false)
  const jidAliasRef = useRef<Map<string, string>>(new Map())

  // Neste modo a tela é "fonte de verdade = Evolution".
  // Não persistimos conversas/mensagens no Supabase nesta tela.

  const instanceName = instance?.instanceName

  useEffect(() => {
    contactsLoadedRef.current = false
    profileNameCacheRef.current = new Map()
  }, [instanceName])

  useEffect(() => {
    if (!pendingMedia || pendingMedia.type !== 'image') return
    const url = URL.createObjectURL(pendingMedia.file)
    setImageEditorSrc(url)
    setImageWorkingSrc(url)
    setEditedImageFile(null)
    setIsImageEditing(true)
    setImageEditorMode('crop')
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setCroppedAreaPixels(null)
    setTextToAdd('')
    setTextBoxPos({ x: 0.5, y: 0.1 })
    clearDrawLayer()
    return () => URL.revokeObjectURL(url)
  }, [pendingMedia])

  useEffect(() => {
    if (!isImageEditing) return
    if (imageEditorMode !== 'draw') return
    const canvas = drawCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    drawCtxRef.current = ctx
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'
  }, [isImageEditing, imageEditorMode])

  useEffect(() => {
    if (!isImageEditing) return
    const stage = editorStageRef.current
    const canvas = drawCanvasRef.current
    if (!stage || !canvas) return

    const resize = () => {
      const rect = stage.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      const sizeCss = Math.max(1, Math.floor(Math.min(rect.width, rect.height)))
      setEditorSquareSize(sizeCss)
      const nextW = Math.max(1, Math.floor(sizeCss * dpr))
      const nextH = Math.max(1, Math.floor(sizeCss * dpr))
      if (canvas.width === nextW && canvas.height === nextH) return

      // preservar desenho atual
      const prev = document.createElement('canvas')
      prev.width = canvas.width
      prev.height = canvas.height
      const prevCtx = prev.getContext('2d')
      if (prevCtx) prevCtx.drawImage(canvas, 0, 0)

      canvas.width = nextW
      canvas.height = nextH

      const ctx = canvas.getContext('2d')
      if (!ctx) return
      drawCtxRef.current = ctx
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'

      // reescalar o desenho anterior
      if (prev.width > 0 && prev.height > 0) {
        ctx.drawImage(prev, 0, 0, prev.width, prev.height, 0, 0, canvas.width, canvas.height)
      }
    }

    resize()

    const ro = new ResizeObserver(() => resize())
    ro.observe(stage)
    window.addEventListener('resize', resize)

    return () => {
      ro.disconnect()
      window.removeEventListener('resize', resize)
    }
  }, [isImageEditing])

  const clearDrawLayer = () => {
    const canvas = drawCanvasRef.current
    const ctx = drawCtxRef.current
    if (!canvas || !ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  const getPoint = (evt: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = evt.currentTarget
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const x = (evt.clientX - rect.left) * scaleX
    const y = (evt.clientY - rect.top) * scaleY
    return { x, y }
  }

  const handleDrawPointerDown = (evt: React.PointerEvent<HTMLCanvasElement>) => {
    const ctx = drawCtxRef.current
    if (!ctx) return
    isDrawingRef.current = true
    evt.currentTarget.setPointerCapture(evt.pointerId)
    const { x, y } = getPoint(evt)
    ctx.strokeStyle = drawColor
    ctx.lineWidth = drawSize
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const handleDrawPointerMove = (evt: React.PointerEvent<HTMLCanvasElement>) => {
    const ctx = drawCtxRef.current
    if (!ctx) return
    if (!isDrawingRef.current) return
    const { x, y } = getPoint(evt)
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const handleDrawPointerUp = () => {
    isDrawingRef.current = false
  }

  const handleTextPointerDown = (evt: React.PointerEvent<HTMLDivElement>) => {
    if (imageEditorMode !== 'text') return
    setIsDraggingText(true)
    evt.currentTarget.setPointerCapture(evt.pointerId)
  }

  const handleTextPointerMove = (evt: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingText) return
    const stage = editorSquareRef.current || editorStageRef.current
    if (!stage) return
    const rect = stage.getBoundingClientRect()
    const x = (evt.clientX - rect.left) / rect.width
    const y = (evt.clientY - rect.top) / rect.height
    setTextBoxPos({
      x: Math.min(0.95, Math.max(0.05, x)),
      y: Math.min(0.95, Math.max(0.05, y)),
    })
  }

  const handleTextPointerUp = () => {
    setIsDraggingText(false)
  }

  useEffect(() => {
    if (!isRecording || isRecordingPaused) return
    const t = setInterval(() => setRecordingSeconds((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [isRecording, isRecordingPaused])

  const formatDuration = (totalSeconds: number) => {
    const mm = Math.floor(totalSeconds / 60)
    const ss = totalSeconds % 60
    return `${mm}:${ss.toString().padStart(2, '0')}`
  }

  const getChatLastMessagePreview = (lastMessage: any): string => {
    const msg = lastMessage?.message
    if (!msg) return ''
    if (msg.conversation) return msg.conversation
    if (msg.extendedTextMessage?.text) return msg.extendedTextMessage.text
    if (msg.imageMessage) return '📷 Foto'
    if (msg.videoMessage) return '🎥 Vídeo'
    if (msg.audioMessage) return '🎤 Áudio'
    if (msg.documentMessage) return `📄 ${msg.documentMessage?.fileName || 'Documento'}`
    if (msg.stickerMessage) return '💟 Sticker'
    if (msg.locationMessage) return '📍 Localização'
    if (msg.contactMessage) return '👤 Contato'
    return ''
  }

  const normalizeJid = (input: unknown): string => {
    if (typeof input !== 'string') return ''
    const s = input.trim()
    if (!s) return ''
    if (!s.includes('@')) return ''
    return s
  }

  const pickCanonicalJid = (jids: string[]): string => {
    const cleaned = jids.map((j) => normalizeJid(j)).filter(Boolean)
    return cleaned[0] || ''
  }

  const extractContactJids = (contact: any): string[] => {
    const candidates: unknown[] = [
      contact?.id,
      contact?.remoteJid,
      contact?.jid,
      contact?.wid,
      contact?.waId,
      contact?.wa_id,
    ]

    const out = new Set<string>()
    for (const c of candidates) {
      if (typeof c !== 'string') continue
      const s0 = c.trim()
      if (!s0) continue
      // aceitar jid já completo
      if (/@(s\.whatsapp\.net|c\.us|g\.us|lid)$/i.test(s0)) {
        const jid = normalizeJid(s0)
        if (jid) out.add(jid)
        continue
      }
      // aceitar waId numérico (telefone) e gerar candidatos de jid
      if (/^\d{6,}$/.test(s0)) {
        out.add(`${s0}@s.whatsapp.net`)
        out.add(`${s0}@lid`)
      }
    }

    return Array.from(out)
  }

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
      waDebug('findChats', { instanceName, count: apiChats.length })

      // Resolver nomes em lote (evita chamar fetchProfile para cada chat e reduz erro 400 em massa)
      if (!contactsLoadedRef.current) {
        contactsLoadedRef.current = true
        try {
          const contacts = await evolutionApi.findContacts(instanceName)
          jidAliasRef.current = new Map()
          for (const c of contacts || []) {
            const jid = c?.id || c?.remoteJid || c?.jid
            const name = c?.pushName || c?.notify || c?.name
            if (jid && name) {
              profileNameCacheRef.current.set(jid, name)
              const extracted = evolutionApi.extractNumber(jid)
              if (extracted) {
                profileNameCacheRef.current.set(`${extracted}@s.whatsapp.net`, name)
                profileNameCacheRef.current.set(`${extracted}@lid`, name)
                profileNameCacheRef.current.set(extracted, name)
              }
            }

            const jids = extractContactJids(c)
            if (jids.length >= 2) {
              const canonical = pickCanonicalJid(jids)
              if (canonical) {
                for (const j of jids) jidAliasRef.current.set(j, canonical)
              }
            }
          }
        } catch (e) {
          // ignore
        }
      }

      const nowIso = new Date().toISOString()
      const grouped = new Map<string, WhatsAppChat>()

      const scoreRemoteJidForHistory = (jid: string): number => {
        if (!jid) return 0
        const extracted = evolutionApi.extractNumber(jid)
        const digits = extracted.replace(/\D/g, '')
        // Heurística:
        // - Alguns chats que trazem histórico completo vêm com IDs numéricos bem longos.
        // - Preferir @lid quando existir.
        // - Não normalizar JID; apenas definir preferência de exibição.
        let score = 0
        if (/@lid$/i.test(jid)) score += 100
        if (digits.length >= 14) score += 80
        if (digits.length >= 16) score += 20
        return score
      }

      const shouldHideShortNumericChat = (jid: string): boolean => {
        if (!jid) return false
        // Regra solicitada: ocultar na LISTA quando o identificador exibido é "curto".
        // Aqui avaliamos pela quantidade de dígitos do número extraído do JID,
        // independente de ter sufixo (@s.whatsapp.net/@lid) ou vir puro.
        const extracted = evolutionApi.extractNumber(jid)
        const digits = String(extracted || '').replace(/\D/g, '')
        if (!digits) return false
        // Ex: 553175956874 (12 dígitos) deve sumir.
        // Ex: 237511825702964 (15 dígitos) deve aparecer.
        return digits.length < 14
      }

      for (const apiChat of apiChats) {
        // Usar exclusivamente o remoteJid retornado pelo findChats
        const remoteJid = typeof apiChat?.remoteJid === 'string' ? apiChat.remoteJid.trim() : ''
        if (!remoteJid) continue

        if (shouldHideShortNumericChat(remoteJid)) {
          waDebug('hide chat (short numeric)', { remoteJid })
          continue
        }

        // Unificar visualização quando existirem dois chats para a mesma pessoa.
        // Não normaliza JID: apenas usa o alias vindo do findContacts (jidAliasRef)
        // e agrupa por esse "canonical".
        const aliasCanonical = jidAliasRef.current.get(remoteJid) || remoteJid

        const isGroup = remoteJid.includes('@g.us')
        if (isGroup) continue

        // Preferir URL vinda do backend enriquecido (profilePictureUrl) e depois fallback
        const profilePicUrl =
          String(apiChat.profilePictureUrl || apiChat.profilePicUrl || '').trim() ||
          profilePicCacheRef.current.get(remoteJid) ||
          ''

        const extractedRemote = evolutionApi.extractNumber(remoteJid)
        const cachedName =
          profileNameCacheRef.current.get(remoteJid) ||
          (extractedRemote ? profileNameCacheRef.current.get(extractedRemote) : undefined) ||
          (extractedRemote ? profileNameCacheRef.current.get(`${extractedRemote}@s.whatsapp.net`) : undefined) ||
          (extractedRemote ? profileNameCacheRef.current.get(`${extractedRemote}@lid`) : undefined)
        const contactName =
          String(apiChat.contactName || '').trim() ||
          cachedName ||
          apiChat.pushName ||
          apiChat.notify ||
          apiChat.verifiedName ||
          apiChat.name ||
          apiChat.subject

        const chat: WhatsAppChat = {
          id: `${instanceName}:${remoteJid}`,
          church_id: 'evolution',
          instance_name: instanceName,
          remote_jid: remoteJid,
          contact_name: contactName,
          contact_push_name: apiChat.pushName || apiChat.notify || apiChat.verifiedName,
          profile_picture_url: profilePicUrl,
          is_group: false,
          unread_count: apiChat.unreadCount || apiChat.unread || 0,
          last_message_at: apiChat.lastMessage?.messageTimestamp
            ? new Date(apiChat.lastMessage.messageTimestamp * 1000).toISOString()
            : undefined,
          last_message_preview:
            getChatLastMessagePreview(apiChat.lastMessage),
          is_archived: !!apiChat.archived,
          is_pinned: !!apiChat.pinned,
          created_at: nowIso,
          updated_at: nowIso,
        }

        // Agrupar por canonical para reduzir duplicatas (lid vs s.whatsapp.net) na lista.
        // Mesmo agrupado, mantemos `remote_jid` do item mais recente para filtrar findMessages.
        const stableKey = aliasCanonical
        const existing = grouped.get(stableKey)
        if (!existing) {
          grouped.set(stableKey, {
            ...chat,
            id: `${instanceName}:${stableKey}`,
            remote_jid: remoteJid,
          })
        } else {
          const repTs = existing.last_message_at ? new Date(existing.last_message_at).getTime() : 0
          const curTs = chat.last_message_at ? new Date(chat.last_message_at).getTime() : 0
          const preferCurrentForPreview = curTs >= repTs

          const existingScore = scoreRemoteJidForHistory(existing.remote_jid)
          const currentScore = scoreRemoteJidForHistory(remoteJid)
          const preferCurrentRemoteJid = currentScore > existingScore
          grouped.set(stableKey, {
            ...existing,
            // Preferir o remote_jid que tende a ter histórico completo.
            // Caso empate, manter o do chat mais recente (preview) como antes.
            remote_jid: preferCurrentRemoteJid ? remoteJid : preferCurrentForPreview ? remoteJid : existing.remote_jid,
            unread_count: (existing.unread_count || 0) + (chat.unread_count || 0),
            contact_name: existing.contact_name || chat.contact_name,
            contact_push_name: existing.contact_push_name || chat.contact_push_name,
            profile_picture_url: existing.profile_picture_url || chat.profile_picture_url,
            last_message_at: preferCurrentForPreview ? chat.last_message_at : existing.last_message_at,
            last_message_preview: preferCurrentForPreview ? chat.last_message_preview : existing.last_message_preview,
            updated_at: nowIso,
          })
        }

        // persistência removida nesta tela
      }

      const nextChats = Array.from(grouped.values())
      waDebug('loadChats grouped', { instanceName, groupedCount: nextChats.length })
      setChats(nextChats)
    } catch (error) {
      console.error('Erro ao carregar chats:', error)
      toast.error('Erro ao carregar conversas')
    } finally {
      setIsLoading(false)
      isFetchingChatsRef.current = false
    }
  }, [instanceName, waDebug])

  const ensureProfilePic = useCallback(
    async (chat: WhatsAppChat) => {
      if (!instanceName) return
      if (!chat?.remote_jid) return
      if (chat.profile_picture_url) return

      const extracted = evolutionApi.extractNumber(chat.remote_jid)
      if (!extracted) return
      const cached = profilePicCacheRef.current.get(chat.remote_jid)
      if (cached) return

      try {
        const r = await evolutionApi.fetchProfilePictureUrl(instanceName, extracted)
        const url = String((r as any)?.profilePictureUrl || (r as any)?.profilePicUrl || '').trim()
        if (!url) return
        profilePicCacheRef.current.set(chat.remote_jid, url)
        setChats((prev) => prev.map((c) => (c.id === chat.id ? { ...c, profile_picture_url: url } : c)))
        setSelectedChat((prev) => (prev?.id === chat.id ? { ...prev, profile_picture_url: url } : prev))
      } catch {
        // ignore
      }
    },
    [instanceName]
  )

  useEffect(() => {
    if (!selectedChat) return
    ensureProfilePic(selectedChat)
  }, [selectedChat?.id])

  useEffect(() => {
    if (!instanceName) return
    // pré-carregar fotos só dos primeiros itens para melhorar UX sem flood
    const top = chats.slice(0, 12)
    ;(async () => {
      for (const c of top) {
        // serializado para não estourar rate-limit
        // eslint-disable-next-line no-await-in-loop
        await ensureProfilePic(c)
      }
    })()
  }, [instanceName, chats.length])

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
      waDebug('openChat', {
        chatId: chat.id,
        remoteJid: chat.remote_jid,
        extracted: evolutionApi.extractNumber(chat.remote_jid),
        contactName: chat.contact_name,
      })

      const fetchByRemoteJid = async (remoteJid: string) => {
        waDebug('findMessages request', { remoteJid })
        const r = await evolutionApi.findMessages(instanceName, {
          where: {
            key: {
              remoteJid,
            },
          },
          page: 1,
          offset: 100,
        })

        const records = Array.isArray(r)
          ? r
          : (r as any)?.messages?.records || (r as any)?.messages || (r as any)?.data || []
        waDebug('findMessages response', { remoteJid, count: Array.isArray(records) ? records.length : 0 })
        return records
      }

      const apiMessagesPrimary = await fetchByRemoteJid(chat.remote_jid)

      // Merge: quando existem 2 chats para a mesma pessoa (ex.: @lid e @s.whatsapp.net),
      // a Evolution pode separar o histórico entre eles.
      // Não normalizamos JID: apenas buscamos o "irmão" (mesmo número extraído) e mesclamos.
      let apiMessages: any[] = Array.isArray(apiMessagesPrimary) ? apiMessagesPrimary : []
      waDebug('messages primary', { remoteJid: chat.remote_jid, count: apiMessages.length })

      const mergeByKeyId = (a: any[], b: any[]) => {
        const byKeyId = new Map<string, any>()
        for (const m of a || []) {
          const id = m?.key?.id
          if (id) byKeyId.set(id, m)
        }
        for (const m of b || []) {
          const id = m?.key?.id
          if (id) byKeyId.set(id, m)
        }
        return Array.from(byKeyId.values())
      }
      const extracted = evolutionApi.extractNumber(chat.remote_jid)
      if (extracted) {
        const allChats = chatsRef.current || []
        const sibling = allChats.find((c) => {
          if (!c?.remote_jid) return false
          if (c.remote_jid === chat.remote_jid) return false
          return evolutionApi.extractNumber(c.remote_jid) === extracted
        })

        if (sibling?.remote_jid) {
          waDebug('messages sibling detected', { extracted, siblingRemoteJid: sibling.remote_jid })
          const apiMessagesSecondary = await fetchByRemoteJid(sibling.remote_jid)
          if (Array.isArray(apiMessagesSecondary) && apiMessagesSecondary.length > 0) {
            apiMessages = mergeByKeyId(apiMessages, apiMessagesSecondary)
            waDebug('messages merged sibling', { totalAfterMerge: apiMessages.length })
          }
        }
      }

      // Merge por remoteJidAlt: em chats @lid, o telefone real pode aparecer só em remoteJidAlt.
      // Se os records retornados tiverem remoteJidAlt, buscar também por ele.
      const altRemoteJids = new Set<string>()
      for (const m of apiMessagesPrimary || []) {
        const alt = m?.key?.remoteJidAlt
        if (typeof alt === 'string') {
          const s = alt.trim()
          if (s) altRemoteJids.add(s)
        }
      }
      if (altRemoteJids.size > 0) {
        waDebug('messages remoteJidAlt detected', { alts: Array.from(altRemoteJids) })
      }
      if (altRemoteJids.size > 0) {
        for (const alt of altRemoteJids) {
          if (alt === chat.remote_jid) continue
          const altMessages = await fetchByRemoteJid(alt)
          if (Array.isArray(altMessages) && altMessages.length > 0) {
            apiMessages = mergeByKeyId(apiMessages, altMessages)
            waDebug('messages merged alt', { alt, totalAfterMerge: apiMessages.length })
          }
        }
      }

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
            thumbnail_base64:
              msg.message?.imageMessage?.jpegThumbnail ||
              msg.message?.videoMessage?.jpegThumbnail ||
              undefined,
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

          // persistência removida nesta tela
        }
      }

      // Só aplicar resultado se ainda estivermos no mesmo chat e a requisição não foi invalidada
      if (requestToken !== messagesRequestTokenRef.current) return
      if (selectedChatIdRef.current !== chat.id) return

      // Mesclar apenas dentro do MESMO chat (para evitar piscar após envio)
      const existing = messagesRef.current

      // Remover duplicação visual: quando a mensagem otimista ainda está no estado,
      // mas a Evolution já retornou a mensagem real.
      const realOutgoingTexts = mappedMessages
        .filter((m) => m.from_me && m.message_type === 'text' && (m.text_content || '').trim())
        .map((m) => ({
          text: (m.text_content || '').trim(),
          ts: new Date(m.message_timestamp).getTime(),
        }))

      const dedupedExisting = existing.filter((m) => {
        if (!m.id?.startsWith('optimistic_')) return true
        if (!m.from_me) return true
        if (m.message_type !== 'text') return true
        const text = (m.text_content || '').trim()
        if (!text) return true
        const ts = new Date(m.message_timestamp).getTime()
        // Considerar duplicata se houver uma mensagem real igual dentro de 2 minutos
        return !realOutgoingTexts.some((r) => r.text === text && Math.abs(r.ts - ts) <= 2 * 60 * 1000)
      })

      const byId = new Map<string, WhatsAppMessage>()
      for (const m of dedupedExisting) byId.set(m.id, m)
      for (const m of mappedMessages) byId.set(m.id, m)
      const merged = Array.from(byId.values()).sort((a, b) => {
        return new Date(a.message_timestamp).getTime() - new Date(b.message_timestamp).getTime()
      })
      setMessages(merged)

      // persistência removida nesta tela

      // Só rolar para o fim se o usuário já estava no fim (ou próximo)
      if (shouldAutoScrollRef.current) {
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
        }, 100)
      }
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error)
    } finally {
      isFetchingMessagesRef.current = false
    }
  }, [instanceName])

  const handleMediaClick = useCallback(
    async (message: WhatsAppMessage, opts?: { openModal?: boolean }) => {
      if (!instanceName) return
      // Se já tem base64, só abrir
      if (message.media_base64) {
        if (opts?.openModal !== false) setMediaPreview(message)
        return
      }
      try {
        const res = await evolutionApi.getBase64FromMediaMessage(instanceName, message.message_id, message.remote_jid)
        // Cachear no histórico para permitir preview inline (áudio) sem depender do modal
        setMessages((prev) =>
          prev.map((m) =>
            m.id === message.id
              ? {
                  ...m,
                  media_base64: res.base64,
                  media_mimetype: res.mimetype || m.media_mimetype,
                }
              : m
          )
        )
        if (opts?.openModal !== false) {
          setMediaPreview({
            ...message,
            media_base64: res.base64,
            media_mimetype: res.mimetype || message.media_mimetype,
          })
        }
      } catch (e) {
        toast.error('Não foi possível carregar a mídia')
      }
    },
    [instanceName]
  )

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
    if (!canSendWhatsapp) {
      toast.error('Somente visualização')
      return
    }
    if (!newMessage.trim() || !selectedChat || !instanceName) return
    
    const textToSend = newMessage.trim()

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
      // Forçar scroll após envio (usuário acabou de enviar)
      shouldAutoScrollRef.current = true
      userScrolledUpRef.current = false
      await loadMessages(selectedChat)
      
      // Scroll to bottom (sempre ao enviar)
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
    if (!canSendWhatsapp) {
      toast.error('Somente visualização')
      return
    }
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
          caption: pendingCaption || '',
          media: base64DataUrl,
        })
      }

      // Forçar scroll após envio de mídia
      shouldAutoScrollRef.current = true
      userScrolledUpRef.current = false
      await loadMessages(selectedChat)
      setShowAttachMenu(false)
      setPendingCaption('')
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
    if (!canSendWhatsapp) {
      toast.error('Somente visualização')
      return
    }
    const file = e.target.files?.[0]
    if (!file) return

    let type: 'image' | 'video' | 'document' | 'audio' = 'document'
    if (file.type.startsWith('image/')) type = 'image'
    else if (file.type.startsWith('video/')) type = 'video'
    else if (file.type.startsWith('audio/')) type = 'audio'

    if (type === 'audio') {
      handleSendMedia(file, 'audio')
    } else {
      setPendingMedia({ file, type })
      setPendingCaption('')
      setShowAttachMenu(false)
    }
    e.target.value = ''
  }

  const applyImageEdits = useCallback(async () => {
    if (!pendingMedia || pendingMedia.type !== 'image') return
    if (!imageWorkingSrc) return

    // Desenho/texto em canvas (sobre a imagem já "baked"/quadrada)
    const img = await createImage(imageWorkingSrc)
    const canvas = document.createElement('canvas')
    canvas.width = img.width
    canvas.height = img.height
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(img, 0, 0)

    // Aplicar camada de desenho (se existir)
    const drawCanvas = drawCanvasRef.current
    if (drawCanvas) {
      ctx.drawImage(drawCanvas, 0, 0, drawCanvas.width, drawCanvas.height, 0, 0, canvas.width, canvas.height)
    }

    // Se existe overlay salvo em dataURL, aplicar
    // Neste editor simples, usamos apenas texto central se existir
    if (textToAdd.trim()) {
      ctx.font = `bold ${Math.max(18, Math.floor(canvas.width * 0.05))}px sans-serif`
      ctx.fillStyle = '#ffffff'
      ctx.strokeStyle = '#000000'
      ctx.lineWidth = 4
      ctx.textBaseline = 'middle'
      ctx.textAlign = 'center'
      const tx = canvas.width * textBoxPos.x
      const ty = canvas.height * textBoxPos.y
      ctx.strokeText(textToAdd.trim(), tx, ty)
      ctx.fillText(textToAdd.trim(), tx, ty)
    }

    const out = canvas.toDataURL('image/jpeg', 0.92)
    const newFile = await dataUrlToFile(out, pendingMedia.file.name.replace(/\.[^/.]+$/, '') + '_edit.jpg')
    setEditedImageFile(newFile)
    setIsImageEditing(false)
  }, [pendingMedia, imageWorkingSrc, textToAdd, textBoxPos])

  const applyCropOnly = useCallback(async () => {
    if (!pendingMedia || pendingMedia.type !== 'image') return
    if (!imageEditorSrc) return
    if (!croppedAreaPixels) return

    const out = await getCroppedDataUrl(imageEditorSrc, croppedAreaPixels)
    setImageWorkingSrc(out)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setCroppedAreaPixels(null)
    clearDrawLayer()
    setTextToAdd('')
    setTextBoxPos({ x: 0.5, y: 0.1 })
    setImageEditorMode('draw')
  }, [pendingMedia, imageEditorSrc, croppedAreaPixels])

  const hasPendingEdits = () => {
    const hasText = !!textToAdd.trim()
    const drawCanvas = drawCanvasRef.current
    const hasDraw = !!drawCanvas && drawCanvas.width > 0 && drawCanvas.height > 0
    return hasText || hasDraw
  }

  const buildEditedImageFile = useCallback(async (): Promise<File | null> => {
    if (!pendingMedia || pendingMedia.type !== 'image') return null
    if (!imageWorkingSrc) return null
    const img = await createImage(imageWorkingSrc)
    const canvas = document.createElement('canvas')
    canvas.width = img.width
    canvas.height = img.height
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.drawImage(img, 0, 0)

    const drawCanvas = drawCanvasRef.current
    if (drawCanvas) {
      ctx.drawImage(drawCanvas, 0, 0, drawCanvas.width, drawCanvas.height, 0, 0, canvas.width, canvas.height)
    }

    if (textToAdd.trim()) {
      ctx.font = `bold ${Math.max(18, Math.floor(canvas.width * 0.05))}px sans-serif`
      ctx.fillStyle = '#ffffff'
      ctx.strokeStyle = '#000000'
      ctx.lineWidth = 4
      ctx.textBaseline = 'middle'
      ctx.textAlign = 'center'
      const tx = canvas.width * textBoxPos.x
      const ty = canvas.height * textBoxPos.y
      ctx.strokeText(textToAdd.trim(), tx, ty)
      ctx.fillText(textToAdd.trim(), tx, ty)
    }

    const out = canvas.toDataURL('image/jpeg', 0.92)
    return dataUrlToFile(out, pendingMedia.file.name.replace(/\.[^/.]+$/, '') + '_edit.jpg')
  }, [pendingMedia, imageWorkingSrc, textToAdd, textBoxPos])

  const handleToggleRecording = async () => {
    if (!canSendWhatsapp) {
      toast.error('Somente visualização')
      return
    }
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
      setIsRecordingPaused(false)
      setRecordingSeconds(0)
    } catch (err) {
      console.error('Erro ao acessar microfone:', err)
      toast.error('Permita acesso ao microfone para gravar áudio')
    }
  }

  const handlePauseResumeRecording = () => {
    const rec = mediaRecorderRef.current
    if (!rec) return
    if (rec.state === 'recording') {
      rec.pause()
      setIsRecordingPaused(true)
    } else if (rec.state === 'paused') {
      rec.resume()
      setIsRecordingPaused(false)
    }
  }

  const handleCancelRecording = () => {
    const rec = mediaRecorderRef.current
    if (!rec) return
    try {
      rec.onstop = null
      rec.stop()
    } catch (e) {
      // ignore
    }
    audioChunksRef.current = []
    setIsRecording(false)
    setIsRecordingPaused(false)
    setRecordingSeconds(0)
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
  // Pausa o polling se o usuário estiver lendo mensagens antigas (rolado para cima)
  useEffect(() => {
    if (!instanceName || !selectedChat) return
    const interval = setInterval(() => {
      // Só atualiza se usuário não estiver rolado pra cima
      if (!userScrolledUpRef.current) {
        loadMessages(selectedChat)
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [instanceName, selectedChat, loadMessages])

  // Detectar se usuário está no fim da lista de mensagens
  const handleMessagesScroll = useCallback(() => {
    const container = messagesContainerRef.current
    if (!container) return

    const { scrollTop, scrollHeight, clientHeight } = container
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight
    
    // Considerar "no fim" se estiver a menos de 100px do final
    const isNearBottom = distanceFromBottom < 100
    shouldAutoScrollRef.current = isNearBottom
    userScrolledUpRef.current = !isNearBottom
  }, [])

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
              ref={messagesContainerRef}
              onScroll={handleMessagesScroll}
              className="flex-1 overflow-y-auto p-4"
              style={{ backgroundImage: 'url(/whatsapp-bg.png)', backgroundColor: '#e5ddd5' }}
            >
              {messages.map(message => (
                <MessageBubble 
                  key={message.id} 
                  message={message}
                  onMediaClick={handleMediaClick}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            {canSendWhatsapp ? (
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
                            setShowAttachMenu(false)
                          }}
                          className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-lg"
                        >
                          <ImageIcon className="w-5 h-5 text-purple-500" />
                          <span>Imagem</span>
                        </button>
                        <button
                          onClick={() => {
                            fileInputRef.current?.click()
                            setShowAttachMenu(false)
                          }}
                          className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-lg"
                        >
                          <Camera className="w-5 h-5 text-pink-500" />
                          <span>Vídeo</span>
                        </button>
                        <button
                          onClick={() => {
                            fileInputRef.current?.click()
                            setShowAttachMenu(false)
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
                    placeholder={'Digite uma mensagem...'}
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
                    <div className="flex items-center gap-2">
                      {isRecording && (
                        <span className="text-xs text-gray-600 tabular-nums">{formatDuration(recordingSeconds)}</span>
                      )}
                      {isRecording && (
                        <button
                          onClick={handlePauseResumeRecording}
                          disabled={isSending}
                          className="p-2 rounded-full hover:bg-gray-200 disabled:opacity-50"
                          title={isRecordingPaused ? 'Retomar' : 'Pausar'}
                        >
                          {isRecordingPaused ? (
                            <Play className="w-5 h-5 text-gray-600" />
                          ) : (
                            <Pause className="w-5 h-5 text-gray-600" />
                          )}
                        </button>
                      )}
                      {isRecording && (
                        <button
                          onClick={handleCancelRecording}
                          disabled={isSending}
                          className="p-2 rounded-full hover:bg-gray-200 disabled:opacity-50"
                          title="Cancelar"
                        >
                          <Square className="w-5 h-5 text-gray-600" />
                        </button>
                      )}
                      <button
                        onClick={handleToggleRecording}
                        disabled={isSending}
                        className="p-2 rounded-full hover:bg-gray-200 disabled:opacity-50"
                        title={isRecording ? 'Enviar áudio' : 'Gravar áudio'}
                      >
                        {isRecording ? (
                          <Send className="w-6 h-6 text-green-600" />
                        ) : (
                          <Mic className="w-6 h-6 text-gray-600" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <Phone className="w-24 h-24 text-gray-400" />
              </div>
              <h3 className="text-xl font-medium text-gray-700 mb-2">WhatsApp Web</h3>
              <p className="text-gray-500">Selecione uma conversa para começar</p>
            </div>
          </div>
        )}
      </div>

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
              src={
                mediaPreview.media_base64
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
              src={
                mediaPreview.media_base64
                  ? `data:${mediaPreview.media_mimetype};base64,${mediaPreview.media_base64}`
                  : mediaPreview.media_url || ''
              }
              controls
              autoPlay
              className="max-w-[90vw] max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            />
          )}

          {(mediaPreview.message_type === 'document' || mediaPreview.message_type === 'audio') && (
            <div className="bg-white rounded-lg p-6 max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium truncate">{mediaPreview.media_filename || 'Arquivo'}</p>
                  <p className="text-sm text-gray-500 truncate">{mediaPreview.media_mimetype || mediaPreview.message_type}</p>
                </div>
                {mediaPreview.media_base64 && (
                  <a
                    className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                    href={`data:${mediaPreview.media_mimetype || 'application/octet-stream'};base64,${mediaPreview.media_base64}`}
                    download={mediaPreview.media_filename || 'arquivo'}
                  >
                    Baixar
                  </a>
                )}
              </div>
              {mediaPreview.message_type === 'audio' && mediaPreview.media_base64 && (
                <audio
                  className="mt-4 w-full"
                  controls
                  src={`data:${mediaPreview.media_mimetype || 'audio/ogg'};base64,${mediaPreview.media_base64}`}
                />
              )}
            </div>
          )}
        </div>
      )}

      {pendingMedia && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={() => setPendingMedia(null)}>
          <div className="bg-white rounded-lg w-[min(720px,90vw)] p-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Enviar {pendingMedia.type}</h3>
              <button className="p-2 hover:bg-gray-100 rounded" onClick={() => setPendingMedia(null)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {pendingMedia.type === 'image' && (
              <div>
                {isImageEditing ? (
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <button
                          className={`px-3 py-1.5 rounded border ${imageEditorMode === 'crop' ? 'bg-gray-100' : ''}`}
                          onClick={() => setImageEditorMode('crop')}
                        >
                          Cortar
                        </button>
                        <button
                          className={`px-3 py-1.5 rounded border ${imageEditorMode === 'draw' ? 'bg-gray-100' : ''}`}
                          onClick={async () => {
                            if (imageEditorMode === 'crop' && croppedAreaPixels) {
                              await applyCropOnly()
                              return
                            }
                            setImageEditorMode('draw')
                          }}
                        >
                          Desenhar
                        </button>
                        <button
                          className={`px-3 py-1.5 rounded border ${imageEditorMode === 'text' ? 'bg-gray-100' : ''}`}
                          onClick={async () => {
                            if (imageEditorMode === 'crop' && croppedAreaPixels) {
                              await applyCropOnly()
                              setImageEditorMode('text')
                              return
                            }
                            setImageEditorMode('text')
                          }}
                        >
                          Texto
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="px-3 py-1.5 rounded border" onClick={() => setIsImageEditing(false)}>
                          Visualizar
                        </button>
                        {imageEditorMode === 'crop' ? (
                          <button className="px-3 py-1.5 rounded bg-green-500 text-white hover:bg-green-600" onClick={applyCropOnly}>
                            Aplicar corte
                          </button>
                        ) : (
                          <button className="px-3 py-1.5 rounded bg-green-500 text-white hover:bg-green-600" onClick={applyImageEdits}>
                            Aplicar
                          </button>
                        )}
                      </div>
                    </div>

                    <div ref={editorStageRef} className="relative w-full h-[50vh] bg-black/10 rounded overflow-hidden">
                      {imageEditorMode === 'crop' ? (
                        <Cropper
                          image={imageEditorSrc}
                          crop={crop}
                          zoom={zoom}
                          aspect={1}
                          onCropChange={setCrop}
                          onZoomChange={setZoom}
                          onCropComplete={(_area: any, pixels: { x: number; y: number; width: number; height: number }) =>
                            setCroppedAreaPixels(pixels)
                          }
                          objectFit="contain"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div
                            ref={editorSquareRef}
                            className="relative"
                            style={{ width: editorSquareSize || '100%', height: editorSquareSize || '100%' }}
                          >
                            <img
                              src={imageWorkingSrc}
                              className="absolute inset-0 w-full h-full object-cover"
                              alt="edit"
                            />
                            {(imageEditorMode === 'draw' || imageEditorMode === 'text') && (
                              <canvas
                                ref={drawCanvasRef}
                                className={`absolute inset-0 w-full h-full ${imageEditorMode === 'draw' ? 'touch-none' : 'pointer-events-none'}`}
                                onPointerDown={imageEditorMode === 'draw' ? handleDrawPointerDown : undefined}
                                onPointerMove={imageEditorMode === 'draw' ? handleDrawPointerMove : undefined}
                                onPointerUp={imageEditorMode === 'draw' ? handleDrawPointerUp : undefined}
                                onPointerCancel={imageEditorMode === 'draw' ? handleDrawPointerUp : undefined}
                                onPointerLeave={imageEditorMode === 'draw' ? handleDrawPointerUp : undefined}
                              />
                            )}
                            {imageEditorMode === 'text' && (
                              <div
                                className="absolute left-0 top-0 w-full h-full"
                                onPointerMove={handleTextPointerMove}
                                onPointerUp={handleTextPointerUp}
                                onPointerCancel={handleTextPointerUp}
                                onPointerLeave={handleTextPointerUp}
                              >
                                <div
                                  onPointerDown={handleTextPointerDown}
                                  className="absolute px-2 py-1 rounded bg-black/40 text-white border border-white/30 cursor-move select-none"
                                  style={{
                                    left: `${textBoxPos.x * 100}%`,
                                    top: `${textBoxPos.y * 100}%`,
                                    transform: 'translate(-50%, -50%)',
                                    maxWidth: '90%',
                                  }}
                                  title="Arraste para mover"
                                >
                                  <input
                                    value={textToAdd}
                                    onChange={(e) => setTextToAdd(e.target.value)}
                                    placeholder="Digite..."
                                    className="bg-transparent outline-none text-sm w-[220px] max-w-[80vw]"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {imageEditorMode === 'crop' && (
                      <div className="mt-3 flex items-center gap-3">
                        <label className="text-sm text-gray-600">Zoom</label>
                        <input
                          type="range"
                          min={1}
                          max={3}
                          step={0.05}
                          value={zoom}
                          onChange={(e) => setZoom(Number(e.target.value))}
                          className="flex-1"
                        />
                      </div>
                    )}

                    {imageEditorMode === 'draw' && (
                      <div className="mt-3 flex items-center gap-3">
                        <label className="text-sm text-gray-600">Cor</label>
                        <input type="color" value={drawColor} onChange={(e) => setDrawColor(e.target.value)} />
                        <label className="text-sm text-gray-600">Esp.</label>
                        <input
                          type="range"
                          min={1}
                          max={18}
                          step={1}
                          value={drawSize}
                          onChange={(e) => setDrawSize(Number(e.target.value))}
                        />
                        <button className="px-3 py-1.5 rounded border" onClick={clearDrawLayer}>
                          Limpar
                        </button>
                      </div>
                    )}

                    {imageEditorMode === 'text' && (
                      <div className="mt-3 text-sm text-gray-600">
                        Arraste a caixa de texto na imagem para posicionar.
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <img
                      className="max-h-[50vh] mx-auto rounded"
                      src={editedImageFile ? URL.createObjectURL(editedImageFile) : imageEditorSrc}
                      alt="preview"
                    />
                    <div className="mt-2 flex justify-end">
                      <button className="px-3 py-1.5 rounded border" onClick={() => setIsImageEditing(true)}>
                        Editar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            {pendingMedia.type === 'video' && (
              <video className="max-h-[50vh] w-full" controls src={URL.createObjectURL(pendingMedia.file)} />
            )}
            {pendingMedia.type === 'document' && (
              <div className="p-4 bg-gray-50 rounded">
                <p className="font-medium">{pendingMedia.file.name}</p>
                <p className="text-sm text-gray-500">{pendingMedia.file.type || 'documento'}</p>
              </div>
            )}

            <div className="mt-4">
              <input
                value={pendingCaption}
                onChange={(e) => setPendingCaption(e.target.value)}
                placeholder="Legenda (opcional)"
                className="w-full px-3 py-2 border rounded"
              />
            </div>

            <div className="mt-4 flex gap-2 justify-end">
              <button
                onClick={() => {
                  setPendingMedia(null)
                  setPendingCaption('')
                }}
                className="px-4 py-2 rounded border"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  const { file, type } = pendingMedia
                  if (type === 'image') {
                    // Se ainda está em crop, mas tem seleção, bake crop antes
                    if (imageEditorMode === 'crop' && croppedAreaPixels) {
                      await applyCropOnly()
                    }
                    // Se existe edição (desenho/texto), gerar arquivo final antes de enviar
                    const finalFile = editedImageFile || (hasPendingEdits() ? await buildEditedImageFile() : null)
                    setPendingMedia(null)
                    if (finalFile) {
                      await handleSendMedia(finalFile, 'image')
                    } else {
                      await handleSendMedia(file, 'image')
                    }
                    return
                  }

                  setPendingMedia(null)
                  await handleSendMedia(file, type)
                }}
                className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
              >
                Enviar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
