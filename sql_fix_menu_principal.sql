-- ============================================
-- SQL PARA CORRIGIR COLUNA menu_principal
-- O campo estava como BOOLEAN mas deveria ser TEXT
-- Execute este SQL no Supabase SQL Editor
-- ============================================

-- Primeiro, remover a coluna boolean existente
ALTER TABLE public.ai_configs DROP COLUMN IF EXISTS menu_principal;

-- Recriar como TEXT
ALTER TABLE public.ai_configs ADD COLUMN menu_principal TEXT DEFAULT '';

-- Adicionar comentário
COMMENT ON COLUMN public.ai_configs.menu_principal IS 'Conteúdo do menu principal exibido ao cliente no início da conversa';
