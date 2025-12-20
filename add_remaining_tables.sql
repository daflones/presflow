-- ============================================
-- ADICIONAR TABELAS RESTANTES AO SCHEMA
-- Execute este arquivo no Supabase SQL Editor
-- (A tabela churches já existe)
-- ============================================

-- ============================================
-- 1. TABELA DE CONFIGURAÇÕES DE IA
-- ============================================
CREATE TABLE IF NOT EXISTS ai_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  
  agent_name VARCHAR(100) DEFAULT 'Iara',
  tone_of_voice VARCHAR(20) DEFAULT 'amigavel',
  text_size VARCHAR(20) DEFAULT 'curto',
  use_emojis BOOLEAN DEFAULT false,
  
  send_documents BOOLEAN DEFAULT false,
  auto_scheduling BOOLEAN DEFAULT false,
  
  qualification_fields JSONB DEFAULT '{
    "nome": true,
    "telefone": true,
    "email": true,
    "interesse": true,
    "motivacao": true,
    "expectativa": true,
    "tipo_evento": true,
    "nome_igreja": true,
    "segmento": true,
    "volume_mensal": true
  }'::jsonb,
  
  business_hours JSONB DEFAULT '{
    "monday": {"enabled": true, "startTime": "09:00", "endTime": "18:00"},
    "tuesday": {"enabled": true, "startTime": "09:00", "endTime": "18:00"},
    "wednesday": {"enabled": true, "startTime": "09:00", "endTime": "18:00"},
    "thursday": {"enabled": true, "startTime": "09:00", "endTime": "18:00"},
    "friday": {"enabled": true, "startTime": "09:00", "endTime": "18:00"},
    "saturday": {"enabled": false, "startTime": "09:00", "endTime": "13:00"},
    "sunday": {"enabled": false, "startTime": "09:00", "endTime": "13:00"}
  }'::jsonb,
  
  outside_hours_message TEXT DEFAULT 'Desculpe, estamos fora do horário de atendimento. Retornaremos em breve!',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_configs_church_id ON ai_configs(church_id);

-- ============================================
-- 2. TABELA DE EVENTOS DO CALENDÁRIO
-- ============================================
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_type VARCHAR(50) DEFAULT 'meeting',
  
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  all_day BOOLEAN DEFAULT false,
  
  location VARCHAR(255),
  attendees TEXT[],
  
  reminder_minutes INTEGER DEFAULT 30,
  
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_calendar_events_church_id ON calendar_events(church_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_at ON calendar_events(start_at);
CREATE INDEX IF NOT EXISTS idx_calendar_events_created_by ON calendar_events(created_by);

-- ============================================
-- 3. TABELA DE CLIENTES (CRM)
-- ============================================
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  whatsapp VARCHAR(20),
  remote_jid VARCHAR(100),
  
  status VARCHAR(50) DEFAULT 'lead',
  category VARCHAR(50) DEFAULT 'sem-categoria',
  tags TEXT[] DEFAULT '{}',
  
  notes TEXT,
  
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(2),
  zip_code VARCHAR(10),
  
  interest VARCHAR(255),
  motivation TEXT,
  expectation TEXT,
  event_type VARCHAR(100),
  church_name VARCHAR(255),
  segment VARCHAR(100),
  monthly_volume VARCHAR(50),
  
  source VARCHAR(100),
  source_details TEXT,
  
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  last_contact_at TIMESTAMPTZ,
  next_followup_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clients_church_id ON clients(church_id);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_category ON clients(category);
CREATE INDEX IF NOT EXISTS idx_clients_assigned_to ON clients(assigned_to);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone);
CREATE INDEX IF NOT EXISTS idx_clients_whatsapp ON clients(whatsapp);
CREATE INDEX IF NOT EXISTS idx_clients_remote_jid ON clients(remote_jid);

