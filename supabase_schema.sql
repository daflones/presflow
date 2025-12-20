-- ============================================
-- PRESTFLOW - SCHEMA PARA IGREJAS (SEM TABELA USERS)
-- Supabase SQL completo com RLS
-- ============================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. TABELA DE IGREJAS (TENANT PRINCIPAL)
-- ============================================
CREATE TABLE IF NOT EXISTS churches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- Referência direta ao Supabase Auth
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  cnpj VARCHAR(18),
  email VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(2),
  zip_code VARCHAR(10),
  logo_url TEXT,
  website VARCHAR(255),
  description TEXT,
  
  -- Configurações gerais
  timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo',
  language VARCHAR(10) DEFAULT 'pt-BR',
  
  -- Plano e assinatura
  plan VARCHAR(50) DEFAULT 'free', -- free, starter, pro, enterprise
  plan_expires_at TIMESTAMPTZ,
  
  -- WhatsApp Instance
  instance VARCHAR(255), -- Nome da instância WhatsApp conectada
  
  -- Metadados
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Índices
CREATE INDEX idx_churches_slug ON churches(slug);
CREATE INDEX idx_churches_owner_id ON churches(owner_id);
CREATE INDEX idx_churches_is_active ON churches(is_active);
CREATE INDEX idx_churches_instance ON churches(instance);

-- ============================================
-- 2. TABELA DE CONFIGURAÇÕES DE IA
-- ============================================
CREATE TABLE IF NOT EXISTS ai_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  
  -- Nome e Tom de Fala
  agent_name VARCHAR(100) DEFAULT 'Iara',
  tone_of_voice VARCHAR(20) DEFAULT 'amigavel', -- amigavel, formal, profissional
  text_size VARCHAR(20) DEFAULT 'curto', -- curto, medio, longo
  use_emojis BOOLEAN DEFAULT false,
  
  -- Configurações de Agendamento
  send_documents BOOLEAN DEFAULT false,
  auto_scheduling BOOLEAN DEFAULT false,
  
  -- Campos de Qualificação (obrigatórios)
  qualification_fields JSONB DEFAULT '{
    "nome": true,
    "telefone": true,
    "email": true,
    "interesse": true,
    "motivacao": true,
    "expectativa": true,
    "tipoEvento": true
  }'::jsonb,
  
  -- Campos Opcionais
  optional_fields JSONB DEFAULT '{
    "nomeIgreja": false,
    "endereco": false,
    "segmento": false,
    "volumeMensal": false
  }'::jsonb,
  
  -- Horários de Funcionamento
  schedule JSONB DEFAULT '{
    "segunda": {"enabled": true, "startTime": "08:00", "endTime": "18:00"},
    "terca": {"enabled": true, "startTime": "08:00", "endTime": "18:00"},
    "quarta": {"enabled": true, "startTime": "08:00", "endTime": "18:00"},
    "quinta": {"enabled": true, "startTime": "08:00", "endTime": "18:00"},
    "sexta": {"enabled": true, "startTime": "08:00", "endTime": "18:00"},
    "sabado": {"enabled": false, "startTime": "08:00", "endTime": "12:00"},
    "domingo": {"enabled": false, "startTime": "08:00", "endTime": "12:00"}
  }'::jsonb,
  
  -- Tempo de Resposta e Mensagem de Ausência
  response_time INTEGER DEFAULT 2, -- segundos
  absence_message TEXT DEFAULT 'No momento estou fora do horário de atendimento. Deixe sua mensagem que retornarei assim que possível.',
  
  -- Informações da Igreja
  about_church TEXT,
  competitive_diff TEXT,
  portfolio TEXT,
  main_clients TEXT,
  best_sellers TEXT,
  
  -- Diretrizes para IA
  ai_guidelines TEXT,
  ai_restrictions TEXT,
  
  -- Estratégias Comerciais
  sales_strategies TEXT,
  common_objections TEXT,
  
  -- Metadados
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(church_id)
);

-- Índices
CREATE INDEX idx_ai_configs_church_id ON ai_configs(church_id);

