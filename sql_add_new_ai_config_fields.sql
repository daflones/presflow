-- ============================================
-- SQL PARA ADICIONAR NOVOS CAMPOS NA TABELA ai_configs
-- Execute este SQL no Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. IDENTIDADE DO AGENTE
-- ============================================

-- Gênero/persona do agente (feminino, masculino, neutro)
ALTER TABLE public.ai_configs ADD COLUMN IF NOT EXISTS agent_gender VARCHAR DEFAULT 'feminino';

-- Frase de apresentação inicial
ALTER TABLE public.ai_configs ADD COLUMN IF NOT EXISTS greeting_message TEXT DEFAULT '';

-- Mensagem de erro padrão
ALTER TABLE public.ai_configs ADD COLUMN IF NOT EXISTS error_message TEXT DEFAULT 'Desculpe, não consegui processar sua solicitação. Por favor, tente novamente ou entre em contato conosco.';

-- ============================================
-- 2. CONTATOS DA IGREJA
-- ============================================

-- Telefone fixo
ALTER TABLE public.ai_configs ADD COLUMN IF NOT EXISTS phone_landline VARCHAR DEFAULT '';

-- WhatsApp (número para contato direto)
ALTER TABLE public.ai_configs ADD COLUMN IF NOT EXISTS phone_whatsapp VARCHAR DEFAULT '';

-- E-mail principal
ALTER TABLE public.ai_configs ADD COLUMN IF NOT EXISTS email_main VARCHAR DEFAULT '';

-- E-mail da secretaria
ALTER TABLE public.ai_configs ADD COLUMN IF NOT EXISTS email_secretary VARCHAR DEFAULT '';

-- E-mail para envio de documentos
ALTER TABLE public.ai_configs ADD COLUMN IF NOT EXISTS email_documents VARCHAR DEFAULT '';

-- Contato para dúvidas gerais (texto livre)
ALTER TABLE public.ai_configs ADD COLUMN IF NOT EXISTS contact_general TEXT DEFAULT '';

-- ============================================
-- 3. REGRAS DE AGENDAMENTO
-- ============================================

-- Permite agendamento na Quaresma?
ALTER TABLE public.ai_configs ADD COLUMN IF NOT EXISTS allow_scheduling_lent BOOLEAN DEFAULT true;

-- Permite agendamento em Jubileu?
ALTER TABLE public.ai_configs ADD COLUMN IF NOT EXISTS allow_scheduling_jubilee BOOLEAN DEFAULT true;

-- Datas específicas de bloqueio (array de períodos JSON)
-- Formato: [{"start": "2025-03-05", "end": "2025-04-20", "reason": "Quaresma"}, ...]
ALTER TABLE public.ai_configs ADD COLUMN IF NOT EXISTS blocked_dates JSONB DEFAULT '[]'::jsonb;

-- Limite de eventos simultâneos por horário
ALTER TABLE public.ai_configs ADD COLUMN IF NOT EXISTS max_simultaneous_events INTEGER DEFAULT 1;

-- ============================================
-- 4. MENSAGENS PERSONALIZADAS
-- ============================================

-- Texto de doação
ALTER TABLE public.ai_configs ADD COLUMN IF NOT EXISTS donation_text TEXT DEFAULT '';

-- Texto de oração (modelos de oração)
ALTER TABLE public.ai_configs ADD COLUMN IF NOT EXISTS prayer_text TEXT DEFAULT '';

-- Texto de confirmação (após agendamento bem-sucedido)
ALTER TABLE public.ai_configs ADD COLUMN IF NOT EXISTS confirmation_text TEXT DEFAULT 'Seu agendamento foi confirmado com sucesso! Em breve você receberá mais informações.';

-- Texto de indisponibilidade (quando não há horários)
ALTER TABLE public.ai_configs ADD COLUMN IF NOT EXISTS unavailability_text TEXT DEFAULT 'Infelizmente não temos horários disponíveis para a data solicitada. Por favor, escolha outra data ou entre em contato conosco.';

-- Texto pós-agendamento (instruções após agendar)
ALTER TABLE public.ai_configs ADD COLUMN IF NOT EXISTS post_scheduling_text TEXT DEFAULT '';

-- ============================================
-- COMENTÁRIOS NAS COLUNAS
-- ============================================

COMMENT ON COLUMN public.ai_configs.agent_gender IS 'Gênero/persona do agente virtual (feminino, masculino, neutro)';
COMMENT ON COLUMN public.ai_configs.greeting_message IS 'Frase de apresentação inicial do agente';
COMMENT ON COLUMN public.ai_configs.error_message IS 'Mensagem de erro padrão quando algo dá errado';

COMMENT ON COLUMN public.ai_configs.phone_landline IS 'Telefone fixo da igreja';
COMMENT ON COLUMN public.ai_configs.phone_whatsapp IS 'Número de WhatsApp para contato';
COMMENT ON COLUMN public.ai_configs.email_main IS 'E-mail principal da igreja';
COMMENT ON COLUMN public.ai_configs.email_secretary IS 'E-mail da secretaria';
COMMENT ON COLUMN public.ai_configs.email_documents IS 'E-mail para envio de documentos';
COMMENT ON COLUMN public.ai_configs.contact_general IS 'Informações de contato para dúvidas gerais';

COMMENT ON COLUMN public.ai_configs.allow_scheduling_lent IS 'Permite agendamento durante a Quaresma';
COMMENT ON COLUMN public.ai_configs.allow_scheduling_jubilee IS 'Permite agendamento durante Jubileu';
COMMENT ON COLUMN public.ai_configs.blocked_dates IS 'Array JSON de períodos bloqueados para agendamento';
COMMENT ON COLUMN public.ai_configs.max_simultaneous_events IS 'Limite máximo de eventos simultâneos por horário';

COMMENT ON COLUMN public.ai_configs.donation_text IS 'Texto informativo sobre doações';
COMMENT ON COLUMN public.ai_configs.prayer_text IS 'Modelos de texto para orações';
COMMENT ON COLUMN public.ai_configs.confirmation_text IS 'Mensagem de confirmação após agendamento';
COMMENT ON COLUMN public.ai_configs.unavailability_text IS 'Mensagem quando não há horários disponíveis';
COMMENT ON COLUMN public.ai_configs.post_scheduling_text IS 'Instruções enviadas após o agendamento';

-- ============================================
-- CORREÇÃO DO CAMPO menu_principal (se ainda não foi feita)
-- ============================================

-- Verificar se menu_principal é boolean e converter para TEXT
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ai_configs' 
        AND column_name = 'menu_principal' 
        AND data_type = 'boolean'
    ) THEN
        ALTER TABLE public.ai_configs DROP COLUMN menu_principal;
        ALTER TABLE public.ai_configs ADD COLUMN menu_principal TEXT DEFAULT '';
    END IF;
END $$;
