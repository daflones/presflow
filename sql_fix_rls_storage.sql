-- ============================================
-- CORRIGIR POLÍTICAS RLS DO STORAGE E TABELAS
-- Execute este SQL no Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. REMOVER POLÍTICAS ANTIGAS DO STORAGE
-- ============================================
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;

-- ============================================
-- 2. CRIAR POLÍTICAS PERMISSIVAS PARA STORAGE
-- ============================================

-- Permitir INSERT para usuários autenticados
CREATE POLICY "storage_authenticated_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (true);

-- Permitir SELECT público
CREATE POLICY "storage_public_select"
ON storage.objects FOR SELECT
TO public
USING (true);

-- Permitir UPDATE para usuários autenticados
CREATE POLICY "storage_authenticated_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (true);

-- Permitir DELETE para usuários autenticados
CREATE POLICY "storage_authenticated_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (true);

-- ============================================
-- 3. CORRIGIR RLS DA TABELA church_hosting_config
-- ============================================

-- Remover políticas antigas
DROP POLICY IF EXISTS "Users can view their church hosting config" ON public.church_hosting_config;
DROP POLICY IF EXISTS "Users can insert their church hosting config" ON public.church_hosting_config;
DROP POLICY IF EXISTS "Users can update their church hosting config" ON public.church_hosting_config;

-- Criar políticas permissivas
CREATE POLICY "church_hosting_config_select"
ON public.church_hosting_config FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "church_hosting_config_insert"
ON public.church_hosting_config FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "church_hosting_config_update"
ON public.church_hosting_config FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "church_hosting_config_delete"
ON public.church_hosting_config FOR DELETE
TO authenticated
USING (true);

-- ============================================
-- 4. CORRIGIR RLS DA TABELA church_accommodations
-- ============================================

DROP POLICY IF EXISTS "Users can view accommodations" ON public.church_accommodations;
DROP POLICY IF EXISTS "Users can insert accommodations" ON public.church_accommodations;
DROP POLICY IF EXISTS "Users can update accommodations" ON public.church_accommodations;
DROP POLICY IF EXISTS "Users can delete accommodations" ON public.church_accommodations;

CREATE POLICY "church_accommodations_select"
ON public.church_accommodations FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "church_accommodations_insert"
ON public.church_accommodations FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "church_accommodations_update"
ON public.church_accommodations FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "church_accommodations_delete"
ON public.church_accommodations FOR DELETE
TO authenticated
USING (true);

-- ============================================
-- 5. CORRIGIR RLS DA TABELA church_services
-- ============================================

DROP POLICY IF EXISTS "Users can view services" ON public.church_services;
DROP POLICY IF EXISTS "Users can insert services" ON public.church_services;
DROP POLICY IF EXISTS "Users can update services" ON public.church_services;
DROP POLICY IF EXISTS "Users can delete services" ON public.church_services;

CREATE POLICY "church_services_select"
ON public.church_services FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "church_services_insert"
ON public.church_services FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "church_services_update"
ON public.church_services FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "church_services_delete"
ON public.church_services FOR DELETE
TO authenticated
USING (true);

-- ============================================
-- 6. VERIFICAR POLÍTICAS CRIADAS
-- ============================================

-- Verificar políticas do Storage
SELECT schemaname, tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects'
ORDER BY policyname;

-- Verificar políticas das tabelas
SELECT schemaname, tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename IN ('church_hosting_config', 'church_accommodations', 'church_services')
ORDER BY tablename, policyname;