-- ============================================
-- 3. TABELA DE EVENTOS DO CALENDÁRIO
-- ============================================
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Referência direta ao auth.users
  
  -- Dados do evento
  title VARCHAR(255) NOT NULL,
  description TEXT,
  location VARCHAR(255),
  notes TEXT,
  
  -- Datas
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ,
  all_day BOOLEAN DEFAULT false,
  
  -- Recorrência
  is_recurring BOOLEAN DEFAULT false,
  recurrence_rule TEXT,
  recurrence_end_at TIMESTAMPTZ,
  parent_event_id UUID REFERENCES calendar_events(id) ON DELETE CASCADE,
  
  -- Visual
  color VARCHAR(20) DEFAULT '#3b82f6',
  
  -- Tipo de evento
  event_type VARCHAR(50) DEFAULT 'general',
  
  -- Participantes/Convidados
  attendees JSONB DEFAULT '[]'::jsonb,
  
  -- Notificações
  reminders JSONB DEFAULT '[]'::jsonb,
  
  -- Metadados
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_calendar_events_church_id ON calendar_events(church_id);
CREATE INDEX idx_calendar_events_start_at ON calendar_events(start_at);
CREATE INDEX idx_calendar_events_end_at ON calendar_events(end_at);
CREATE INDEX idx_calendar_events_created_by ON calendar_events(created_by);

-- ============================================
-- 4. TABELA DE CLIENTES (CRM) - SEM LOGIN
-- ============================================
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  
  -- Dados básicos
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  whatsapp VARCHAR(20), -- Número do WhatsApp (pode ser diferente do phone)
  remote_jid VARCHAR(100), -- ID remoto do WhatsApp (número@s.whatsapp.net)
  
  -- Status e Categoria
  status VARCHAR(20) DEFAULT 'lead', -- lead, ativo, inativo
  category VARCHAR(50) DEFAULT 'sem-categoria', -- eventos, casamentos, festas, compromissos, sem-categoria
  
  -- Tags para segmentação
  tags TEXT[] DEFAULT '{}',
  
  -- Informações adicionais
  notes TEXT,
  
  -- Endereço
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(2),
  zip_code VARCHAR(10),
  
  -- Dados de qualificação
  interest VARCHAR(255),
  motivation TEXT,
  expectation TEXT,
  event_type VARCHAR(100),
  church_name VARCHAR(255),
  segment VARCHAR(100),
  monthly_volume VARCHAR(50),
  
  -- Origem do lead
  source VARCHAR(50), -- whatsapp, instagram, site, indicacao, etc
  source_details TEXT,
  
  -- Responsável (referência ao auth.users)
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Datas importantes
  last_contact_at TIMESTAMPTZ,
  next_followup_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,
  
  -- Metadados
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_clients_church_id ON clients(church_id);
CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_clients_category ON clients(category);
CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_clients_phone ON clients(phone);
CREATE INDEX idx_clients_whatsapp ON clients(whatsapp);
CREATE INDEX idx_clients_remote_jid ON clients(remote_jid);
CREATE INDEX idx_clients_assigned_to ON clients(assigned_to);
CREATE INDEX idx_clients_tags ON clients USING GIN(tags);

-- ============================================
-- 5. TABELA DE INSTÂNCIAS WHATSAPP
-- ============================================
CREATE TABLE IF NOT EXISTS whatsapp_instances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  
  -- Dados da instância Evolution API
  instance_name VARCHAR(100) NOT NULL,
  instance_id VARCHAR(255),
  api_key VARCHAR(255),
  
  -- Número conectado
  phone_number VARCHAR(20),
  profile_name VARCHAR(255),
  profile_pic_url TEXT,
  
  -- Status
  status VARCHAR(20) DEFAULT 'disconnected', -- disconnected, connecting, open
  
  -- Webhook
  webhook_url TEXT,
  webhook_events TEXT[] DEFAULT '{}',
  
  -- Configurações
  settings JSONB DEFAULT '{
    "reject_call": false,
    "groups_ignore": true,
    "always_online": false,
    "read_messages": false,
    "read_status": false
  }'::jsonb,
  
  -- Datas
  connected_at TIMESTAMPTZ,
  disconnected_at TIMESTAMPTZ,
  
  -- Metadados
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(church_id, instance_name)
);

-- Índices
CREATE INDEX idx_whatsapp_instances_church_id ON whatsapp_instances(church_id);
CREATE INDEX idx_whatsapp_instances_status ON whatsapp_instances(status);
CREATE INDEX idx_whatsapp_instances_instance_name ON whatsapp_instances(instance_name);

