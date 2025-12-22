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

export type InfoCerimonia = {
  lugares: string;
  horarios: string;
  documentacao: string;
  prazo_entrega: string;
  valores: string;
};

// Tipo para períodos bloqueados
export type BlockedDatePeriod = {
  start: string;
  end: string;
  reason?: string;
};

// Tipo para itens de imagem (usado em várias entidades)
export type ImagemItem = {
  url: string;
  descricao?: string;
};

export type AIConfig = {
  id: string;
  church_id: string;
  agent_name: string;
  agent_prompt?: string; // Mantido para compatibilidade, mas não será mais usado
  informacoes_adicionais?: string;
  perguntas_frequentes?: string;
  principais_eventos?: string;
  menu_principal?: string; // TEXT no banco de dados (conteúdo do menu)
  localizacao_igreja?: string;
  informacao_historica?: string;
  documentacao_necessaria?: string;
  tone_of_voice: 'amigavel' | 'formal' | 'profissional';
  text_size: 'curto' | 'medio' | 'longo';
  use_emojis: boolean;
  send_documents: boolean;
  auto_scheduling: boolean;
  
  // Campos de serviços
  google_maps_link?: string;
  espacos_disponiveis?: string;
  info_casamento?: InfoCerimonia;
  exige_sinal: boolean;
  regras_sinal?: string;
  info_batizados?: InfoCerimonia;
  cursos?: string;
  sessao_fotos?: string;
  regras_hospedagem?: string;
  link_visitacao?: string;
  guia_turistico?: string;
  projetos_sociais_empresas?: string;
  projetos_sociais_comunidade?: string;
  regras_especificas?: string;
  hospedagem_disponivel: boolean;
  
  // Identidade do Agente
  agent_gender: 'feminino' | 'masculino' | 'neutro';
  greeting_message?: string;
  error_message?: string;
  
  // Contatos da Igreja
  phone_landline?: string;
  phone_whatsapp?: string;
  email_main?: string;
  email_secretary?: string;
  email_documents?: string;
  contact_general?: string;
  
  // Regras de Agendamento
  allow_scheduling_lent: boolean;
  allow_scheduling_jubilee: boolean;
  blocked_dates: BlockedDatePeriod[];
  max_simultaneous_events: number;
  
  // Mensagens Personalizadas
  donation_text?: string;
  prayer_text?: string;
  confirmation_text?: string;
  unavailability_text?: string;
  post_scheduling_text?: string;
  
  // Imagens (armazenadas no Supabase Storage)
  imagens_batismos?: ImagemItem[];
  imagens_casamentos?: ImagemItem[];
  imagens_espacos?: ImagemItem[];
  imagens_igreja?: ImagemItem[];
  
  qualification_fields: {
    nome: boolean;
    telefone: boolean;
    email: boolean;
    interesse: boolean;
    motivacao: boolean;
    expectativa: boolean;
    tipo_evento: boolean;
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

// ============================================
// SERVIÇOS ESTRUTURADOS
// ============================================

export type ServiceEtapa = {
  ordem: number;
  titulo: string;
  descricao?: string;
  duracao_dias?: number;
};

export type ServiceDocumento = {
  nome: string;
  obrigatorio: boolean;
  descricao?: string;
};

export type ServiceHorario = {
  inicio: string;
  fim: string;
};

export type ChurchService = {
  id: string;
  church_id: string;
  
  // Identificação
  nome: string;
  slug: string;
  tipo: 'cerimonia' | 'sacramento' | 'evento' | 'servico' | 'outro';
  ativo: boolean;
  ordem: number;
  
  // Descrição
  descricao_curta?: string;
  descricao_completa?: string;
  icone?: string;
  
  // Processo
  etapas: ServiceEtapa[];
  
  // Disponibilidade
  dias_permitidos: string[];
  horarios_permitidos: ServiceHorario[];
  
  // Documentos
  documentos_exigidos: ServiceDocumento[];
  
  // Valores
  valor?: number;
  valor_variavel: boolean;
  valor_minimo?: number;
  valor_maximo?: number;
  forma_pagamento: string[];
  exige_sinal: boolean;
  valor_sinal?: number;
  percentual_sinal?: number;
  prazo_pagamento_sinal?: number;
  
  // Regras
  regras?: string;
  restricoes?: string;
  prazo_minimo_agendamento: number;
  prazo_maximo_agendamento: number;
  duracao_media_minutos?: number;
  capacidade_maxima?: number;
  
  // Automação IA
  usa_agendamento: boolean;
  usa_tool_verificar_agendamento: boolean;
  usa_tool_realizar_agendamento: boolean;
  precisa_confirmacao_humana: boolean;
  
  // Mensagens
  mensagem_confirmacao?: string;
  mensagem_indisponibilidade?: string;
  mensagem_pos_agendamento?: string;
  
  created_at: string;
  updated_at: string;
};

// ============================================
// HOSPEDAGEM
// ============================================

export type HostingConfig = {
  id: string;
  church_id: string;
  
  // Status
  hospedagem_ativa: boolean;
  
  // Descrição
  descricao?: string;
  publico_permitido: string[];
  
  // Restrições
  idade_minima: number;
  permite_criancas: boolean;
  permite_animais: boolean;
  acessibilidade?: string;
  
  // Funcionamento
  dias_funcionamento: string[];
  horario_checkin: string;
  horario_checkout: string;
  estadia_minima: number;
  estadia_maxima: number;
  permite_estender_estadia: boolean;
  
  // Bloqueios
  datas_bloqueadas: BlockedDatePeriod[];
  bloqueio_por_evento: boolean;
  
  // Valores
  valor_por_noite?: number;
  valor_por_pessoa: boolean;
  taxa_limpeza?: number;
  exige_sinal: boolean;
  valor_sinal?: number;
  percentual_sinal?: number;
  prazo_pagamento_sinal?: number;
  politica_cancelamento?: string;
  formas_pagamento: string[];
  
  // Dados do Hóspede
  dados_obrigatorios: string[];
  exige_documento: boolean;
  tipos_documento: string[];
  ficha_hospede_link?: string;
  envio_documentos_por: string[];
  
  // Automação IA
  ia_nivel_automacao: 'informar' | 'coletar_dados' | 'pre_reservar' | 'confirmar_reserva';
  usa_agendamento_ia: boolean;
  precisa_confirmacao_humana: boolean;
  
  // Mensagens
  mensagem_confirmacao_reserva?: string;
  mensagem_indisponibilidade?: string;
  
  // Textos Institucionais
  regras_hospedagem?: string;
  termos_responsabilidade?: string;
  orientacoes_hospede?: string;
  politica_silencio?: string;
  informacoes_gerais?: string;
  
  created_at: string;
  updated_at: string;
};

export type AccommodationType = 'individual' | 'duplo' | 'triplo' | 'quadruplo' | 'coletivo' | 'dormitorio' | 'suite' | 'apartamento';

export type AccommodationPhoto = {
  url: string;
  descricao?: string;
};

export type ChurchAccommodation = {
  id: string;
  church_id: string;
  
  // Identificação
  nome: string;
  codigo?: string;
  tipo: AccommodationType;
  
  // Capacidade
  capacidade_maxima: number;
  quantidade_disponivel: number;
  
  // Descrição
  descricao?: string;
  
  // Comodidades
  possui_banheiro: boolean;
  possui_banheiro_privativo: boolean;
  possui_roupa_cama: boolean;
  possui_toalhas: boolean;
  possui_ar_condicionado: boolean;
  possui_ventilador: boolean;
  possui_tv: boolean;
  possui_wifi: boolean;
  possui_frigobar: boolean;
  comodidades_extras: string[];
  
  // Valores
  valor_noite_override?: number;
  
  // Fotos
  fotos: AccommodationPhoto[];
  
  // Status
  ativo: boolean;
  em_manutencao: boolean;
  
  created_at: string;
  updated_at: string;
};

export type ReservationStatus = 'pendente' | 'confirmada' | 'checkin_realizado' | 'checkout_realizado' | 'cancelada' | 'no_show';
export type PaymentStatus = 'pendente' | 'sinal_pago' | 'pago_total' | 'reembolsado';

export type ReservationCompanion = {
  nome: string;
  cpf?: string;
  parentesco?: string;
};

export type HostingReservation = {
  id: string;
  church_id: string;
  accommodation_id?: string;
  client_id?: string;
  
  // Datas
  data_checkin: string;
  data_checkout: string;
  
  // Hóspede Principal
  hospede_nome: string;
  hospede_cpf?: string;
  hospede_rg?: string;
  hospede_telefone?: string;
  hospede_email?: string;
  hospede_endereco?: string;
  hospede_data_nascimento?: string;
  
  // Acompanhantes
  quantidade_hospedes: number;
  acompanhantes: ReservationCompanion[];
  
  // Valores
  valor_total?: number;
  valor_sinal_pago?: number;
  valor_restante?: number;
  
  // Status
  status: ReservationStatus;
  pagamento_status: PaymentStatus;
  forma_pagamento?: string;
  
  // Observações
  observacoes?: string;
  motivo_visita?: string;
  
  // Origem
  origem: 'manual' | 'whatsapp' | 'site' | 'telefone';
  atendido_por?: string;
  
  created_at: string;
  updated_at: string;
};

export type AppointmentStatus = 'solicitado' | 'aguardando_documentos' | 'confirmado' | 'realizado' | 'cancelado';

export type DocumentoEntregue = {
  nome: string;
  entregue: boolean;
  data?: string;
};

export type ServiceAppointment = {
  id: string;
  church_id: string;
  service_id: string;
  client_id?: string;
  
  // Data e Hora
  data_agendamento: string;
  hora_inicio?: string;
  hora_fim?: string;
  
  // Solicitante
  solicitante_nome: string;
  solicitante_telefone?: string;
  solicitante_email?: string;
  solicitante_cpf?: string;
  
  // Detalhes específicos do serviço
  detalhes: Record<string, any>;
  
  // Documentos
  documentos_entregues: DocumentoEntregue[];
  documentos_pendentes: string[];
  
  // Valores
  valor_total?: number;
  valor_sinal_pago?: number;
  valor_restante?: number;
  
  // Status
  status: AppointmentStatus;
  pagamento_status: PaymentStatus;
  forma_pagamento?: string;
  
  // Observações
  observacoes?: string;
  
  // Origem
  origem: 'manual' | 'whatsapp' | 'site' | 'telefone';
  atendido_por?: string;
  
  created_at: string;
  updated_at: string;
};
