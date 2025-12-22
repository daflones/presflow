-- ============================================
-- SISTEMA DE TICKETS DE SUPORTE / INTENÇÕES E AVISOS
-- Execute este SQL no Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. TABELA PRINCIPAL DE TICKETS
-- ============================================

CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  
  -- Dados do solicitante
  nome VARCHAR(255) NOT NULL,
  telefone VARCHAR(50) NOT NULL,
  email VARCHAR(255),
  
  -- Detalhes do ticket
  motivo VARCHAR(100) NOT NULL, -- pedido_oracao, visita_pastoral, aconselhamento, duvida, reclamacao, sugestao, outro
  categoria VARCHAR(100), -- financeiro, espiritual, familiar, saude, outro
  assunto VARCHAR(255),
  observacao TEXT,
  
  -- Prioridade e Status
  prioridade VARCHAR(20) DEFAULT 'normal', -- baixa, normal, alta, urgente
  status VARCHAR(50) DEFAULT 'pendente', -- pendente, em_andamento, aguardando_resposta, resolvido, cancelado
  
  -- Datas
  data_criacao TIMESTAMPTZ DEFAULT NOW(),
  data_atualizacao TIMESTAMPTZ DEFAULT NOW(),
  data_resolucao TIMESTAMPTZ,
  
  -- Responsável
  responsavel_id UUID REFERENCES auth.users(id),
  responsavel_nome VARCHAR(255),
  
  -- Origem do ticket
  origem VARCHAR(50) DEFAULT 'manual', -- manual, whatsapp, site, telefone
  conversa_id UUID, -- Referência para conversa do WhatsApp se aplicável
  
  -- Metadados
  tags TEXT[],
  anexos JSONB DEFAULT '[]'::jsonb, -- [{url, nome, tipo}]
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. TABELA DE HISTÓRICO/INTERAÇÕES DO TICKET
-- ============================================

CREATE TABLE IF NOT EXISTS public.support_ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  
  -- Tipo de mensagem
  tipo VARCHAR(50) NOT NULL, -- mensagem, nota_interna, status_change, whatsapp_enviado, whatsapp_recebido
  
  -- Conteúdo
  conteudo TEXT NOT NULL,
  
  -- Autor
  autor_id UUID REFERENCES auth.users(id),
  autor_nome VARCHAR(255),
  autor_tipo VARCHAR(50) DEFAULT 'atendente', -- atendente, sistema, solicitante
  
  -- WhatsApp
  whatsapp_message_id VARCHAR(255), -- ID da mensagem no WhatsApp se enviada
  whatsapp_status VARCHAR(50), -- enviado, entregue, lido, erro
  
  -- Metadados
  anexos JSONB DEFAULT '[]'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. TABELA DE CATEGORIAS DE TICKETS (CONFIGURÁVEL)
-- ============================================

CREATE TABLE IF NOT EXISTS public.support_ticket_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  cor VARCHAR(20) DEFAULT '#8B5CF6', -- Cor para exibição
  icone VARCHAR(50), -- Nome do ícone (lucide)
  ativo BOOLEAN DEFAULT true,
  ordem INT DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(church_id, nome)
);

-- ============================================
-- 4. TABELA DE MOTIVOS PRÉ-DEFINIDOS
-- ============================================

CREATE TABLE IF NOT EXISTS public.support_ticket_reasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  categoria_id UUID REFERENCES public.support_ticket_categories(id) ON DELETE SET NULL,
  prioridade_padrao VARCHAR(20) DEFAULT 'normal',
  ativo BOOLEAN DEFAULT true,
  ordem INT DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(church_id, nome)
);

