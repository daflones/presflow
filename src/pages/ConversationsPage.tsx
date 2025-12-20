import { useEffect, useState, useRef } from 'react';
import { MessageSquare, Send, ChevronDown, Phone, Search, RefreshCw, Image, Mic, FileText, Download } from 'lucide-react';
import { whatsappDbService } from '../services/supabase';

type MessageContent = {
  conversation?: string;
  extendedTextMessage?: { text: string };
  imageMessage?: { 
    url?: string;
    caption?: string;
    mimetype?: string;
  };
  videoMessage?: { 
    url?: string;
    caption?: string;
    mimetype?: string;
  };
  audioMessage?: {
    url?: string;
    mimetype?: string;
    seconds?: number;
  };
  documentMessage?: { 
    url?: string;
    fileName?: string;
    mimetype?: string;
  };
  stickerMessage?: {
    url?: string;
  };
};

type Message = {
  id: string;
  key: {
    remoteJid: string;
    fromMe: boolean;
    id: string;
  };
  message: MessageContent;
  messageTimestamp: number;
  pushName?: string;
  source: 'whatsapp' | 'instagram';
  mediaBase64?: string;
  mediaMimetype?: string;
};

type Chat = {
  id: string;
  remoteJid: string;
  name?: string;
  pushName?: string;
  profilePicUrl?: string;
  lastMessage?: string;
  lastMessageTime?: number;
  unreadCount?: number;
};

type Instance = {
  name: string;
  connectionStatus: string;
};

const API_BASE = 'http://localhost:3001/api';

