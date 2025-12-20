-- ============================================
-- FIX: Desabilitar RLS temporariamente para churches
-- Execute este SQL no Supabase SQL Editor
-- ============================================

-- Desabilitar RLS na tabela churches temporariamente
ALTER TABLE public.churches DISABLE ROW LEVEL SECURITY;

-- ============================================
-- NOTA: Isso permite que qualquer usuário autenticado
-- veja todas as igrejas. Use apenas para debug.
-- Depois de confirmar que funciona, podemos reabilitar
-- o RLS com políticas corretas.
-- ============================================
