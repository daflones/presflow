-- ============================================
-- INTENÇÕES DE MISSAS / AVISOS (NOVAS TABELAS)
-- Execute este SQL no Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. TABELA: INTENÇÕES DE MISSAS
-- ============================================

CREATE TABLE IF NOT EXISTS public.mass_intentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,

  nome_completo VARCHAR(255) NOT NULL,

  -- Tipo de intenção: pode ser uma opção pré-definida (a-i) ou customizada
  tipo_codigo VARCHAR(10),
  tipo_descricao TEXT NOT NULL,

  -- Mensagem / observações do fiel
  mensagem TEXT NOT NULL,

  status VARCHAR(50) DEFAULT 'pendente', -- pendente, em_andamento, aguardando_resposta, resolvido, cancelado
  prioridade VARCHAR(20) DEFAULT 'normal', -- baixa, normal, alta, urgente

  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mass_intentions_church_id ON public.mass_intentions(church_id);
CREATE INDEX IF NOT EXISTS idx_mass_intentions_status ON public.mass_intentions(status);
CREATE INDEX IF NOT EXISTS idx_mass_intentions_prioridade ON public.mass_intentions(prioridade);
CREATE INDEX IF NOT EXISTS idx_mass_intentions_created_at ON public.mass_intentions(created_at DESC);

-- ============================================
-- 2. TABELA: AVISOS
-- ============================================

CREATE TABLE IF NOT EXISTS public.priest_notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,

  nome_completo VARCHAR(255) NOT NULL,

  assunto VARCHAR(255) NOT NULL,
  mensagem TEXT NOT NULL,

  status VARCHAR(50) DEFAULT 'pendente', -- pendente, em_andamento, aguardando_resposta, resolvido, cancelado
  prioridade VARCHAR(20) DEFAULT 'normal', -- baixa, normal, alta, urgente

  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_priest_notices_church_id ON public.priest_notices(church_id);
CREATE INDEX IF NOT EXISTS idx_priest_notices_status ON public.priest_notices(status);
CREATE INDEX IF NOT EXISTS idx_priest_notices_prioridade ON public.priest_notices(prioridade);
CREATE INDEX IF NOT EXISTS idx_priest_notices_created_at ON public.priest_notices(created_at DESC);

-- ============================================
-- 3. RLS (Row Level Security)
-- ============================================

ALTER TABLE public.mass_intentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.priest_notices ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes (se houver)
DROP POLICY IF EXISTS "mass_intentions_select" ON public.mass_intentions;
DROP POLICY IF EXISTS "mass_intentions_insert" ON public.mass_intentions;
DROP POLICY IF EXISTS "mass_intentions_update" ON public.mass_intentions;
DROP POLICY IF EXISTS "mass_intentions_delete" ON public.mass_intentions;

DROP POLICY IF EXISTS "priest_notices_select" ON public.priest_notices;
DROP POLICY IF EXISTS "priest_notices_insert" ON public.priest_notices;
DROP POLICY IF EXISTS "priest_notices_update" ON public.priest_notices;
DROP POLICY IF EXISTS "priest_notices_delete" ON public.priest_notices;

-- Políticas por church_id via public.users (auth_id)
CREATE POLICY "mass_intentions_select" ON public.mass_intentions
  FOR SELECT TO authenticated
  USING (
    church_id IN (
      SELECT u.church_id
      FROM public.users u
      WHERE u.auth_id = auth.uid()
      AND u.is_active = true
    )
  );

CREATE POLICY "mass_intentions_insert" ON public.mass_intentions
  FOR INSERT TO authenticated
  WITH CHECK (
    church_id IN (
      SELECT u.church_id
      FROM public.users u
      WHERE u.auth_id = auth.uid()
      AND u.is_active = true
    )
  );

CREATE POLICY "mass_intentions_update" ON public.mass_intentions
  FOR UPDATE TO authenticated
  USING (
    church_id IN (
      SELECT u.church_id
      FROM public.users u
      WHERE u.auth_id = auth.uid()
      AND u.is_active = true
    )
  );

CREATE POLICY "mass_intentions_delete" ON public.mass_intentions
  FOR DELETE TO authenticated
  USING (
    church_id IN (
      SELECT u.church_id
      FROM public.users u
      WHERE u.auth_id = auth.uid()
      AND u.is_active = true
    )
  );

CREATE POLICY "priest_notices_select" ON public.priest_notices
  FOR SELECT TO authenticated
  USING (
    church_id IN (
      SELECT u.church_id
      FROM public.users u
      WHERE u.auth_id = auth.uid()
      AND u.is_active = true
    )
  );

CREATE POLICY "priest_notices_insert" ON public.priest_notices
  FOR INSERT TO authenticated
  WITH CHECK (
    church_id IN (
      SELECT u.church_id
      FROM public.users u
      WHERE u.auth_id = auth.uid()
      AND u.is_active = true
    )
  );

CREATE POLICY "priest_notices_update" ON public.priest_notices
  FOR UPDATE TO authenticated
  USING (
    church_id IN (
      SELECT u.church_id
      FROM public.users u
      WHERE u.auth_id = auth.uid()
      AND u.is_active = true
    )
  );

CREATE POLICY "priest_notices_delete" ON public.priest_notices
  FOR DELETE TO authenticated
  USING (
    church_id IN (
      SELECT u.church_id
      FROM public.users u
      WHERE u.auth_id = auth.uid()
      AND u.is_active = true
    )
  );

-- ============================================
-- 4. TRIGGER PARA UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_mass_intentions_updated ON public.mass_intentions;
CREATE TRIGGER trigger_mass_intentions_updated
  BEFORE UPDATE ON public.mass_intentions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_priest_notices_updated ON public.priest_notices;
CREATE TRIGGER trigger_priest_notices_updated
  BEFORE UPDATE ON public.priest_notices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
