-- ============================================
-- SQL PARA ADICIONAR NOVAS COLUNAS NA TABELA ai_configs
-- Execute este SQL no Supabase SQL Editor
-- ============================================

-- Link do Google Maps
ALTER TABLE public.ai_configs ADD COLUMN IF NOT EXISTS google_maps_link TEXT;

-- Espaços disponíveis (capelas, santuários, salões, etc.)
ALTER TABLE public.ai_configs ADD COLUMN IF NOT EXISTS espacos_disponiveis TEXT;

-- Informações sobre Casamento (JSON com lugares, horários, documentação, prazo, valores)
ALTER TABLE public.ai_configs ADD COLUMN IF NOT EXISTS info_casamento JSONB DEFAULT '{
  "lugares": "",
  "horarios": "",
  "documentacao": "",
  "prazo_entrega": "",
  "valores": ""
}'::jsonb;

-- Exige sinal para reservas
ALTER TABLE public.ai_configs ADD COLUMN IF NOT EXISTS exige_sinal BOOLEAN DEFAULT false;

-- Regras para sinal
ALTER TABLE public.ai_configs ADD COLUMN IF NOT EXISTS regras_sinal TEXT;

-- Informações sobre Batizados (JSON com lugares, horários, documentação, prazo, valores)
ALTER TABLE public.ai_configs ADD COLUMN IF NOT EXISTS info_batizados JSONB DEFAULT '{
  "lugares": "",
  "horarios": "",
  "documentacao": "",
  "prazo_entrega": "",
  "valores": ""
}'::jsonb;

-- Cursos oferecidos
ALTER TABLE public.ai_configs ADD COLUMN IF NOT EXISTS cursos TEXT;

-- Sessão de Fotos (regras, horários, valores)
ALTER TABLE public.ai_configs ADD COLUMN IF NOT EXISTS sessao_fotos TEXT;

-- Regras para Hospedagem
ALTER TABLE public.ai_configs ADD COLUMN IF NOT EXISTS regras_hospedagem TEXT;

-- Link para agendamento de visitação
ALTER TABLE public.ai_configs ADD COLUMN IF NOT EXISTS link_visitacao TEXT;

-- Guia turístico (visita autoguiada)
ALTER TABLE public.ai_configs ADD COLUMN IF NOT EXISTS guia_turistico TEXT;

-- Projetos Sociais disponíveis para parceria com empresas
ALTER TABLE public.ai_configs ADD COLUMN IF NOT EXISTS projetos_sociais_empresas TEXT;

-- Projetos sociais disponíveis para comunidade
ALTER TABLE public.ai_configs ADD COLUMN IF NOT EXISTS projetos_sociais_comunidade TEXT;

-- Regras específicas
ALTER TABLE public.ai_configs ADD COLUMN IF NOT EXISTS regras_especificas TEXT;

-- Hospedagem disponível (booleano)
ALTER TABLE public.ai_configs ADD COLUMN IF NOT EXISTS hospedagem_disponivel BOOLEAN DEFAULT false;

-- ============================================
-- COMENTÁRIOS NAS COLUNAS (OPCIONAL)
-- ============================================
COMMENT ON COLUMN public.ai_configs.google_maps_link IS 'Link do Google Maps para localização';
COMMENT ON COLUMN public.ai_configs.espacos_disponiveis IS 'Descrição dos espaços disponíveis (capelas, santuários, salões)';
COMMENT ON COLUMN public.ai_configs.info_casamento IS 'JSON com informações sobre casamentos (lugares, horários, documentação, prazo, valores)';
COMMENT ON COLUMN public.ai_configs.exige_sinal IS 'Se exige sinal para reservas';
COMMENT ON COLUMN public.ai_configs.regras_sinal IS 'Regras para pagamento de sinal';
COMMENT ON COLUMN public.ai_configs.info_batizados IS 'JSON com informações sobre batizados (lugares, horários, documentação, prazo, valores)';
COMMENT ON COLUMN public.ai_configs.cursos IS 'Cursos oferecidos pela igreja';
COMMENT ON COLUMN public.ai_configs.sessao_fotos IS 'Regras e informações sobre sessão de fotos';
COMMENT ON COLUMN public.ai_configs.regras_hospedagem IS 'Regras para hospedagem';
COMMENT ON COLUMN public.ai_configs.link_visitacao IS 'Link para agendamento de visitação';
COMMENT ON COLUMN public.ai_configs.guia_turistico IS 'Informações sobre visita autoguiada';
COMMENT ON COLUMN public.ai_configs.projetos_sociais_empresas IS 'Projetos sociais para parceria com empresas';
COMMENT ON COLUMN public.ai_configs.projetos_sociais_comunidade IS 'Projetos sociais para comunidade';
COMMENT ON COLUMN public.ai_configs.regras_especificas IS 'Regras específicas da igreja';
COMMENT ON COLUMN public.ai_configs.hospedagem_disponivel IS 'Se oferece hospedagem';
