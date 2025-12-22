import { useState, useEffect, useRef } from 'react'
import { 
  Send, 
  MessageSquare, 
  Users, 
  Clock,
  Check,
  CheckCheck,
  Phone,
  Video,
  MoreVertical,
  RefreshCw,
  Paperclip,
  FileText,
  Mic,
  Play,
  Pause,
  Download
} from 'lucide-react'
import type { WhatsAppChat, WhatsAppMessage } from '../../hooks/useWhatsAppWeb'

interface ChatInterfaceProps {
  chats: WhatsAppChat[]
  messages: { [chatId: string]: WhatsAppMessage[] }
  onSendMessage: (to: string, message: string) => void
  onSendMedia?: (to: string, media: any) => void
  onGetChatMessages: (chatId: string) => void
  isConnected: boolean
}

export function ChatInterface({ chats, messages, onSendMessage, onSendMedia, onGetChatMessages, isConnected }: ChatInterfaceProps) {
  const [selectedChat, setSelectedChat] = useState<WhatsAppChat | null>(null)
  const [messageText, setMessageText] = useState('')
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [audioPlayers, setAudioPlayers] = useState<{[key: string]: HTMLAudioElement}>({})
  const [playingAudio, setPlayingAudio] = useState<string | null>(null)
  const [imageModal, setImageModal] = useState<{isOpen: boolean, src: string, alt: string}>({
    isOpen: false,
    src: '',
    alt: ''
  })
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  useEffect(() => {
    if (selectedChat && messages[selectedChat.id]) {
      scrollToBottom()
    }
  }, [messages, selectedChat])

  useEffect(() => {
    if (selectedChat && messages[selectedChat.id]) {
      setLoadingMessages(false)
    }
  }, [messages, selectedChat])

  const handleSendMessage = () => {
    if (!selectedChat || !messageText.trim() || !isConnected) return

    onSendMessage(selectedChat.id, messageText.trim())
    setMessageText('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const getMessageAckIcon = (ack: number) => {
    switch (ack) {
      case 0:
        return <Clock className="w-3 h-3 text-gray-400" />
      case 1:
        return <Check className="w-3 h-3 text-gray-400" />
      case 2:
        return <CheckCheck className="w-3 h-3 text-gray-400" />
      case 3:
        return <CheckCheck className="w-3 h-3 text-blue-500" />
      default:
        return null
    }
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const renderMessageContent = (message: WhatsAppMessage) => {
    switch (message.type) {
      case 'image':
        return (
          <div className="space-y-2">
            {message.mediaUrl && (
              <img 
                src={message.mediaUrl} 
                alt="Imagem" 
                className="max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setImageModal({
                  isOpen: true,
                  src: message.mediaUrl!,
                  alt: message.filename || 'Imagem'
                })}
              />
            )}
            {message.body && <p className="text-sm">{message.body}</p>}
          </div>
        )
      
      case 'video':
        return (
          <div className="space-y-2">
            {message.mediaUrl && (
              <video 
                controls 
                className="max-w-xs rounded-lg"
                preload="metadata"
              >
                <source src={message.mediaUrl} type="video/mp4" />
                Seu navegador não suporta vídeos.
              </video>
            )}
            {message.body && <p className="text-sm">{message.body}</p>}
          </div>
        )
      
      case 'audio':
      case 'ptt':
        return (
          <div className="flex items-center gap-2 bg-black/10 rounded-lg p-2">
            <button 
              className="p-1 hover:bg-black/10 rounded"
              onClick={() => toggleAudio(message.id, message.mediaUrl!)}
            >
              {playingAudio === message.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <div className="flex-1 h-1 bg-gray-300 rounded-full">
              <div className="h-full bg-green-500 rounded-full" style={{ width: '0%' }}></div>
            </div>
            <span className="text-xs text-gray-500">{message.duration ? formatDuration(message.duration) : '0:00'}</span>
            {message.mediaUrl && (
              <button 
                className="p-1 hover:bg-black/10 rounded"
                onClick={() => downloadMedia(message.mediaUrl!, message.filename || 'audio')}
              >
                <Download className="w-3 h-3" />
              </button>
            )}
          </div>
        )
      
      case 'document':
        return (
          <div className="flex items-center gap-3 bg-black/10 rounded-lg p-3">
            <FileText className="w-8 h-8 text-blue-500" />
            <div className="flex-1">
              <p className="font-medium text-sm">{message.filename || 'Documento'}</p>
              {message.filesize && (
                <p className="text-xs text-gray-500">{formatFileSize(message.filesize)}</p>
              )}
            </div>
            {message.mediaUrl && (
              <button 
                className="p-2 hover:bg-black/10 rounded"
                onClick={() => downloadMedia(message.mediaUrl!, message.filename || 'document')}
              >
                <Download className="w-4 h-4" />
              </button>
            )}
          </div>
        )
      
      default:
        return <p className="text-sm whitespace-pre-wrap">{message.body}</p>
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const toggleAudio = (messageId: string, mediaUrl: string) => {
    if (playingAudio === messageId) {
      const audio = audioPlayers[messageId]
      if (audio) {
        audio.pause()
        setPlayingAudio(null)
      }
    } else {
      Object.values(audioPlayers).forEach(audio => {
        if (!audio.paused) {
          audio.pause()
        }
      })
      setPlayingAudio(null)
      
      let audio = audioPlayers[messageId]
      if (!audio) {
        audio = new Audio(mediaUrl)
        audio.onended = () => setPlayingAudio(null)
        audio.onerror = () => setPlayingAudio(null)
        setAudioPlayers(prev => ({ ...prev, [messageId]: audio }))
      }
      
      audio.play().catch(() => setPlayingAudio(null))
      setPlayingAudio(messageId)
    }
  }

  const downloadMedia = (mediaUrl: string, filename: string) => {
    const link = document.createElement('a')
    link.href = mediaUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      })
      
      const options = [
        { mimeType: 'audio/mp4' },
        { mimeType: 'audio/wav' },
        { mimeType: 'audio/webm;codecs=opus' },
        { mimeType: 'audio/webm' }
      ]
      
      let selectedOptions = options.find(option => MediaRecorder.isTypeSupported(option.mimeType))
      if (!selectedOptions) {
        selectedOptions = { mimeType: 'audio/webm' }
      }
      
      const recorder = new MediaRecorder(stream, selectedOptions)
      const chunks: BlobPart[] = []
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data)
        }
      }
      
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: selectedOptions.mimeType })
        const filename = `audio_${Date.now()}.${selectedOptions.mimeType.includes('webm') ? 'webm' : 'wav'}`
        const file = new File([blob], filename, { type: selectedOptions.mimeType })
        handleFileUpload([file])
        stream.getTracks().forEach(track => track.stop())
      }
      
      recorder.onerror = () => {
        setIsRecording(false)
        stream.getTracks().forEach(track => track.stop())
      }
      
      recorder.start(1000)
      setMediaRecorder(recorder)
      setIsRecording(true)
    } catch (error) {
      console.error('Erro ao iniciar gravação:', error)
      alert('Erro ao acessar o microfone. Verifique as permissões.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop()
      setMediaRecorder(null)
      setIsRecording(false)
    }
  }

  const handleFileUpload = async (files: FileList | File[]) => {
    if (!selectedChat) return
    if (!onSendMedia) return
    
    const fileArray = Array.from(files)
    
    for (const file of fileArray) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const base64 = e.target?.result as string
        if (base64) {
          const mediaData = {
            data: base64.split(',')[1],
            mimetype: file.type,
            filename: file.name,
            filesize: file.size
          }
          
          onSendMedia(selectedChat.id, mediaData)
        }
      }
      
      reader.readAsDataURL(file)
    }
  }

  const getLastMessagePreview = (chat: WhatsAppChat) => {
    const chatMessages = messages[chat.id] || []
    const lastMessage = chatMessages[chatMessages.length - 1]
    const messageToCheck = lastMessage || chat.lastMessage
    
    if (!messageToCheck) {
      return 'Nenhuma mensagem'
    }

    if (messageToCheck.hasMedia || (messageToCheck.type && messageToCheck.type !== 'chat')) {
      switch (messageToCheck.type) {
        case 'image':
          return '📷 Imagem'
        case 'audio':
        case 'ptt':
          return '🎵 Áudio'
        case 'video':
          return '🎥 Vídeo'
        case 'document':
          return '📄 Documento'
        case 'sticker':
          return '🎭 Figurinha'
        default:
          if (messageToCheck.hasMedia) {
            return '📎 Mídia'
          }
      }
    }

    const messageText = messageToCheck.body || ''
    return messageText.length > 50 
      ? messageText.substring(0, 50) + '...'
      : messageText || 'Mensagem'
  }

  if (!isConnected) {
    return (
      <div className="rounded-xl border bg-white p-12 text-center">
        <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2 text-gray-700">WhatsApp não conectado</h3>
        <p className="text-gray-500">
          Conecte-se ao WhatsApp Web para acessar suas conversas
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[700px]">
      {/* Lista de Conversas */}
      <div className="lg:col-span-1 rounded-xl border bg-white overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Conversas</h3>
              <p className="text-sm text-gray-500">{chats.length} conversas ativas</p>
            </div>
          </div>
        </div>
        <div className="overflow-y-auto h-[calc(100%-80px)]">
          {chats.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              Nenhuma conversa encontrada
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  className={`p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                    selectedChat?.id === chat.id 
                      ? 'bg-purple-50 border border-purple-200' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => {
                    if (chat && chat.id) {
                      setSelectedChat(chat)
                      setLoadingMessages(true)
                      onGetChatMessages(chat.id)
                      chat.unreadCount = 0
                      setTimeout(() => setLoadingMessages(false), 3000)
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white font-semibold ${
                      chat.isGroup 
                        ? 'bg-indigo-500' 
                        : 'bg-purple-500'
                    }`}>
                      {chat.isGroup ? (
                        <Users className="w-5 h-5" />
                      ) : (
                        chat.name?.charAt(0)?.toUpperCase() || '?'
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium truncate text-gray-800">{chat.name || 'Contato sem nome'}</h4>
                        {chat.timestamp && (
                          <span className="text-xs text-gray-400">
                            {formatTime(chat.timestamp)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 truncate">
                        {getLastMessagePreview(chat)}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        {chat.isGroup && (
                          <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">
                            Grupo
                          </span>
                        )}
                        {chat.unreadCount > 0 && (
                          <span className="text-xs bg-purple-500 text-white px-2 py-0.5 rounded-full">
                            {chat.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Área de Chat */}
      <div className="lg:col-span-2 rounded-xl border bg-white overflow-hidden flex flex-col">
        {selectedChat ? (
          <>
            {/* Header do Chat */}
            <div className="p-4 border-b bg-purple-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-semibold ${
                    selectedChat.isGroup 
                      ? 'bg-indigo-500' 
                      : 'bg-purple-500'
                  }`}>
                    {selectedChat.isGroup ? (
                      <Users className="w-6 h-6" />
                    ) : (
                      selectedChat.name?.charAt(0)?.toUpperCase() || '?'
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 text-lg">{selectedChat.name || 'Contato sem nome'}</h3>
                    <p className="text-sm text-purple-600 font-medium">
                      {selectedChat.isGroup ? '👥 Grupo' : '👤 Contato'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg" disabled>
                    <Phone className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg" disabled>
                    <Video className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg" disabled>
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Mensagens */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              {loadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <div className="flex flex-col items-center gap-3">
                    <RefreshCw className="w-8 h-8 animate-spin text-purple-500" />
                    <span className="text-gray-600 font-medium">Carregando mensagens...</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {(messages[selectedChat.id] || []).map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.fromMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${
                          message.fromMe
                            ? 'bg-purple-600 text-white'
                            : 'bg-white border border-gray-200 text-gray-800'
                        }`}
                      >
                        {!message.fromMe && selectedChat.isGroup && message.author && (
                          <p className="text-xs font-semibold mb-1 text-green-600">
                            {message.author}
                          </p>
                        )}
                        {renderMessageContent(message)}
                        <div className={`flex items-center justify-end gap-1 mt-1 ${
                          message.fromMe ? 'text-purple-200' : 'text-gray-400'
                        }`}>
                          <span className="text-xs">
                            {formatTime(message.timestamp)}
                          </span>
                          {message.fromMe && getMessageAckIcon(message.ack)}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input de Mensagem */}
            <div className="p-4 bg-white border-t">
              <div className="flex items-center gap-3">
                <button
                  className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="w-5 h-5" />
                </button>
                <button
                  className={`p-2 rounded-lg ${isRecording ? 'text-red-500 bg-red-50' : 'text-purple-600 hover:bg-purple-50'}`}
                  onClick={isRecording ? stopRecording : startRecording}
                >
                  <Mic className={`w-5 h-5 ${isRecording ? 'animate-pulse' : ''}`} />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                  className="hidden"
                  onChange={(e) => {
                    const files = e.target.files
                    if (files && files.length > 0) {
                      handleFileUpload(files)
                    }
                  }}
                />
                <input
                  type="text"
                  placeholder="Digite uma mensagem..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100"
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={!messageText.trim() || !isConnected}
                  className="p-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-20 h-20 rounded-2xl bg-purple-100 flex items-center justify-center mx-auto mb-6">
                <MessageSquare className="w-10 h-10 text-purple-500" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-800">Selecione uma conversa</h3>
              <p className="text-gray-500 max-w-sm">
                Escolha uma conversa da lista ao lado para começar a enviar mensagens
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Modal de visualização de imagem */}
      {imageModal.isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
          onClick={() => setImageModal({ isOpen: false, src: '', alt: '' })}
        >
          <div className="relative max-w-full max-h-full p-4">
            <img 
              src={imageModal.src} 
              alt={imageModal.alt}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              className="absolute top-4 right-4 text-white bg-black bg-opacity-60 rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-80 transition-all text-xl font-bold"
              onClick={() => setImageModal({ isOpen: false, src: '', alt: '' })}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
