// Tipos do banco de dados Supabase

export type Church = {
  id: string;
  owner_id: string; // Referência direta ao auth.users
  name: string;
  slug: string;
  cnpj?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  logo_url?: string;
  website?: string;
  description?: string;
  instagram?: string;
  facebook?: string;
  timezone: string;
  language: string;
  plan: 'free' | 'starter' | 'pro' | 'enterprise';
  plan_expires_at?: string;
  instance?: string; // Nome da instância WhatsApp conectada
  created_at: string;
  updated_at: string;
  is_active: boolean;
};

export type DaySchedule = {
  enabled: boolean;
  startTime: string;
  endTime: string;
};

export type AIConfig = {
  id: string;
  church_id: string;
  agent_name: string;
  agent_prompt?: string; // Mantido para compatibilidade, mas não será mais usado
  informacoes_adicionais?: string;
  perguntas_frequentes?: string;
  principais_eventos?: string;
  menu_principal?: string;
  localizacao_igreja?: string;
  informacao_historica?: string;
  documentacao_necessaria?: string;
  tone_of_voice: 'amigavel' | 'formal' | 'profissional';
  text_size: 'curto' | 'medio' | 'longo';
  use_emojis: boolean;
  send_documents: boolean;
  auto_scheduling: boolean;
  qualification_fields: {
    nome: boolean;
    telefone: boolean;
    email: boolean;
    interesse: boolean;
    motivacao: boolean;
    expectativa: boolean;
    tipo_evento: boolean;
    nome_igreja: boolean;
    segmento: boolean;
    volume_mensal: boolean;
  };
  business_hours: {
    monday: DaySchedule;
    tuesday: DaySchedule;
    wednesday: DaySchedule;
    thursday: DaySchedule;
    friday: DaySchedule;
    saturday: DaySchedule;
    sunday: DaySchedule;
  };
  outside_hours_message: string;
  created_at: string;
  updated_at: string;
};

export type CalendarEvent = {
  id: string;
  church_id: string;
  cliente_id?: string; // Foreign key para vincular evento ao cliente
  created_by?: string;
  title: string;
  description?: string;
  location?: string;
  notes?: string;
  start_at: string;
  end_at?: string;
  all_day: boolean;
  is_recurring: boolean;
  recurrence_rule?: string;
  recurrence_end_at?: string;
  parent_event_id?: string;
  color: string;
  event_type: string;
  attendees: Array<{ user_id?: string; name: string; email?: string; status?: string }>;
  reminders: Array<{ type: 'email' | 'push'; minutes_before: number }>;
  created_at: string;
  updated_at: string;
};

export type ClientStatus = 'lead' | 'ativo' | 'inativo';
export type ClientCategory = 'lead' | 'casamentos' | 'batizados' | 'ensaios-fotograficos' | 'hospedagens' | 'turismo';

export type Client = {
  id: string;
  church_id: string;
  name: string;
  email?: string;
  phone?: string;
  whatsapp?: string; // Número do WhatsApp (pode ser diferente do phone)
  remote_jid?: string; // ID remoto do WhatsApp (número@s.whatsapp.net)
  status: ClientStatus;
  category: ClientCategory;
  tags: string[];
  notes?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  interest?: string;
  motivation?: string;
  expectation?: string;
  event_type?: string;
  church_name?: string;
  segment?: string;
  monthly_volume?: string;
  source?: string;
  source_details?: string;
  assigned_to?: string;
  last_contact_at?: string;
  next_followup_at?: string;
  converted_at?: string;
  created_at: string;
  updated_at: string;
};

export type WhatsAppInstance = {
  id: string;
  church_id: string;
  instance_name: string;
  instance_id?: string;
  api_key?: string;
  phone_number?: string;
  profile_name?: string;
  profile_pic_url?: string;
  status: 'disconnected' | 'connecting' | 'open';
  webhook_url?: string;
  webhook_events: string[];
  settings: {
    reject_call: boolean;
    groups_ignore: boolean;
    always_online: boolean;
    read_messages: boolean;
    read_status: boolean;
  };
  connected_at?: string;
  disconnected_at?: string;
  created_at: string;
  updated_at: string;
};

export type Conversation = {
  id: string;
  church_id: string;
  whatsapp_instance_id?: string;
  client_id?: string;
  remote_jid: string;
  contact_name?: string;
  contact_phone?: string;
  contact_pic_url?: string;
  is_group: boolean;
  source: 'whatsapp' | 'instagram';
  status: 'open' | 'pending' | 'resolved' | 'archived';
  assigned_to?: string;
  unread_count: number;
  last_message_text?: string;
  last_message_at?: string;
  last_message_from_me: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
};

export type MessageType = 'text' | 'image' | 'audio' | 'video' | 'document' | 'sticker' | 'location' | 'contact';

export type Message = {
  id: string;
  church_id: string;
  conversation_id: string;
  message_id?: string;
  from_me: boolean;
  sender_jid?: string;
  sender_name?: string;
  message_type: MessageType;
  content?: string;
  caption?: string;
  media_url?: string;
  media_mimetype?: string;
  media_filename?: string;
  media_size?: number;
  media_duration?: number;
  media_base64?: string;
  location_latitude?: number;
  location_longitude?: number;
  location_name?: string;
  location_address?: string;
  contact_vcard?: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  quoted_message_id?: string;
  reactions: Array<{ emoji: string; from_jid: string; timestamp: string }>;
  timestamp: string;
  received_at: string;
  is_deleted: boolean;
};

export type AIPrompt = {
  id: string;
  church_id: string;
  created_by?: string;
  name: string;
  description?: string;
  prompt_text: string;
  category: string;
  variables: Array<{ name: string; description?: string; default_value?: string }>;
  is_active: boolean;
  is_default: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
};

export type ArquivoIA = {
  id: string;
  church_id: string;
  
  // Documento
  nome: string;
  nome_original?: string;
  categoria?: string;
  subcategoria?: string;
  descricao?: string;
  
  // Status e Disponibilidade
  status: 'ativo' | 'inativo' | 'arquivado';
  disponivel_ia: boolean;
  processado_ia: boolean;
  
  // Instruções de Uso
  instrucoes_ia?: string;
  contexto_uso?: string;
  palavras_chave?: string[];
  prioridade: number;
  
  // URL e Armazenamento
  url?: string;
  bucket_name?: string;
  caminho_storage?: string;
  
  // Detalhes Técnicos
  tipo_mime?: string;
  extensao?: string;
  tamanho?: number;
  visibilidade: 'privado' | 'publico';
  versao: number;
  
  // Estatísticas
  visualizacoes: number;
  downloads: number;
  ultima_utilizacao_ia?: string;
  
  // IDs Relacionados
  cliente_id?: string;
  produto_id?: string;
  proposta_id?: string;
  contrato_id?: string;
  arquivo_pai_id?: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  deleted_at?: string;
};
