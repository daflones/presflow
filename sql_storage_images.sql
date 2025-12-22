-- ============================================
-- SQL para Suporte a Imagens no Supabase Storage
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- ============================================
-- CRIAR BUCKETS NO SUPABASE STORAGE
-- ============================================

-- Bucket para imagens gerais da igreja
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('church-images', 'church-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET public = true;

-- Bucket para imagens de serviços (batismos, casamentos, etc.)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('services-images', 'services-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET public = true;

-- Bucket para imagens de hospedagem e acomodações
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('hosting-images', 'hosting-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET public = true;

-- Bucket para imagens dos espaços
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('spaces-images', 'spaces-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET public = true;

-- ============================================
-- ADICIONAR COLUNA DE IMAGENS NA TABELA ai_configs
-- Para imagens de batismos, casamentos, espaços da igreja
-- ============================================

-- Imagens de Batismos
ALTER TABLE public.ai_configs 
ADD COLUMN IF NOT EXISTS imagens_batismos JSONB DEFAULT '[]'::jsonb;

-- Imagens de Casamentos
ALTER TABLE public.ai_configs 
ADD COLUMN IF NOT EXISTS imagens_casamentos JSONB DEFAULT '[]'::jsonb;

-- Imagens dos Espaços da Igreja
ALTER TABLE public.ai_configs 
ADD COLUMN IF NOT EXISTS imagens_espacos JSONB DEFAULT '[]'::jsonb;

-- Imagens Gerais da Igreja (fachada, interior, etc.)
ALTER TABLE public.ai_configs 
ADD COLUMN IF NOT EXISTS imagens_igreja JSONB DEFAULT '[]'::jsonb;

-- Comentários
COMMENT ON COLUMN public.ai_configs.imagens_batismos IS 'Fotos de batismos realizados na igreja - formato: [{"url": "...", "descricao": "..."}]';
COMMENT ON COLUMN public.ai_configs.imagens_casamentos IS 'Fotos de casamentos realizados na igreja - formato: [{"url": "...", "descricao": "..."}]';
COMMENT ON COLUMN public.ai_configs.imagens_espacos IS 'Fotos dos espaços disponíveis (capelas, salões, jardins) - formato: [{"url": "...", "descricao": "..."}]';
COMMENT ON COLUMN public.ai_configs.imagens_igreja IS 'Fotos gerais da igreja (fachada, interior, altar) - formato: [{"url": "...", "descricao": "..."}]';

-- ============================================
-- CONFIGURAÇÃO DOS BUCKETS NO SUPABASE STORAGE
-- ============================================
-- 
-- BUCKETS NECESSÁRIOS (criar manualmente no Supabase Dashboard > Storage):
--
-- 1. church-images
--    - Imagens gerais da igreja (fachada, interior, altar)
--    - Público: SIM (para a IA poder enviar aos clientes)
--
-- 2. services-images  
--    - Imagens de serviços (batismos, casamentos, etc.)
--    - Público: SIM
--
-- 3. hosting-images
--    - Imagens de hospedagem e acomodações
--    - Público: SIM
--
-- 4. spaces-images
--    - Imagens dos espaços (capelas, salões, jardins)
--    - Público: SIM
--
-- ============================================

-- ============================================
-- POLÍTICAS RLS PARA OS BUCKETS
-- ============================================
-- As políticas já existem, então não precisa executar novamente
-- Se precisar recriar, execute os DROP primeiro e depois os CREATE

-- Para verificar as políticas existentes:
-- SELECT * FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects';

-- Se as políticas não existirem, execute:
/*
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;

CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id IN ('church-images', 'services-images', 'hosting-images', 'spaces-images')
);

CREATE POLICY "Allow public reads"
ON storage.objects FOR SELECT
TO public
USING (
  bucket_id IN ('church-images', 'services-images', 'hosting-images', 'spaces-images')
);

CREATE POLICY "Allow authenticated updates"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id IN ('church-images', 'services-images', 'hosting-images', 'spaces-images')
);

CREATE POLICY "Allow authenticated deletes"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id IN ('church-images', 'services-images', 'hosting-images', 'spaces-images')
);
*/
