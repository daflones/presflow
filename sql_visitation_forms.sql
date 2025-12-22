-- ============================================
-- SISTEMA DE FORMULÁRIOS DE VISITAÇÃO
-- Execute este SQL no Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. TABELA DE CONFIGURAÇÃO DO FORMULÁRIO
-- Cada igreja pode ter seu próprio formulário customizado
-- ============================================

CREATE TABLE IF NOT EXISTS public.visitation_form_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  
  -- Configurações gerais
  titulo VARCHAR(255) NOT NULL DEFAULT 'Formulário de Visitação',
  descricao TEXT,
  ativo BOOLEAN DEFAULT true,
  
  -- Personalização visual
  cor_primaria VARCHAR(20) DEFAULT '#8B5CF6',
  logo_url TEXT,
  mensagem_boas_vindas TEXT,
  mensagem_agradecimento TEXT DEFAULT 'Obrigado por preencher o formulário! Em breve entraremos em contato.',
  
  -- Configurações de campos (quais campos estão ativos e são obrigatórios)
  campos_config JSONB DEFAULT '{
    "nome": {"ativo": true, "obrigatorio": true, "label": "Nome completo"},
    "email": {"ativo": true, "obrigatorio": false, "label": "E-mail"},
    "telefone": {"ativo": true, "obrigatorio": true, "label": "Telefone/WhatsApp"},
    "data_nascimento": {"ativo": false, "obrigatorio": false, "label": "Data de nascimento"},
    "endereco": {"ativo": false, "obrigatorio": false, "label": "Endereço"},
    "bairro": {"ativo": false, "obrigatorio": false, "label": "Bairro"},
    "cidade": {"ativo": false, "obrigatorio": false, "label": "Cidade"},
    "estado": {"ativo": false, "obrigatorio": false, "label": "Estado"},
    "cep": {"ativo": false, "obrigatorio": false, "label": "CEP"},
    "como_conheceu": {"ativo": true, "obrigatorio": false, "label": "Como conheceu nossa igreja?"},
    "motivo_visita": {"ativo": true, "obrigatorio": false, "label": "Motivo da visita"},
    "pedido_oracao": {"ativo": true, "obrigatorio": false, "label": "Pedido de oração"},
    "ja_frequenta_igreja": {"ativo": false, "obrigatorio": false, "label": "Já frequenta alguma igreja?"},
    "qual_igreja": {"ativo": false, "obrigatorio": false, "label": "Qual igreja?"},
    "deseja_receber_visita": {"ativo": true, "obrigatorio": false, "label": "Deseja receber visita?"},
    "melhor_horario_contato": {"ativo": false, "obrigatorio": false, "label": "Melhor horário para contato"},
    "observacoes": {"ativo": false, "obrigatorio": false, "label": "Observações"}
  }'::jsonb,
  
  -- Campos personalizados adicionais (criados pela igreja)
  campos_personalizados JSONB DEFAULT '[]'::jsonb,
  
  -- Opções para campos de seleção
  opcoes_como_conheceu JSONB DEFAULT '["Indicação de amigo/familiar", "Redes sociais", "Passou em frente", "Evento", "Busca na internet", "Outro"]'::jsonb,
  opcoes_motivo_visita JSONB DEFAULT '["Primeira visita", "Conhecer a igreja", "Buscar orientação espiritual", "Participar de evento", "Acompanhar familiar/amigo", "Outro"]'::jsonb,
  
  -- Notificações
  notificar_email BOOLEAN DEFAULT true,
  emails_notificacao TEXT[], -- Lista de emails para receber notificações
  notificar_whatsapp BOOLEAN DEFAULT false,
  
  -- Slug único para URL pública
  slug VARCHAR(100) UNIQUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(church_id)
);

-- ============================================
-- 2. TABELA DE RESPOSTAS DO FORMULÁRIO
-- Armazena as respostas dos visitantes
-- ============================================

CREATE TABLE IF NOT EXISTS public.visitation_form_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  form_config_id UUID NOT NULL REFERENCES public.visitation_form_config(id) ON DELETE CASCADE,
  
  -- Dados básicos do visitante
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  telefone VARCHAR(50),
  data_nascimento DATE,
  
  -- Endereço
  endereco TEXT,
  bairro VARCHAR(100),
  cidade VARCHAR(100),
  estado VARCHAR(50),
  cep VARCHAR(20),
  
  -- Informações da visita
  como_conheceu VARCHAR(255),
  motivo_visita VARCHAR(255),
  pedido_oracao TEXT,
  ja_frequenta_igreja BOOLEAN,
  qual_igreja VARCHAR(255),
  deseja_receber_visita BOOLEAN,
  melhor_horario_contato VARCHAR(100),
  observacoes TEXT,
  
  -- Campos personalizados (respostas em JSON)
  campos_personalizados_respostas JSONB DEFAULT '{}'::jsonb,
  
  -- Metadados
  data_visita DATE DEFAULT CURRENT_DATE,
  ip_address VARCHAR(50),
  user_agent TEXT,
  
  -- Status de acompanhamento
  status VARCHAR(50) DEFAULT 'novo', -- novo, contatado, visitado, membro, inativo
  notas_acompanhamento TEXT,
  responsavel_acompanhamento UUID REFERENCES auth.users(id),
  data_ultimo_contato TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. TABELA DE HISTÓRICO DE ACOMPANHAMENTO
