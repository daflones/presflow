import { useEffect, useState, useRef } from 'react';
import { MessageSquare, Send, ChevronDown, Phone, Search, RefreshCw, Image, Mic, FileText, Download } from 'lucide-react';
import { whatsappDbService } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';

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

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || '/api';

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
  const { canSendWhatsapp } = useAuth();
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
  const jidAliasRef = useRef<Map<string, string>>(new Map());
  const contactNameCacheRef = useRef<Map<string, string>>(new Map());
  const profilePicCacheRef = useRef<Map<string, string>>(new Map());
  const chatRemoteJidsByChatIdRef = useRef<Map<string, string[]>>(new Map());
  const contactsLoadedForInstanceRef = useRef<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  async function getAuthHeaders(): Promise<Record<string, string>> {
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      return token ? { Authorization: `Bearer ${token}` } : {};
    } catch {
      return {};
    }
  }

  function normalizeRemoteJid(input?: string): string {
    const raw = String(input || '').trim();
    if (!raw) return '';
    // Respeitar exatamente o remoteJid retornado pela Evolution (ex.: @s.whatsapp.net, @lid, @g.us)
    // Só fazemos um sanity-check mínimo: precisa ter um domínio (@...)
    if (!raw.includes('@')) return '';
    return raw;
  }

  function extractRemoteJidFromChat(chat: any): string {
    const primary = chat?.remoteJid || chat?.remote_jid;
    if (typeof primary === 'string') {
      const jid = normalizeRemoteJid(primary.trim());
      if (jid) return jid;
    }
    return '';
  }

  function pickCanonicalJid(jids: string[]): string {
    const normalized = jids.map((j) => normalizeRemoteJid(j)).filter(Boolean);
    return normalized[0] || '';
  }

  function extractContactJids(contact: any): string[] {
    const candidates: unknown[] = [
      contact?.id,
      contact?.remoteJid,
      contact?.jid,
      contact?.wid,
      contact?.waId,
      contact?.wa_id,
    ];

    const out = new Set<string>();
    for (const c of candidates) {
      if (typeof c !== 'string') continue;
      const s0 = c.trim();
      if (!s0) continue;

      if (/@(s\.whatsapp\.net|c\.us|g\.us|lid)$/i.test(s0)) {
        const jid = normalizeRemoteJid(s0);
        if (jid) out.add(jid);
        continue;
      }

      if (/^\d{6,}$/.test(s0)) {
        out.add(`${s0}@s.whatsapp.net`);
        out.add(`${s0}@lid`);
      }
    }
    return Array.from(out);
  }

  async function ensureContactsAliases(instanceName: string) {
    if (contactsLoadedForInstanceRef.current === instanceName) return;
    contactsLoadedForInstanceRef.current = instanceName;
    jidAliasRef.current = new Map();
    contactNameCacheRef.current = new Map();

    try {
      const authHeaders = await getAuthHeaders();
      const response = await fetch(`${API_BASE}/chat/findContacts/${instanceName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({})
      });

      const data = await response.json();
      const contacts: any[] = Array.isArray(data) ? data : [];

      for (const c of contacts) {
        const jids = extractContactJids(c);
        if (jids.length < 2) continue;
        const canonical = pickCanonicalJid(jids);
        if (!canonical) continue;
        for (const jid of jids) {
          jidAliasRef.current.set(jid, canonical);
        }
      }

      for (const c of contacts) {
        const name = c?.pushName || c?.notify || c?.name;
        if (!name) continue;
        const jids = extractContactJids(c);
        for (const jid of jids) {
          contactNameCacheRef.current.set(jid, String(name));
          const num = jid.split('@')[0];
          if (num) contactNameCacheRef.current.set(num, String(name));
        }
      }
    } catch (e) {
      // se falhar, seguimos sem alias (vai manter chats separados)
    }
  }

  async function ensureProfilePic(instanceName: string, remoteJid: string) {
    if (!remoteJid) return;
    if (profilePicCacheRef.current.has(remoteJid)) return;
    const number = remoteJid.split('@')[0];
    if (!number) return;

    try {
      const authHeaders = await getAuthHeaders();
      const r = await fetch(`${API_BASE}/chat/fetchProfilePictureUrl/${instanceName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ number })
      });
      const data = await r.json().catch(() => null);
      const url = String(data?.profilePictureUrl || data?.profilePicUrl || '').trim();
      if (!url) return;
      profilePicCacheRef.current.set(remoteJid, url);
      setChats((prev) => prev.map((c) => (c.remoteJid === remoteJid ? { ...c, profilePicUrl: url } : c)));
      setSelectedChat((prev) => (prev?.remoteJid === remoteJid ? { ...prev, profilePicUrl: url } : prev));
    } catch {
      // ignore
    }
  }

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
      const dbInstance = await whatsappDbService.getInstance();
      const allowedInstanceName = dbInstance?.instance_name;

      if (!allowedInstanceName) {
        setInstances([]);
        setSelectedInstance(null);
        setChats([]);
        setSelectedChat(null);
        return;
      }

      const authHeaders = await getAuthHeaders();
      const response = await fetch(`${API_BASE}/instance/fetchInstances`, {
        headers: {
          ...authHeaders,
        },
      });
      const data = await response.json();

      const instanceFromApi = Array.isArray(data)
        ? data.find((inst: any) => inst?.name === allowedInstanceName)
        : null;

      const nextInstances: Instance[] = [
        {
          name: allowedInstanceName,
          connectionStatus: instanceFromApi?.connectionStatus || 'open',
        },
      ];

      setInstances(nextInstances);
      setSelectedInstance(allowedInstanceName);
    } catch (error) {
      console.error('Erro ao buscar instâncias:', error);
    }
  }

  async function fetchChats() {
    if (!selectedInstance) return;
    
    setIsLoadingChats(true);
    try {
      await ensureContactsAliases(selectedInstance);
      const authHeaders = await getAuthHeaders();
      const response = await fetch(`${API_BASE}/chat/findChatsEnriched/${selectedInstance}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ limitPics: 12 })
      });
      
      const data = await response.json();
      
      if (Array.isArray(data)) {
        const grouped = new Map<string, Chat>();
        const chatRemoteJids = new Map<string, Set<string>>();

        for (const chat of data) {
          const rawJid = extractRemoteJidFromChat(chat);
          if (!rawJid) continue;
          if (rawJid.includes('@g.us')) continue;

          const stableChatIdRaw =
            (typeof chat?.chatId === 'string' && chat.chatId.trim()) ||
            (typeof chat?.chat_id === 'string' && chat.chat_id.trim()) ||
            (typeof chat?.conversationId === 'string' && chat.conversationId.trim()) ||
            (typeof chat?.conversation_id === 'string' && chat.conversation_id.trim()) ||
            '';
          const picKey = String(
            chat.profilePictureUrl || chat.profilePicUrl || chat.profile_picture_url || ''
          ).trim();
          const hasPicKey = /^https?:\/\//i.test(picKey);
          const stableKey = (hasPicKey ? `pic:${picKey}` : '') || stableChatIdRaw || rawJid;

          const incoming: Chat = {
            id: stableKey,
            remoteJid: rawJid,
            name:
              chat.contactName ||
              chat.name ||
              chat.pushName ||
              contactNameCacheRef.current.get(rawJid) ||
              contactNameCacheRef.current.get(rawJid.split('@')[0]) ||
              formatPhoneNumber(rawJid),
            pushName: chat.pushName,
            profilePicUrl:
              chat.profilePictureUrl ||
              chat.profilePicUrl ||
              chat.profile_picture_url ||
              profilePicCacheRef.current.get(rawJid),
            lastMessage:
              chat.lastMessage?.message?.conversation ||
              chat.lastMessage?.message?.extendedTextMessage?.text || '',
            lastMessageTime: chat.lastMessage?.messageTimestamp,
            unreadCount: chat.unreadCount || 0,
          } as Chat;

          const existing = grouped.get(stableKey);
          if (!existing) {
            grouped.set(stableKey, incoming);
            chatRemoteJids.set(incoming.id, new Set([rawJid]));
            continue;
          }

          const set = chatRemoteJids.get(existing.id) || new Set<string>();
          set.add(rawJid);
          chatRemoteJids.set(existing.id, set);

          const repTs = existing.lastMessageTime || 0;
          const curTs = incoming.lastMessageTime || 0;
          const preferCurrentForPreview = curTs >= repTs;

          grouped.set(stableKey, {
            ...existing,
            // remoteJid é sempre o PRIMEIRO visto no grupo
            unreadCount: (existing.unreadCount || 0) + (incoming.unreadCount || 0),
            name: existing.name || incoming.name,
            pushName: existing.pushName || incoming.pushName,
            profilePicUrl: existing.profilePicUrl || incoming.profilePicUrl,
            lastMessageTime: Math.max(repTs, curTs) || undefined,
            lastMessage: preferCurrentForPreview ? incoming.lastMessage : existing.lastMessage,
          });
        }

        const ordered = Array.from(grouped.values()).sort((a, b) => (b.lastMessageTime || 0) - (a.lastMessageTime || 0));
        chatRemoteJidsByChatIdRef.current = new Map(
          ordered.map((c) => [c.id, Array.from(chatRemoteJids.get(c.id) || new Set([c.remoteJid]))])
        );
        setChats(ordered);

      }
    } catch (error) {
    } finally {
      setIsLoadingChats(false);
    }
  }

  async function fetchMessages(page: number) {
    if (!selectedInstance || !selectedChat) return;
    
    setIsLoadingMessages(true);
    try {
      const authHeaders = await getAuthHeaders();
      const jids = chatRemoteJidsByChatIdRef.current.get(selectedChat.id) || [selectedChat.remoteJid];

      const responses = await Promise.all(
        jids.map(async (jid) => {
          const response = await fetch(`${API_BASE}/chat/findMessages/${selectedInstance}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...authHeaders },
            body: JSON.stringify({
              where: {
                key: {
                  remoteJid: jid
                }
              },
              limit: 20,
              page: page
            })
          });
          return response.json();
        })
      );

      const allRecords: any[] = [];
      const chunkSizes: number[] = [];

      for (const d of responses) {
        if (d?.messages && Array.isArray(d.messages.records)) {
          allRecords.push(...d.messages.records);
          chunkSizes.push(d.messages.records.length);
        } else if (Array.isArray(d)) {
          allRecords.push(...d);
          chunkSizes.push(d.length);
        } else if (Array.isArray(d?.messages)) {
          allRecords.push(...d.messages);
          chunkSizes.push(d.messages.length);
        } else {
          chunkSizes.push(0);
        }
      }

      const dedup = new Map<string, Message>();
      for (const msg of allRecords) {
        const msgId = msg?.key?.id || msg?.id;
        if (!msgId) continue;
        if (dedup.has(String(msgId))) continue;
        dedup.set(String(msgId), {
          id: String(msgId),
          key: msg.key || { remoteJid: msg?.key?.remoteJid || selectedChat.remoteJid, fromMe: false, id: String(msgId) },
          message: msg.message || {},
          messageTimestamp: msg.messageTimestamp || Date.now() / 1000,
          pushName: msg.pushName,
          source: 'whatsapp' as const
        });
      }

      const mergedMessages = Array.from(dedup.values()).sort((a, b) => (a.messageTimestamp || 0) - (b.messageTimestamp || 0));

      if (page === 1) {
        setMessages(mergedMessages);
      } else {
        setMessages(prev => [...mergedMessages, ...prev]);
      }

      setHasMoreMessages(chunkSizes.some((n) => n === 20));
      setCurrentPage(page);
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  }

  async function sendMessage() {
    if (!canSendWhatsapp) {
      toast.error('Somente visualização');
      return;
    }
    if (!selectedInstance || !selectedChat || !newMessage.trim()) return;
    
    setIsSending(true);
    try {
      const phoneNumber = selectedChat.remoteJid.split('@')[0];
      const authHeaders = await getAuthHeaders();
      
      const response = await fetch(`${API_BASE}/message/sendText/${selectedInstance}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
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
    const number = jid.split('@')[0];
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
      const authHeaders = await getAuthHeaders();
      const response = await fetch(`${API_BASE}/chat/getBase64/${selectedInstance}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
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
    if (!canSendWhatsapp) {
      toast.error('Somente visualização');
      return;
    }
    if (!selectedInstance || !selectedChat) return;
    
    setIsSending(true);
    try {
      const phoneNumber = selectedChat.remoteJid.split('@')[0];
      const base64 = await fileToBase64(file);
      const authHeaders = await getAuthHeaders();
      
      if (type === 'audio') {
        await fetch(`${API_BASE}/message/sendAudio/${selectedInstance}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders },
          body: JSON.stringify({
            number: phoneNumber,
            audio: base64
          })
        });
      } else {
        await fetch(`${API_BASE}/message/sendMedia/${selectedInstance}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders },
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
    if (!canSendWhatsapp) {
      toast.error('Somente visualização');
      return;
    }
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
              {canSendWhatsapp ? (
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
                      placeholder={'Digite sua mensagem...'}
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
              ) : null}
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