-- ============================================
-- 6. TABELA DE CONVERSAS (CHATS)
-- ============================================
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  whatsapp_instance_id UUID REFERENCES whatsapp_instances(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  
  -- Identificação do contato
  remote_jid VARCHAR(100) NOT NULL,
  contact_name VARCHAR(255),
  contact_phone VARCHAR(20),
  contact_pic_url TEXT,
  is_group BOOLEAN DEFAULT false,
  
  -- Origem
  source VARCHAR(20) DEFAULT 'whatsapp',
  
  -- Status da conversa
  status VARCHAR(20) DEFAULT 'open',
  
  -- Atribuição (referência ao auth.users)
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Contadores
  unread_count INTEGER DEFAULT 0,
  
  -- Última mensagem
  last_message_text TEXT,
  last_message_at TIMESTAMPTZ,
  last_message_from_me BOOLEAN DEFAULT false,
  
  -- Tags
  tags TEXT[] DEFAULT '{}',
  
  -- Metadados
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(church_id, remote_jid, source)
);

-- Índices
CREATE INDEX idx_conversations_church_id ON conversations(church_id);
CREATE INDEX idx_conversations_whatsapp_instance_id ON conversations(whatsapp_instance_id);
CREATE INDEX idx_conversations_client_id ON conversations(client_id);
CREATE INDEX idx_conversations_remote_jid ON conversations(remote_jid);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_conversations_assigned_to ON conversations(assigned_to);
CREATE INDEX idx_conversations_last_message_at ON conversations(last_message_at DESC);
CREATE INDEX idx_conversations_tags ON conversations USING GIN(tags);

-- ============================================
-- 7. TABELA DE MENSAGENS
-- ============================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  
  -- Identificação da mensagem
  message_id VARCHAR(100),
  
  -- Remetente
  from_me BOOLEAN DEFAULT false,
  sender_jid VARCHAR(100),
  sender_name VARCHAR(255),
  
  -- Conteúdo
  message_type VARCHAR(20) DEFAULT 'text',
  content TEXT,
  caption TEXT,
  
  -- Mídia
  media_url TEXT,
  media_mimetype VARCHAR(100),
  media_filename VARCHAR(255),
  media_size INTEGER,
  media_duration INTEGER,
  media_base64 TEXT,
  
  -- Localização
  location_latitude DECIMAL(10, 8),
  location_longitude DECIMAL(11, 8),
  location_name VARCHAR(255),
  location_address TEXT,
  
  -- Contato
  contact_vcard TEXT,
  
  -- Status
  status VARCHAR(20) DEFAULT 'sent',
  
  -- Resposta/Citação
  quoted_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  
  -- Reações
  reactions JSONB DEFAULT '[]'::jsonb,
  
  -- Metadados
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  received_at TIMESTAMPTZ DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT false
);