-- Registra interações com o visitante
-- ============================================

CREATE TABLE IF NOT EXISTS public.visitation_followup_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID NOT NULL REFERENCES public.visitation_form_responses(id) ON DELETE CASCADE,
  church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  
  tipo VARCHAR(50) NOT NULL, -- ligacao, whatsapp, visita, email, outro
  descricao TEXT NOT NULL,
  resultado VARCHAR(100), -- sucesso, sem_resposta, reagendar, etc
  
  responsavel_id UUID REFERENCES auth.users(id),
  responsavel_nome VARCHAR(255),
  
  data_contato TIMESTAMPTZ DEFAULT NOW(),
  proxima_acao TEXT,
  data_proxima_acao DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. ÍNDICES PARA PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_visitation_form_config_church ON public.visitation_form_config(church_id);
CREATE INDEX IF NOT EXISTS idx_visitation_form_config_slug ON public.visitation_form_config(slug);
CREATE INDEX IF NOT EXISTS idx_visitation_form_responses_church ON public.visitation_form_responses(church_id);
CREATE INDEX IF NOT EXISTS idx_visitation_form_responses_status ON public.visitation_form_responses(status);
CREATE INDEX IF NOT EXISTS idx_visitation_form_responses_created ON public.visitation_form_responses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_visitation_followup_response ON public.visitation_followup_history(response_id);

-- ============================================
-- 5. POLÍTICAS RLS (Row Level Security)
-- ============================================

ALTER TABLE public.visitation_form_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitation_form_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitation_followup_history ENABLE ROW LEVEL SECURITY;

-- Políticas para visitation_form_config
CREATE POLICY "visitation_form_config_select" ON public.visitation_form_config
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "visitation_form_config_insert" ON public.visitation_form_config
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "visitation_form_config_update" ON public.visitation_form_config
  FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "visitation_form_config_delete" ON public.visitation_form_config
  FOR DELETE TO authenticated
  USING (true);

-- Política para leitura pública do formulário (para visitantes preencherem)
CREATE POLICY "visitation_form_config_public_read" ON public.visitation_form_config
  FOR SELECT TO anon
  USING (ativo = true);

-- Políticas para visitation_form_responses
CREATE POLICY "visitation_form_responses_select" ON public.visitation_form_responses
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "visitation_form_responses_insert" ON public.visitation_form_responses
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Permitir inserção anônima (visitantes preenchendo o formulário)
CREATE POLICY "visitation_form_responses_anon_insert" ON public.visitation_form_responses
  FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "visitation_form_responses_update" ON public.visitation_form_responses
  FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "visitation_form_responses_delete" ON public.visitation_form_responses
  FOR DELETE TO authenticated
  USING (true);

-- Políticas para visitation_followup_history
CREATE POLICY "visitation_followup_history_select" ON public.visitation_followup_history
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "visitation_followup_history_insert" ON public.visitation_followup_history
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "visitation_followup_history_update" ON public.visitation_followup_history
  FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "visitation_followup_history_delete" ON public.visitation_followup_history
  FOR DELETE TO authenticated
  USING (true);

-- ============================================
-- 6. TRIGGERS PARA UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_visitation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_visitation_form_config_updated ON public.visitation_form_config;
CREATE TRIGGER trigger_visitation_form_config_updated
  BEFORE UPDATE ON public.visitation_form_config
  FOR EACH ROW EXECUTE FUNCTION update_visitation_updated_at();

DROP TRIGGER IF EXISTS trigger_visitation_form_responses_updated ON public.visitation_form_responses;
CREATE TRIGGER trigger_visitation_form_responses_updated
  BEFORE UPDATE ON public.visitation_form_responses
  FOR EACH ROW EXECUTE FUNCTION update_visitation_updated_at();

-- ============================================
-- 7. COMENTÁRIOS NAS TABELAS
-- ============================================

COMMENT ON TABLE public.visitation_form_config IS 'Configuração do formulário de visitação de cada igreja';
COMMENT ON TABLE public.visitation_form_responses IS 'Respostas dos visitantes ao formulário';
COMMENT ON TABLE public.visitation_followup_history IS 'Histórico de acompanhamento dos visitantes';

COMMENT ON COLUMN public.visitation_form_config.campos_config IS 'Configuração de quais campos estão ativos e são obrigatórios';
COMMENT ON COLUMN public.visitation_form_config.campos_personalizados IS 'Campos adicionais criados pela igreja - formato: [{"id": "uuid", "tipo": "text|select|checkbox|textarea", "label": "...", "obrigatorio": bool, "opcoes": [...]}]';
COMMENT ON COLUMN public.visitation_form_config.slug IS 'Slug único para URL pública do formulário (ex: /visita/minha-igreja)';

COMMENT ON COLUMN public.visitation_form_responses.status IS 'Status do visitante: novo, contatado, visitado, membro, inativo';
COMMENT ON COLUMN public.visitation_form_responses.campos_personalizados_respostas IS 'Respostas aos campos personalizados - formato: {"campo_id": "resposta"}';