-- ============================================
-- 5. ÍNDICES PARA PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_support_tickets_church ON public.support_tickets(church_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_prioridade ON public.support_tickets(prioridade);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created ON public.support_tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_telefone ON public.support_tickets(telefone);
CREATE INDEX IF NOT EXISTS idx_support_ticket_messages_ticket ON public.support_ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_support_ticket_categories_church ON public.support_ticket_categories(church_id);
CREATE INDEX IF NOT EXISTS idx_support_ticket_reasons_church ON public.support_ticket_reasons(church_id);

-- ============================================
-- 6. POLÍTICAS RLS (Row Level Security)
-- ============================================

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_ticket_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_ticket_reasons ENABLE ROW LEVEL SECURITY;

-- Políticas para support_tickets
CREATE POLICY "support_tickets_select" ON public.support_tickets
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "support_tickets_insert" ON public.support_tickets
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "support_tickets_update" ON public.support_tickets
  FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "support_tickets_delete" ON public.support_tickets
  FOR DELETE TO authenticated
  USING (true);

-- Políticas para support_ticket_messages
CREATE POLICY "support_ticket_messages_select" ON public.support_ticket_messages
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "support_ticket_messages_insert" ON public.support_ticket_messages
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "support_ticket_messages_update" ON public.support_ticket_messages
  FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "support_ticket_messages_delete" ON public.support_ticket_messages
  FOR DELETE TO authenticated
  USING (true);

-- Políticas para support_ticket_categories
CREATE POLICY "support_ticket_categories_select" ON public.support_ticket_categories
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "support_ticket_categories_insert" ON public.support_ticket_categories
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "support_ticket_categories_update" ON public.support_ticket_categories
  FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "support_ticket_categories_delete" ON public.support_ticket_categories
  FOR DELETE TO authenticated
  USING (true);

-- Políticas para support_ticket_reasons
CREATE POLICY "support_ticket_reasons_select" ON public.support_ticket_reasons
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "support_ticket_reasons_insert" ON public.support_ticket_reasons
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "support_ticket_reasons_update" ON public.support_ticket_reasons
  FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "support_ticket_reasons_delete" ON public.support_ticket_reasons
  FOR DELETE TO authenticated
  USING (true);

-- ============================================
-- 7. TRIGGERS PARA UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_support_ticket_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_support_tickets_updated ON public.support_tickets;
CREATE TRIGGER trigger_support_tickets_updated
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION update_support_ticket_updated_at();

DROP TRIGGER IF EXISTS trigger_support_ticket_categories_updated ON public.support_ticket_categories;
CREATE TRIGGER trigger_support_ticket_categories_updated
  BEFORE UPDATE ON public.support_ticket_categories
  FOR EACH ROW EXECUTE FUNCTION update_support_ticket_updated_at();

DROP TRIGGER IF EXISTS trigger_support_ticket_reasons_updated ON public.support_ticket_reasons;
CREATE TRIGGER trigger_support_ticket_reasons_updated
  BEFORE UPDATE ON public.support_ticket_reasons
  FOR EACH ROW EXECUTE FUNCTION update_support_ticket_updated_at();

-- ============================================
-- 8. INSERIR CATEGORIAS E MOTIVOS PADRÃO
-- (Execute após criar a igreja)
-- ============================================

-- Função para criar categorias padrão para uma igreja
CREATE OR REPLACE FUNCTION create_default_ticket_categories(p_church_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO public.support_ticket_categories (church_id, nome, descricao, cor, icone, ordem)
  VALUES 
    (p_church_id, 'Espiritual', 'Pedidos de oração, aconselhamento espiritual', '#8B5CF6', 'heart', 1),
    (p_church_id, 'Pastoral', 'Visitas, acompanhamento pastoral', '#3B82F6', 'users', 2),
    (p_church_id, 'Administrativo', 'Dúvidas, documentos, certificados', '#10B981', 'file-text', 3),
    (p_church_id, 'Eventos', 'Inscrições, informações sobre eventos', '#F59E0B', 'calendar', 4),
    (p_church_id, 'Sugestões', 'Sugestões e feedback', '#6366F1', 'lightbulb', 5),
    (p_church_id, 'Outros', 'Outros assuntos', '#6B7280', 'help-circle', 6)
  ON CONFLICT (church_id, nome) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Função para criar motivos padrão para uma igreja
CREATE OR REPLACE FUNCTION create_default_ticket_reasons(p_church_id UUID)
RETURNS void AS $$
DECLARE
  v_espiritual_id UUID;
  v_pastoral_id UUID;
  v_admin_id UUID;
BEGIN
  -- Buscar IDs das categorias
  SELECT id INTO v_espiritual_id FROM public.support_ticket_categories 
    WHERE church_id = p_church_id AND nome = 'Espiritual' LIMIT 1;
  SELECT id INTO v_pastoral_id FROM public.support_ticket_categories 
    WHERE church_id = p_church_id AND nome = 'Pastoral' LIMIT 1;
  SELECT id INTO v_admin_id FROM public.support_ticket_categories 
    WHERE church_id = p_church_id AND nome = 'Administrativo' LIMIT 1;

  INSERT INTO public.support_ticket_reasons (church_id, nome, categoria_id, prioridade_padrao, ordem)
  VALUES 
    (p_church_id, 'Pedido de Oração', v_espiritual_id, 'normal', 1),
    (p_church_id, 'Aconselhamento', v_espiritual_id, 'alta', 2),
    (p_church_id, 'Visita Pastoral', v_pastoral_id, 'normal', 3),
    (p_church_id, 'Visita a Enfermo', v_pastoral_id, 'alta', 4),
    (p_church_id, 'Batismo', v_admin_id, 'normal', 5),
    (p_church_id, 'Casamento', v_admin_id, 'normal', 6),
    (p_church_id, 'Certidão/Documento', v_admin_id, 'baixa', 7),
    (p_church_id, 'Dúvida Geral', NULL, 'baixa', 8),
    (p_church_id, 'Outro', NULL, 'normal', 9)
  ON CONFLICT (church_id, nome) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 9. COMENTÁRIOS NAS TABELAS
-- ============================================

COMMENT ON TABLE public.support_tickets IS 'Tickets de suporte/intenções e avisos da igreja';
COMMENT ON TABLE public.support_ticket_messages IS 'Histórico de mensagens e interações do ticket';
COMMENT ON TABLE public.support_ticket_categories IS 'Categorias configuráveis de tickets por igreja';
COMMENT ON TABLE public.support_ticket_reasons IS 'Motivos pré-definidos para tickets por igreja';

COMMENT ON COLUMN public.support_tickets.motivo IS 'Motivo principal do ticket';
COMMENT ON COLUMN public.support_tickets.prioridade IS 'Prioridade: baixa, normal, alta, urgente';
COMMENT ON COLUMN public.support_tickets.status IS 'Status: pendente, em_andamento, aguardando_resposta, resolvido, cancelado';
COMMENT ON COLUMN public.support_tickets.origem IS 'Origem: manual, whatsapp, site, telefone';

COMMENT ON COLUMN public.support_ticket_messages.tipo IS 'Tipo: mensagem, nota_interna, status_change, whatsapp_enviado, whatsapp_recebido';
COMMENT ON COLUMN public.support_ticket_messages.autor_tipo IS 'Tipo do autor: atendente, sistema, solicitante';