-- Índices
CREATE INDEX idx_messages_church_id ON messages(church_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_message_id ON messages(message_id);
CREATE INDEX idx_messages_timestamp ON messages(timestamp DESC);
CREATE INDEX idx_messages_message_type ON messages(message_type);
CREATE INDEX idx_messages_from_me ON messages(from_me);

-- ============================================
-- 8. TABELA DE PROMPTS DE IA
-- ============================================
CREATE TABLE IF NOT EXISTS ai_prompts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Dados do prompt
  name VARCHAR(255) NOT NULL,
  description TEXT,
  prompt_text TEXT NOT NULL,
  
  -- Categoria
  category VARCHAR(50) DEFAULT 'general',
  
  -- Variáveis disponíveis
  variables JSONB DEFAULT '[]'::jsonb,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  
  -- Estatísticas
  usage_count INTEGER DEFAULT 0,
  
  -- Metadados
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_ai_prompts_church_id ON ai_prompts(church_id);
CREATE INDEX idx_ai_prompts_category ON ai_prompts(category);
CREATE INDEX idx_ai_prompts_is_active ON ai_prompts(is_active);

-- ============================================
-- 9. TABELA DE ARQUIVOS/DOCUMENTOS
-- ============================================
CREATE TABLE IF NOT EXISTS files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Dados do arquivo
  name VARCHAR(255) NOT NULL,
  original_name VARCHAR(255),
  description TEXT,
  
  -- Tipo e tamanho
  mime_type VARCHAR(100),
  size INTEGER,
  
  -- Armazenamento
  storage_path TEXT NOT NULL,
  public_url TEXT,
  
  -- Categorização
  category VARCHAR(50) DEFAULT 'general',
  tags TEXT[] DEFAULT '{}',
  
  -- Uso pela IA
  is_ai_available BOOLEAN DEFAULT false,
  
  -- Metadados
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_files_church_id ON files(church_id);
CREATE INDEX idx_files_category ON files(category);
CREATE INDEX idx_files_is_ai_available ON files(is_ai_available);
CREATE INDEX idx_files_tags ON files USING GIN(tags);

-- ============================================
-- 10. TABELA DE AVISOS/NOTIFICAÇÕES
-- ============================================
CREATE TABLE IF NOT EXISTS notices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Dados do aviso
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  
  -- Tipo e prioridade
  type VARCHAR(50) DEFAULT 'info',
  priority INTEGER DEFAULT 0,
  
  -- Período de exibição
  start_at TIMESTAMPTZ DEFAULT NOW(),
  end_at TIMESTAMPTZ,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_pinned BOOLEAN DEFAULT false,
  
  -- Metadados
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_notices_church_id ON notices(church_id);
CREATE INDEX idx_notices_is_active ON notices(is_active);
CREATE INDEX idx_notices_start_at ON notices(start_at);
CREATE INDEX idx_notices_end_at ON notices(end_at);

-- ============================================
-- 11. TABELA DE LOGS DE ATIVIDADE
-- ============================================
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Ação
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id UUID,
  
  -- Detalhes
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  
  -- Metadados
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_activity_logs_church_id ON activity_logs(church_id);
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_action ON activity_logs(action);
CREATE INDEX idx_activity_logs_entity_type ON activity_logs(entity_type);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- ============================================
-- FUNÇÕES AUXILIARES
-- ============================================

-- Função para obter church_id do usuário autenticado
CREATE OR REPLACE FUNCTION get_user_church_id()
RETURNS UUID AS $$
  SELECT id FROM churches WHERE owner_id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Função para verificar se usuário é dono da igreja
CREATE OR REPLACE FUNCTION is_church_owner(p_church_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM churches 
    WHERE id = p_church_id 
    AND owner_id = auth.uid()
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para gerar slug
CREATE OR REPLACE FUNCTION generate_slug(input_name TEXT)
RETURNS TEXT AS $$
DECLARE
  result TEXT;
BEGIN
  result := translate(input_name, 'áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ', 'aaaaaeeeeiiiioooooouuuucAAAAAEEEEIIIIOOOOOUUUUC');
  result := regexp_replace(result, '[^a-zA-Z0-9 -]', '', 'g');
  result := regexp_replace(result, ' +', '-', 'g');
  result := lower(result);
  result := regexp_replace(result, '-+', '-', 'g');
  result := trim(both '-' from result);
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS PARA updated_at
-- ============================================
CREATE TRIGGER update_churches_updated_at BEFORE UPDATE ON churches 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_configs_updated_at BEFORE UPDATE ON ai_configs 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_events_updated_at BEFORE UPDATE ON calendar_events 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_instances_updated_at BEFORE UPDATE ON whatsapp_instances 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_prompts_updated_at BEFORE UPDATE ON ai_prompts 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_files_updated_at BEFORE UPDATE ON files 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notices_updated_at BEFORE UPDATE ON notices 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TRIGGER PARA CRIAR IGREJA AUTOMATICAMENTE
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  church_name TEXT;
  base_slug TEXT;
  final_slug TEXT;
  slug_counter INTEGER := 0;
BEGIN
  church_name := NEW.raw_user_meta_data->>'church_name';
  
  IF church_name IS NULL OR church_name = '' THEN
    RETURN NEW;
  END IF;
  
  base_slug := generate_slug(church_name);
  final_slug := base_slug;
  
  WHILE EXISTS (SELECT 1 FROM churches WHERE slug = final_slug) LOOP
    slug_counter := slug_counter + 1;
    final_slug := base_slug || '-' || slug_counter;
  END LOOP;
  
  INSERT INTO churches (owner_id, name, slug, email, plan, is_active)
  VALUES (NEW.id, church_name, final_slug, NEW.email, 'free', true);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

ALTER TABLE churches ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS - CHURCHES
CREATE POLICY "Users can view their own church" ON churches
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Users can update their own church" ON churches
  FOR UPDATE USING (owner_id = auth.uid());

-- POLÍTICAS - AI_CONFIGS
CREATE POLICY "Users can view their church AI config" ON ai_configs
  FOR SELECT USING (is_church_owner(church_id));

CREATE POLICY "Users can manage their church AI config" ON ai_configs
  FOR ALL USING (is_church_owner(church_id));

-- POLÍTICAS - CALENDAR_EVENTS
CREATE POLICY "Users can view their church events" ON calendar_events
  FOR SELECT USING (is_church_owner(church_id));

CREATE POLICY "Users can manage their church events" ON calendar_events
  FOR ALL USING (is_church_owner(church_id));

-- POLÍTICAS - CLIENTS
CREATE POLICY "Users can view their church clients" ON clients
  FOR SELECT USING (is_church_owner(church_id));

CREATE POLICY "Users can manage their church clients" ON clients
  FOR ALL USING (is_church_owner(church_id));

-- POLÍTICAS - WHATSAPP_INSTANCES
CREATE POLICY "Users can view their church WhatsApp instances" ON whatsapp_instances
  FOR SELECT USING (is_church_owner(church_id));

CREATE POLICY "Users can manage their church WhatsApp instances" ON whatsapp_instances
  FOR ALL USING (is_church_owner(church_id));

-- POLÍTICAS - CONVERSATIONS
CREATE POLICY "Users can view their church conversations" ON conversations
  FOR SELECT USING (is_church_owner(church_id));

CREATE POLICY "Users can manage their church conversations" ON conversations
  FOR ALL USING (is_church_owner(church_id));

-- POLÍTICAS - MESSAGES
CREATE POLICY "Users can view their church messages" ON messages
  FOR SELECT USING (is_church_owner(church_id));

CREATE POLICY "Users can create messages" ON messages
  FOR INSERT WITH CHECK (is_church_owner(church_id));

-- POLÍTICAS - AI_PROMPTS
CREATE POLICY "Users can view their church prompts" ON ai_prompts
  FOR SELECT USING (is_church_owner(church_id));

CREATE POLICY "Users can manage their church prompts" ON ai_prompts
  FOR ALL USING (is_church_owner(church_id));

-- POLÍTICAS - FILES
CREATE POLICY "Users can view their church files" ON files
  FOR SELECT USING (is_church_owner(church_id));

CREATE POLICY "Users can manage their church files" ON files
  FOR ALL USING (is_church_owner(church_id));

-- POLÍTICAS - NOTICES
CREATE POLICY "Users can view their church notices" ON notices
  FOR SELECT USING (is_church_owner(church_id));

CREATE POLICY "Users can manage their church notices" ON notices
  FOR ALL USING (is_church_owner(church_id));

-- POLÍTICAS - ACTIVITY_LOGS
CREATE POLICY "Users can view their church activity logs" ON activity_logs
  FOR SELECT USING (is_church_owner(church_id));

CREATE POLICY "Users can create activity logs" ON activity_logs
  FOR INSERT WITH CHECK (is_church_owner(church_id));

-- ============================================
-- VIEWS ÚTEIS
-- ============================================

CREATE OR REPLACE VIEW conversations_with_last_message AS
SELECT 
  c.*,
  m.content as last_message_content,
  m.message_type as last_message_type,
  m.timestamp as last_message_timestamp
FROM conversations c
LEFT JOIN LATERAL (
  SELECT content, message_type, timestamp
  FROM messages
  WHERE conversation_id = c.id
  ORDER BY timestamp DESC
  LIMIT 1
) m ON true;

CREATE OR REPLACE VIEW client_stats AS
SELECT 
  church_id,
  COUNT(*) as total_clients,
  COUNT(*) FILTER (WHERE status = 'lead') as total_leads,
  COUNT(*) FILTER (WHERE status = 'ativo') as total_active,
  COUNT(*) FILTER (WHERE status = 'inativo') as total_inactive,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as new_last_30_days
FROM clients
GROUP BY church_id;

-- ============================================
-- FIM DO SCHEMA
-- ============================================
