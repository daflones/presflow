-- =====================================================
-- Schema para WhatsApp Web - Histórico de Mensagens
-- =====================================================

-- Tabela de chats/conversas
CREATE TABLE IF NOT EXISTS whatsapp_chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    instance_name VARCHAR(255) NOT NULL,
    remote_jid VARCHAR(255) NOT NULL, -- Número do contato (ex: 5511999999999@s.whatsapp.net)
    contact_name VARCHAR(255), -- Nome do contato
    contact_push_name VARCHAR(255), -- Nome definido pelo próprio contato
    profile_picture_url TEXT, -- URL da foto de perfil
    is_group BOOLEAN DEFAULT false,
    unread_count INTEGER DEFAULT 0,
    last_message_at TIMESTAMPTZ,
    last_message_preview TEXT,
    is_archived BOOLEAN DEFAULT false,
    is_pinned BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(church_id, instance_name, remote_jid)
);

-- Tabela de mensagens
CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    chat_id UUID NOT NULL REFERENCES whatsapp_chats(id) ON DELETE CASCADE,
    instance_name VARCHAR(255) NOT NULL,
    message_id VARCHAR(255) NOT NULL, -- ID da mensagem no WhatsApp
    remote_jid VARCHAR(255) NOT NULL,
    from_me BOOLEAN NOT NULL, -- true = enviada, false = recebida
    sender_jid VARCHAR(255), -- Quem enviou (útil para grupos)
    sender_name VARCHAR(255),
    
    -- Conteúdo da mensagem
    message_type VARCHAR(50) NOT NULL, -- text, image, audio, video, document, sticker, location, contact, poll, reaction
    text_content TEXT, -- Conteúdo de texto
    caption TEXT, -- Legenda para mídia
    
    -- Mídia
    media_url TEXT, -- URL do arquivo de mídia
    media_mimetype VARCHAR(100),
    media_filename VARCHAR(255),
    media_size INTEGER,
    media_duration INTEGER, -- Duração em segundos (para áudio/vídeo)
    media_base64 TEXT, -- Base64 do arquivo (para armazenamento local)
    thumbnail_base64 TEXT, -- Thumbnail em base64
    
    -- Localização
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    location_name VARCHAR(255),
    location_address TEXT,
    
    -- Contato compartilhado
    vcard TEXT,
    
    -- Status da mensagem
    status VARCHAR(20) DEFAULT 'sent', -- sent, delivered, read, failed
    is_edited BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false, -- Soft delete - mensagens nunca são apagadas de verdade
    is_forwarded BOOLEAN DEFAULT false,
    
    -- Resposta/Citação
    quoted_message_id VARCHAR(255),
    quoted_message_preview TEXT,
    
    -- Reação
    reaction_emoji VARCHAR(10),
    reaction_to_message_id VARCHAR(255),
    
    -- Timestamps
    message_timestamp TIMESTAMPTZ NOT NULL, -- Timestamp original da mensagem
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(church_id, instance_name, message_id)
);