-- ============================================
-- 4. TABELA DE INSTÂNCIAS WHATSAPP
-- ============================================
CREATE TABLE IF NOT EXISTS whatsapp_instances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  
  instance_name VARCHAR(100) UNIQUE NOT NULL,
  instance_id VARCHAR(100),
  phone_number VARCHAR(20),
  
  status VARCHAR(50) DEFAULT 'disconnected',
  
  qr_code TEXT,
  connected_at TIMESTAMPTZ,
  disconnected_at TIMESTAMPTZ,
  
  settings JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_church_id ON whatsapp_instances(church_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_status ON whatsapp_instances(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_instance_name ON whatsapp_instances(instance_name);

-- ============================================
-- 5. TABELA DE CONVERSAS
-- ============================================
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  whatsapp_instance_id UUID REFERENCES whatsapp_instances(id) ON DELETE SET NULL,
  
  remote_jid VARCHAR(100) NOT NULL,
  contact_name VARCHAR(255),
  
  status VARCHAR(50) DEFAULT 'active',
  
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT,
  
  unread_count INTEGER DEFAULT 0,
  
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_church_id ON conversations(church_id);
CREATE INDEX IF NOT EXISTS idx_conversations_client_id ON conversations(client_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_remote_jid ON conversations(remote_jid);
CREATE INDEX IF NOT EXISTS idx_conversations_assigned_to ON conversations(assigned_to);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations(last_message_at);

-- ============================================
-- 6. TABELA DE MENSAGENS
-- ============================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  
  message_id VARCHAR(100),
  remote_jid VARCHAR(100) NOT NULL,
  
  direction VARCHAR(20) NOT NULL,
  
  content_type VARCHAR(50) DEFAULT 'text',
  content TEXT,
  
  media_url TEXT,
  media_mime_type VARCHAR(100),
  
  status VARCHAR(50) DEFAULT 'sent',
  
  timestamp TIMESTAMPTZ NOT NULL,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_church_id ON messages(church_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_remote_jid ON messages(remote_jid);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_messages_direction ON messages(direction);

-- ============================================
-- 7. TABELA DE PROMPTS DE IA
-- ============================================
CREATE TABLE IF NOT EXISTS ai_prompts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  prompt_type VARCHAR(50) DEFAULT 'system',
  
  content TEXT NOT NULL,
  
  variables JSONB DEFAULT '[]'::jsonb,
  
  is_active BOOLEAN DEFAULT true,
  
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_prompts_church_id ON ai_prompts(church_id);
CREATE INDEX IF NOT EXISTS idx_ai_prompts_type ON ai_prompts(prompt_type);
CREATE INDEX IF NOT EXISTS idx_ai_prompts_is_active ON ai_prompts(is_active);

-- ============================================
-- 8. TABELA DE ARQUIVOS
-- ============================================
CREATE TABLE IF NOT EXISTS files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  
  name VARCHAR(255) NOT NULL,
  file_type VARCHAR(50),
  file_size BIGINT,
  
  storage_path TEXT NOT NULL,
  public_url TEXT,
  
  mime_type VARCHAR(100),
  
  related_to_type VARCHAR(50),
  related_to_id UUID,
  
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_files_church_id ON files(church_id);
CREATE INDEX IF NOT EXISTS idx_files_related_to ON files(related_to_type, related_to_id);
CREATE INDEX IF NOT EXISTS idx_files_uploaded_by ON files(uploaded_by);

-- ============================================
-- 9. TABELA DE AVISOS
-- ============================================
CREATE TABLE IF NOT EXISTS notices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  
  type VARCHAR(50) DEFAULT 'info',
  priority VARCHAR(20) DEFAULT 'normal',
  
  target_audience VARCHAR(50) DEFAULT 'all',
  
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  
  is_active BOOLEAN DEFAULT true,
  
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notices_church_id ON notices(church_id);
CREATE INDEX IF NOT EXISTS idx_notices_is_active ON notices(is_active);
CREATE INDEX IF NOT EXISTS idx_notices_type ON notices(type);

-- ============================================
-- 10. TABELA DE LOGS DE ATIVIDADE
-- ============================================
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id UUID,
  
  description TEXT,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_church_id ON activity_logs(church_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);

-- ============================================
-- TRIGGERS PARA UPDATED_AT
-- ============================================
CREATE TRIGGER update_ai_configs_updated_at 
  BEFORE UPDATE ON ai_configs 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_events_updated_at 
  BEFORE UPDATE ON calendar_events 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at 
  BEFORE UPDATE ON clients 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_instances_updated_at 
  BEFORE UPDATE ON whatsapp_instances 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at 
  BEFORE UPDATE ON conversations 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_prompts_updated_at 
  BEFORE UPDATE ON ai_prompts 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notices_updated_at 
  BEFORE UPDATE ON notices 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- HABILITAR RLS EM TODAS AS TABELAS
-- ============================================
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

-- ============================================
-- POLÍTICAS RLS
-- ============================================

-- AI Configs
CREATE POLICY "Users can view their church AI config" ON ai_configs
  FOR SELECT USING (is_church_owner(church_id));

CREATE POLICY "Users can manage their church AI config" ON ai_configs
  FOR ALL USING (is_church_owner(church_id));

-- Calendar Events
CREATE POLICY "Users can view their church events" ON calendar_events
  FOR SELECT USING (is_church_owner(church_id));

CREATE POLICY "Users can manage their church events" ON calendar_events
  FOR ALL USING (is_church_owner(church_id));

-- Clients
CREATE POLICY "Users can view their church clients" ON clients
  FOR SELECT USING (is_church_owner(church_id));

CREATE POLICY "Users can manage their church clients" ON clients
  FOR ALL USING (is_church_owner(church_id));

-- WhatsApp Instances
CREATE POLICY "Users can view their church WhatsApp instances" ON whatsapp_instances
  FOR SELECT USING (is_church_owner(church_id));

CREATE POLICY "Users can manage their church WhatsApp instances" ON whatsapp_instances
  FOR ALL USING (is_church_owner(church_id));

-- Conversations
CREATE POLICY "Users can view their church conversations" ON conversations
  FOR SELECT USING (is_church_owner(church_id));

CREATE POLICY "Users can manage their church conversations" ON conversations
  FOR ALL USING (is_church_owner(church_id));

-- Messages
CREATE POLICY "Users can view their church messages" ON messages
  FOR SELECT USING (is_church_owner(church_id));

CREATE POLICY "Users can create messages" ON messages
  FOR INSERT WITH CHECK (is_church_owner(church_id));

-- AI Prompts
CREATE POLICY "Users can view their church prompts" ON ai_prompts
  FOR SELECT USING (is_church_owner(church_id));

CREATE POLICY "Users can manage their church prompts" ON ai_prompts
  FOR ALL USING (is_church_owner(church_id));

-- Files
CREATE POLICY "Users can view their church files" ON files
  FOR SELECT USING (is_church_owner(church_id));

CREATE POLICY "Users can manage their church files" ON files
  FOR ALL USING (is_church_owner(church_id));

-- Notices
CREATE POLICY "Users can view their church notices" ON notices
  FOR SELECT USING (is_church_owner(church_id));

CREATE POLICY "Users can manage their church notices" ON notices
  FOR ALL USING (is_church_owner(church_id));

-- Activity Logs
CREATE POLICY "Users can view their church activity logs" ON activity_logs
  FOR SELECT USING (is_church_owner(church_id));

CREATE POLICY "Users can create activity logs" ON activity_logs
  FOR INSERT WITH CHECK (is_church_owner(church_id));

-- ============================================
-- SUCESSO! Todas as tabelas foram criadas.
-- ============================================
