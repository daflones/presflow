-- ============================================
-- VERIFICAR E CORRIGIR PROBLEMA DE RLS
-- Execute TODO este arquivo no Supabase SQL Editor
-- ============================================

-- 1. Verificar se RLS está ativo
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'churches';

-- 2. Dropar todas as políticas existentes
DROP POLICY IF EXISTS "Users can view their own church" ON public.churches;
DROP POLICY IF EXISTS "Users can update their own church" ON public.churches;

-- 3. Desabilitar RLS
ALTER TABLE public.churches DISABLE ROW LEVEL SECURITY;

-- 4. Verificar se há dados na tabela
SELECT id, owner_id, name, slug FROM public.churches;

-- ============================================
-- Após executar, recarregue a página
-- ============================================