-- Tabela de mídia (para armazenar arquivos separadamente)
CREATE TABLE IF NOT EXISTS whatsapp_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    message_id UUID REFERENCES whatsapp_messages(id) ON DELETE SET NULL,
    media_key VARCHAR(255), -- Chave única do WhatsApp
    media_type VARCHAR(50) NOT NULL, -- image, audio, video, document, sticker
    mimetype VARCHAR(100),
    filename VARCHAR(255),
    file_size INTEGER,
    duration INTEGER, -- Para áudio/vídeo
    width INTEGER, -- Para imagens/vídeos
    height INTEGER,
    url TEXT, -- URL original do WhatsApp (pode expirar)
    storage_path TEXT, -- Caminho no storage local/bucket
    base64_data TEXT, -- Dados em base64 (fallback)
    thumbnail_base64 TEXT,
    is_downloaded BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de contatos do WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    instance_name VARCHAR(255) NOT NULL,
    jid VARCHAR(255) NOT NULL, -- Número (ex: 5511999999999@s.whatsapp.net)
    phone_number VARCHAR(20), -- Número formatado
    name VARCHAR(255), -- Nome salvo
    push_name VARCHAR(255), -- Nome definido pelo contato
    profile_picture_url TEXT,
    profile_status TEXT, -- Status/recado do contato
    is_business BOOLEAN DEFAULT false,
    is_blocked BOOLEAN DEFAULT false,
    last_seen TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(church_id, instance_name, jid)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_chats_church ON whatsapp_chats(church_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_chats_instance ON whatsapp_chats(instance_name);
CREATE INDEX IF NOT EXISTS idx_whatsapp_chats_remote_jid ON whatsapp_chats(remote_jid);
CREATE INDEX IF NOT EXISTS idx_whatsapp_chats_last_message ON whatsapp_chats(last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_church ON whatsapp_messages(church_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_chat ON whatsapp_messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_timestamp ON whatsapp_messages(message_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_type ON whatsapp_messages(message_type);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_message_id ON whatsapp_messages(message_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_church ON whatsapp_contacts(church_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_jid ON whatsapp_contacts(jid);

CREATE INDEX IF NOT EXISTS idx_whatsapp_media_message ON whatsapp_media(message_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_whatsapp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_whatsapp_chats_updated ON whatsapp_chats;
CREATE TRIGGER trigger_whatsapp_chats_updated
    BEFORE UPDATE ON whatsapp_chats
    FOR EACH ROW
    EXECUTE FUNCTION update_whatsapp_updated_at();

DROP TRIGGER IF EXISTS trigger_whatsapp_messages_updated ON whatsapp_messages;
CREATE TRIGGER trigger_whatsapp_messages_updated
    BEFORE UPDATE ON whatsapp_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_whatsapp_updated_at();

DROP TRIGGER IF EXISTS trigger_whatsapp_contacts_updated ON whatsapp_contacts;
CREATE TRIGGER trigger_whatsapp_contacts_updated
    BEFORE UPDATE ON whatsapp_contacts
    FOR EACH ROW
    EXECUTE FUNCTION update_whatsapp_updated_at();

-- RLS Policies
ALTER TABLE whatsapp_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_contacts ENABLE ROW LEVEL SECURITY;

-- Policies para whatsapp_chats
DROP POLICY IF EXISTS "Users can view their church whatsapp_chats" ON whatsapp_chats;
CREATE POLICY "Users can view their church whatsapp_chats" ON whatsapp_chats
    FOR SELECT USING (
        church_id IN (SELECT id FROM churches WHERE owner_id = auth.uid())
    );

DROP POLICY IF EXISTS "Users can insert their church whatsapp_chats" ON whatsapp_chats;
CREATE POLICY "Users can insert their church whatsapp_chats" ON whatsapp_chats
    FOR INSERT WITH CHECK (
        church_id IN (SELECT id FROM churches WHERE owner_id = auth.uid())
    );

DROP POLICY IF EXISTS "Users can update their church whatsapp_chats" ON whatsapp_chats;
CREATE POLICY "Users can update their church whatsapp_chats" ON whatsapp_chats
    FOR UPDATE USING (
        church_id IN (SELECT id FROM churches WHERE owner_id = auth.uid())
    );

-- Policies para whatsapp_messages
DROP POLICY IF EXISTS "Users can view their church whatsapp_messages" ON whatsapp_messages;
CREATE POLICY "Users can view their church whatsapp_messages" ON whatsapp_messages
    FOR SELECT USING (
        church_id IN (SELECT id FROM churches WHERE owner_id = auth.uid())
    );

DROP POLICY IF EXISTS "Users can insert their church whatsapp_messages" ON whatsapp_messages;
CREATE POLICY "Users can insert their church whatsapp_messages" ON whatsapp_messages
    FOR INSERT WITH CHECK (
        church_id IN (SELECT id FROM churches WHERE owner_id = auth.uid())
    );

DROP POLICY IF EXISTS "Users can update their church whatsapp_messages" ON whatsapp_messages;
CREATE POLICY "Users can update their church whatsapp_messages" ON whatsapp_messages
    FOR UPDATE USING (
        church_id IN (SELECT id FROM churches WHERE owner_id = auth.uid())
    );

-- Policies para whatsapp_media
DROP POLICY IF EXISTS "Users can view their church whatsapp_media" ON whatsapp_media;
CREATE POLICY "Users can view their church whatsapp_media" ON whatsapp_media
    FOR SELECT USING (
        church_id IN (SELECT id FROM churches WHERE owner_id = auth.uid())
    );

DROP POLICY IF EXISTS "Users can insert their church whatsapp_media" ON whatsapp_media;
CREATE POLICY "Users can insert their church whatsapp_media" ON whatsapp_media
    FOR INSERT WITH CHECK (
        church_id IN (SELECT id FROM churches WHERE owner_id = auth.uid())
    );

-- Policies para whatsapp_contacts
DROP POLICY IF EXISTS "Users can view their church whatsapp_contacts" ON whatsapp_contacts;
CREATE POLICY "Users can view their church whatsapp_contacts" ON whatsapp_contacts
    FOR SELECT USING (
        church_id IN (SELECT id FROM churches WHERE owner_id = auth.uid())
    );

DROP POLICY IF EXISTS "Users can insert their church whatsapp_contacts" ON whatsapp_contacts;
CREATE POLICY "Users can insert their church whatsapp_contacts" ON whatsapp_contacts
    FOR INSERT WITH CHECK (
        church_id IN (SELECT id FROM churches WHERE owner_id = auth.uid())
    );

DROP POLICY IF EXISTS "Users can update their church whatsapp_contacts" ON whatsapp_contacts;
CREATE POLICY "Users can update their church whatsapp_contacts" ON whatsapp_contacts
    FOR UPDATE USING (
        church_id IN (SELECT id FROM churches WHERE owner_id = auth.uid())
    );

-- Comentários nas tabelas
COMMENT ON TABLE whatsapp_chats IS 'Conversas/chats do WhatsApp';
COMMENT ON TABLE whatsapp_messages IS 'Mensagens do WhatsApp - nunca são deletadas fisicamente';
COMMENT ON TABLE whatsapp_media IS 'Arquivos de mídia do WhatsApp';
COMMENT ON TABLE whatsapp_contacts IS 'Contatos do WhatsApp com informações de perfil';