// Componente para renderizar mídias nas mensagens
function MediaRenderer({ 
  msg, 
  mediaCache, 
  mediaLoading, 
  onLoadMedia 
}: { 
  msg: Message; 
  mediaCache: Record<string, string>;
  mediaLoading: Record<string, boolean>;
  onLoadMedia: () => void;
}) {
  const cacheKey = msg.key.id;
  const isLoading = mediaLoading[cacheKey];
  const cachedMedia = mediaCache[cacheKey];
  
  // Se já tem mídia local (enviada pelo usuário)
  const displayMedia = msg.mediaBase64 || cachedMedia;
  const mimetype = msg.mediaMimetype || msg.message.imageMessage?.mimetype || 
                   msg.message.audioMessage?.mimetype || msg.message.documentMessage?.mimetype ||
                   msg.message.videoMessage?.mimetype || '';

  useEffect(() => {
    if (!displayMedia && !isLoading) {
      onLoadMedia();
    }
  }, [displayMedia, isLoading]);

  // Imagem
  if (msg.message.imageMessage || msg.message.stickerMessage) {
    if (!displayMedia) {
      return (
        <div className="w-64 h-48 bg-gray-200 animate-pulse flex items-center justify-center">
          <Image className="h-8 w-8 text-gray-400" />
        </div>
      );
    }
    return (
      <img 
        src={`data:${mimetype || 'image/jpeg'};base64,${displayMedia}`}
        alt="Imagem"
        className="max-w-64 max-h-64 object-contain cursor-pointer hover:opacity-90"
        onClick={() => window.open(`data:${mimetype || 'image/jpeg'};base64,${displayMedia}`, '_blank')}
      />
    );
  }

  // Vídeo
  if (msg.message.videoMessage) {
    if (!displayMedia) {
      return (
        <div className="w-64 h-48 bg-gray-200 animate-pulse flex items-center justify-center">
          <span className="text-gray-500">🎥 Carregando vídeo...</span>
        </div>
      );
    }
    return (
      <video 
        src={`data:${mimetype || 'video/mp4'};base64,${displayMedia}`}
        controls
        className="max-w-64 max-h-64"
      />
    );
  }

  // Áudio
  if (msg.message.audioMessage) {
    const seconds = msg.message.audioMessage.seconds || 0;
    const duration = `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
    
    if (!displayMedia) {
      return (
        <div className="flex items-center gap-3 px-4 py-3 min-w-[200px]">
          <div className="w-10 h-10 rounded-full bg-gray-300 animate-pulse flex items-center justify-center">
            <Mic className="h-5 w-5 text-gray-500" />
          </div>
          <div className="flex-1">
            <div className="h-2 bg-gray-300 rounded animate-pulse"></div>
            <span className="text-xs opacity-70 mt-1">{duration}</span>
          </div>
        </div>
      );
    }
    return (
      <div className="px-4 py-3 min-w-[250px]">
        <audio 
          src={`data:${mimetype || 'audio/ogg'};base64,${displayMedia}`}
          controls
          className="w-full h-10"
        />
        {seconds > 0 && <span className="text-xs opacity-70">{duration}</span>}
      </div>
    );
  }

  // Documento
  if (msg.message.documentMessage) {
    const fileName = msg.message.documentMessage.fileName || 'Documento';
    
    return (
      <div className="flex items-center gap-3 px-4 py-3 min-w-[200px]">
        <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
          <FileText className="h-5 w-5 text-orange-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{fileName}</p>
          <p className="text-xs opacity-70">{mimetype || 'Documento'}</p>
        </div>
        {displayMedia && (
          <a 
            href={`data:${mimetype || 'application/octet-stream'};base64,${displayMedia}`}
            download={fileName}
            className="p-2 hover:bg-black/10 rounded-lg transition-colors"
          >
            <Download className="h-4 w-4" />
          </a>
        )}
      </div>
    );
  }

  return null;
}

export function ConversationsPage() {
  const [instances, setInstances] = useState<Instance[]>([]);
  const [selectedInstance, setSelectedInstance] = useState<string | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [mediaLoading, setMediaLoading] = useState<Record<string, boolean>>({});
  const [mediaCache, setMediaCache] = useState<Record<string, string>>({});
  const [connectionDate, setConnectionDate] = useState<Date | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  // Buscar data de conexão do banco de dados
  useEffect(() => {
    async function fetchConnectionDate() {
      try {
        const instanceData = await whatsappDbService.getInstance();
        if (instanceData.connected_at) {
          setConnectionDate(new Date(instanceData.connected_at));
          console.log('[ConversationsPage] Data de conexão:', instanceData.connected_at);
        }
      } catch (error) {
        console.error('[ConversationsPage] Erro ao buscar data de conexão:', error);
      }
    }
    fetchConnectionDate();
  }, []);

  // Buscar instâncias conectadas
  useEffect(() => {
    fetchInstances();
  }, []);

  // Buscar chats quando instância é selecionada ou data de conexão muda
  useEffect(() => {
    if (selectedInstance) {
      fetchChats();
    }
  }, [selectedInstance, connectionDate]);

  // Buscar mensagens quando chat é selecionado
  useEffect(() => {
    if (selectedChat && selectedInstance) {
      setCurrentPage(1);
      setMessages([]);
      setHasMoreMessages(true);
      fetchMessages(1);
    }
  }, [selectedChat]);

  // Scroll para última mensagem
  useEffect(() => {
    if (currentPage === 1) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  async function fetchInstances() {
    try {
      const response = await fetch(`${API_BASE}/instance/fetchInstances`);
      const data = await response.json();
      
      if (Array.isArray(data)) {
        const connectedInstances = data.filter(
          (inst: any) => inst.connectionStatus === 'open'
        );
        setInstances(connectedInstances);
        
        if (connectedInstances.length > 0 && !selectedInstance) {
          setSelectedInstance(connectedInstances[0].name);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar instâncias:', error);
    }
  }

  async function fetchChats() {
    if (!selectedInstance) return;
    
    setIsLoadingChats(true);
    try {
      const response = await fetch(`${API_BASE}/chat/findChats/${selectedInstance}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      
      const data = await response.json();
      
      if (Array.isArray(data)) {
        // Timestamp da data de conexão (em segundos)
        const connectionTimestamp = connectionDate ? connectionDate.getTime() / 1000 : 0;
        console.log('[ConversationsPage] Filtrando chats após:', connectionDate, 'timestamp:', connectionTimestamp);
        
        const formattedChats: Chat[] = data
          .filter((chat: any) => {
            // Filtrar grupos
            if (!chat.id || chat.id.includes('@g.us')) return false;
            
            // Se não tiver data de conexão, mostrar todos
            if (!connectionTimestamp) return true;
            
            // Filtrar apenas chats com mensagens após a data de conexão
            const lastMsgTime = chat.lastMessage?.messageTimestamp || 0;
            const isAfterConnection = lastMsgTime >= connectionTimestamp;
            
            if (!isAfterConnection) {
              console.log('[ConversationsPage] Chat ignorado (antes da conexão):', chat.name || chat.id, 'lastMsg:', lastMsgTime);
            }
            
            return isAfterConnection;
          })
          .map((chat: any) => ({
            id: chat.id,
            remoteJid: chat.id,
            name: chat.name || chat.pushName || formatPhoneNumber(chat.id),
            pushName: chat.pushName,
            lastMessage: chat.lastMessage?.message?.conversation || 
                        chat.lastMessage?.message?.extendedTextMessage?.text || '',
            lastMessageTime: chat.lastMessage?.messageTimestamp,
            unreadCount: chat.unreadCount || 0
          }))
          .sort((a: Chat, b: Chat) => (b.lastMessageTime || 0) - (a.lastMessageTime || 0));
        
        console.log('[ConversationsPage] Chats filtrados:', formattedChats.length, 'de', data.length);
        setChats(formattedChats);
      }
    } catch (error) {
      console.error('Erro ao buscar chats:', error);
    } finally {
      setIsLoadingChats(false);
    }
  }

  async function fetchMessages(page: number) {
    if (!selectedInstance || !selectedChat) return;
    
    setIsLoadingMessages(true);
    try {
      const response = await fetch(`${API_BASE}/chat/findMessages/${selectedInstance}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          remoteJid: selectedChat.remoteJid,
          limit: 20,
          page: page
        })
      });
      
      const data = await response.json();
      
      if (data.messages && Array.isArray(data.messages.records)) {
        const newMessages: Message[] = data.messages.records.map((msg: any) => ({
          id: msg.key?.id || msg.id || Math.random().toString(),
          key: msg.key || { remoteJid: selectedChat.remoteJid, fromMe: false, id: msg.id },
          message: msg.message || {},
          messageTimestamp: msg.messageTimestamp || Date.now() / 1000,
          pushName: msg.pushName,
          source: 'whatsapp' as const
        }));
        
        if (page === 1) {
          setMessages(newMessages.reverse());
        } else {
          setMessages(prev => [...newMessages.reverse(), ...prev]);
        }
        
        setHasMoreMessages(newMessages.length === 20);
        setCurrentPage(page);
      } else if (Array.isArray(data)) {
        const newMessages: Message[] = data.map((msg: any) => ({
          id: msg.key?.id || msg.id || Math.random().toString(),
          key: msg.key || { remoteJid: selectedChat.remoteJid, fromMe: false, id: msg.id },
          message: msg.message || {},
          messageTimestamp: msg.messageTimestamp || Date.now() / 1000,
          pushName: msg.pushName,
          source: 'whatsapp' as const
        }));
        
        if (page === 1) {
          setMessages(newMessages.reverse());
        } else {
          setMessages(prev => [...newMessages.reverse(), ...prev]);
        }
        
        setHasMoreMessages(newMessages.length === 20);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  }

  async function sendMessage() {
    if (!selectedInstance || !selectedChat || !newMessage.trim()) return;
    
    setIsSending(true);
    try {
      const phoneNumber = selectedChat.remoteJid.replace('@s.whatsapp.net', '');
      
      const response = await fetch(`${API_BASE}/message/sendText/${selectedInstance}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          number: phoneNumber,
          text: newMessage
        })
      });
      
      if (response.ok) {
        // Adicionar mensagem enviada localmente
        const sentMessage: Message = {
          id: Date.now().toString(),
          key: {
            remoteJid: selectedChat.remoteJid,
            fromMe: true,
            id: Date.now().toString()
          },
          message: { conversation: newMessage },
          messageTimestamp: Date.now() / 1000,
          source: 'whatsapp'
        };
        
        setMessages(prev => [...prev, sentMessage]);
        setNewMessage('');
        
        // Scroll para a nova mensagem
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    } finally {
      setIsSending(false);
    }
  }

  function loadMoreMessages() {
    if (!isLoadingMessages && hasMoreMessages) {
      fetchMessages(currentPage + 1);
    }
  }

  function formatPhoneNumber(jid: string): string {
    const number = jid.replace('@s.whatsapp.net', '').replace('@c.us', '');
    if (number.startsWith('55') && number.length >= 12) {
      const ddd = number.slice(2, 4);
      const rest = number.slice(4);
      if (rest.length === 9) {
        return `(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5)}`;
      }
      return `(${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`;
    }
    return number;
  }

  function formatTime(timestamp: number): string {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  function formatDate(timestamp: number): string {
    const date = new Date(timestamp * 1000);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Hoje';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ontem';
    }
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  function getMessageText(message: MessageContent): string {
    if (message.conversation) return message.conversation;
    if (message.extendedTextMessage?.text) return message.extendedTextMessage.text;
    return '';
  }

  function hasMedia(message: MessageContent): boolean {
    return !!(message.imageMessage || message.videoMessage || message.audioMessage || message.documentMessage || message.stickerMessage);
  }

  async function fetchMediaBase64(msg: Message): Promise<string | null> {
    if (!selectedInstance) return null;
    const cacheKey = msg.key.id;
    
    if (mediaCache[cacheKey]) {
      return mediaCache[cacheKey];
    }

    setMediaLoading(prev => ({ ...prev, [cacheKey]: true }));
    
    try {
      const response = await fetch(`${API_BASE}/chat/getBase64/${selectedInstance}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg.key })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.base64) {
          const base64Data = data.base64;
          setMediaCache(prev => ({ ...prev, [cacheKey]: base64Data }));
          return base64Data;
        }
      }
    } catch (error) {
      console.error('Erro ao buscar mídia:', error);
    } finally {
      setMediaLoading(prev => ({ ...prev, [cacheKey]: false }));
    }
    return null;
  }

  async function sendMedia(file: File, type: 'image' | 'audio' | 'document') {
    if (!selectedInstance || !selectedChat) return;
    
    setIsSending(true);
    try {
      const phoneNumber = selectedChat.remoteJid.replace('@s.whatsapp.net', '');
      const base64 = await fileToBase64(file);
      
      if (type === 'audio') {
        await fetch(`${API_BASE}/message/sendAudio/${selectedInstance}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            number: phoneNumber,
            audio: base64
          })
        });
      } else {
        await fetch(`${API_BASE}/message/sendMedia/${selectedInstance}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            number: phoneNumber,
            mediatype: type,
            mimetype: file.type,
            media: base64,
            fileName: file.name,
            caption: ''
          })
        });
      }
      
      // Adicionar mensagem enviada localmente
      const sentMessage: Message = {
        id: Date.now().toString(),
        key: {
          remoteJid: selectedChat.remoteJid,
          fromMe: true,
          id: Date.now().toString()
        },
        message: type === 'image' 
          ? { imageMessage: { caption: file.name } }
          : type === 'audio'
          ? { audioMessage: { seconds: 0 } }
          : { documentMessage: { fileName: file.name } },
        messageTimestamp: Date.now() / 1000,
        source: 'whatsapp',
        mediaBase64: base64,
        mediaMimetype: file.type
      };
      
      setMessages(prev => [...prev, sentMessage]);
      setShowAttachMenu(false);
      
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error) {
      console.error('Erro ao enviar mídia:', error);
    } finally {
      setIsSending(false);
    }
  }

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remover o prefixo data:type;base64,
        const base64 = result.split(',')[1] || result;
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'audio' | 'document') {
    const file = e.target.files?.[0];
    if (file) {
      sendMedia(file, type);
    }
    e.target.value = '';
  }

  const filteredChats = chats.filter(chat => 
    chat.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chat.remoteJid.includes(searchTerm)
  );

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Conversas</h1>
          <p className="text-sm text-gray-500">Gerencie suas conversas do WhatsApp em tempo real.</p>
        </div>
        
        {/* Seletor de Instância */}
        <div className="flex items-center gap-3">
          <select
            value={selectedInstance || ''}
            onChange={(e) => setSelectedInstance(e.target.value)}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="" disabled>Selecione uma instância</option>
            {instances.map((inst) => (
              <option key={inst.name} value={inst.name}>
                {inst.name} ({inst.connectionStatus})
              </option>
            ))}
          </select>
          
          <button
            onClick={() => { fetchInstances(); fetchChats(); }}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            title="Atualizar"
          >
            <RefreshCw className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Chat Layout */}
      <div className="flex flex-1 rounded-xl border border-gray-200/50 bg-white/80 backdrop-blur-xl shadow-xl overflow-hidden">
        {/* Lista de Conversas */}
        <div className="w-80 border-r border-gray-200/50 flex flex-col">
          {/* Busca */}
          <div className="p-4 border-b border-gray-200/50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar conversa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Lista de Chats */}
          <div className="flex-1 overflow-y-auto">
            {isLoadingChats ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredChats.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                <MessageSquare className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">Nenhuma conversa encontrada</p>
              </div>
            ) : (
              filteredChats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => setSelectedChat(chat)}
                  className={`w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                    selectedChat?.id === chat.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold shadow-lg">
                    {chat.name?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-gray-900 truncate">{chat.name}</p>
                      {chat.lastMessageTime && (
                        <span className="text-xs text-gray-500">
                          {formatTime(chat.lastMessageTime)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                        WhatsApp
                      </span>
                      <p className="text-sm text-gray-500 truncate flex-1">{chat.lastMessage}</p>
                    </div>
                  </div>
                  {chat.unreadCount && chat.unreadCount > 0 && (
                    <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      {chat.unreadCount}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Área de Mensagens */}
        <div className="flex-1 flex flex-col">
          {selectedChat ? (
            <>
              {/* Header do Chat */}
              <div className="flex items-center gap-4 p-4 border-b border-gray-200/50 bg-white/50">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold shadow">
                  {selectedChat.name?.charAt(0).toUpperCase() || '?'}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900">{selectedChat.name}</h3>
                  <div className="flex items-center gap-2">
                    <Phone className="h-3 w-3 text-gray-400" />
                    <span className="text-xs text-gray-500">
                      {formatPhoneNumber(selectedChat.remoteJid)}
                    </span>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                      WhatsApp
                    </span>
                  </div>
                </div>
              </div>

              {/* Mensagens */}
              <div 
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-white"
              >
                {/* Botão Carregar Mais */}
                {hasMoreMessages && (
                  <div className="flex justify-center">
                    <button
                      onClick={loadMoreMessages}
                      disabled={isLoadingMessages}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
                    >
                      {isLoadingMessages ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          Carregando...
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4 rotate-180" />
                          Mostrar mais mensagens
                        </>
                      )}
                    </button>
                  </div>
                )}

                {isLoadingMessages && currentPage === 1 ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                    <MessageSquare className="h-8 w-8 mb-2 opacity-50" />
                    <p className="text-sm">Nenhuma mensagem</p>
                  </div>
                ) : (
                  <>
                    {messages.map((msg, index) => {
                      const showDateSeparator = index === 0 || 
                        formatDate(messages[index - 1].messageTimestamp) !== formatDate(msg.messageTimestamp);
                      
                      return (
                        <div key={msg.id}>
                          {showDateSeparator && (
                            <div className="flex items-center justify-center my-4">
                              <span className="px-3 py-1 text-xs font-medium text-gray-500 bg-gray-100 rounded-full">
                                {formatDate(msg.messageTimestamp)}
                              </span>
                            </div>
                          )}
                          
                          <div className={`flex ${msg.key.fromMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[70%] ${msg.key.fromMe ? 'order-2' : ''}`}>
                              {/* Tag de remetente */}
                              <div className={`flex items-center gap-2 mb-1 ${msg.key.fromMe ? 'justify-end' : ''}`}>
                                <span className={`text-xs font-medium ${
                                  msg.key.fromMe ? 'text-blue-600' : 'text-gray-600'
                                }`}>
                                  {msg.key.fromMe ? 'Você' : (msg.pushName || selectedChat.name)}
                                </span>
                                <span className={`inline-flex items-center px-1 py-0.5 rounded text-[10px] font-medium ${
                                  msg.source === 'whatsapp' 
                                    ? 'bg-green-100 text-green-700' 
                                    : 'bg-purple-100 text-purple-700'
                                }`}>
                                  {msg.source === 'whatsapp' ? 'WA' : 'IG'}
                                </span>
                              </div>
                              
                              <div className={`rounded-2xl shadow-sm overflow-hidden ${
                                msg.key.fromMe 
                                  ? 'bg-blue-600 text-white rounded-br-md' 
                                  : 'bg-white text-gray-900 rounded-bl-md border border-gray-100'
                              }`}>
                                {/* Renderizar mídia se houver */}
                                {hasMedia(msg.message) && (
                                  <MediaRenderer 
                                    msg={msg} 
                                    mediaCache={mediaCache}
                                    mediaLoading={mediaLoading}
                                    onLoadMedia={() => fetchMediaBase64(msg)}
                                  />
                                )}
                                
                                {/* Texto da mensagem */}
                                {getMessageText(msg.message) && (
                                  <p className="text-sm whitespace-pre-wrap break-words px-4 py-2">
                                    {getMessageText(msg.message)}
                                  </p>
                                )}
                                
                                {/* Legenda de imagem/vídeo */}
                                {(msg.message.imageMessage?.caption || msg.message.videoMessage?.caption) && (
                                  <p className="text-sm whitespace-pre-wrap break-words px-4 py-2">
                                    {msg.message.imageMessage?.caption || msg.message.videoMessage?.caption}
                                  </p>
                                )}
                                
                                {/* Se não tem texto nem mídia, mostrar tipo */}
                                {!getMessageText(msg.message) && !hasMedia(msg.message) && (
                                  <p className="text-sm px-4 py-2 opacity-70">[Mensagem não suportada]</p>
                                )}
                                
                                <p className={`text-[10px] px-4 pb-2 ${
                                  msg.key.fromMe ? 'text-blue-200' : 'text-gray-400'
                                }`}>
                                  {formatTime(msg.messageTimestamp)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input de Mensagem */}
              <div className="p-4 border-t border-gray-200/50 bg-white/50">
                {/* Inputs de arquivo ocultos */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e, 'image')}
                />
                <input
                  ref={audioInputRef}
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e, 'audio')}
                />
                <input
                  ref={docInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e, 'document')}
                />

                <div className="flex items-center gap-2">
                  {/* Botão de Anexo */}
                  <div className="relative">
                    <button
                      onClick={() => setShowAttachMenu(!showAttachMenu)}
                      className="p-3 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
                      title="Anexar arquivo"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                    </button>

                    {/* Menu de Anexos */}
                    {showAttachMenu && (
                      <div className="absolute bottom-full left-0 mb-2 bg-white rounded-xl shadow-xl border border-gray-200 py-2 min-w-[160px] z-10">
                        <button
                          onClick={() => { fileInputRef.current?.click(); setShowAttachMenu(false); }}
                          className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-sm text-gray-700"
                        >
                          <Image className="h-4 w-4 text-blue-500" />
                          Imagem
                        </button>
                        <button
                          onClick={() => { audioInputRef.current?.click(); setShowAttachMenu(false); }}
                          className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-sm text-gray-700"
                        >
                          <Mic className="h-4 w-4 text-green-500" />
                          Áudio
                        </button>
                        <button
                          onClick={() => { docInputRef.current?.click(); setShowAttachMenu(false); }}
                          className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-sm text-gray-700"
                        >
                          <FileText className="h-4 w-4 text-orange-500" />
                          Documento
                        </button>
                      </div>
                    )}
                  </div>

                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    placeholder="Digite sua mensagem..."
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || isSending}
                    className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30"
                  >
                    {isSending ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
              <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <MessageSquare className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-1">Selecione uma conversa</h3>
              <p className="text-sm text-gray-500">Escolha uma conversa à esquerda para começar</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
