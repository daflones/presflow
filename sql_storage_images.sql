-- ============================================
-- SQL para Suporte a Imagens no Supabase Storage
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- As colunas de imagens já existem no schema anterior como JSONB
-- Formato: [{"url": "https://...", "descricao": "..."}]
-- 
-- Tabelas que já possuem campo de imagens:
-- - church_services.imagens
-- - church_hosting_config.imagens  
-- - church_accommodations.fotos

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

-- Políticas RLS para os buckets (executar após criar os buckets)
-- Substitua 'BUCKET_NAME' pelo nome real do bucket

-- Política para permitir upload por usuários autenticados
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id IN ('church-images', 'services-images', 'hosting-images', 'spaces-images')
);

-- Política para permitir leitura pública
CREATE POLICY "Public can view images"
ON storage.objects FOR SELECT
TO public
USING (
  bucket_id IN ('church-images', 'services-images', 'hosting-images', 'spaces-images')
);

-- Política para permitir atualização por usuários autenticados
CREATE POLICY "Authenticated users can update their images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id IN ('church-images', 'services-images', 'hosting-images', 'spaces-images')
);

-- Política para permitir deleção por usuários autenticados
CREATE POLICY "Authenticated users can delete their images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id IN ('church-images', 'services-images', 'hosting-images', 'spaces-images')
);
