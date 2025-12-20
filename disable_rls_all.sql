-- ============================================
-- DESABILITAR RLS EM TODAS AS TABELAS
-- Execute este SQL no Supabase SQL Editor
-- ============================================

-- Desabilitar RLS em todas as tabelas para permitir acesso
ALTER TABLE public.churches DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_configs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_instances DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_prompts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.files DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs DISABLE ROW LEVEL SECURITY;

-- ============================================
-- NOTA: Isso desabilita a segurança por linha.
-- Depois de testar, podemos reabilitar com políticas corretas.
-- ============================================
