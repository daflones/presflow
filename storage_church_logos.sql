-- Configurar políticas de Storage para o bucket church-logos
-- Execute este script no Supabase SQL Editor

-- IMPORTANTE: Primeiro crie o bucket no Supabase Dashboard:
-- Storage > New Bucket > Nome: church-logos > Public bucket: true

-- Remover políticas existentes (caso existam)
DROP POLICY IF EXISTS "Allow authenticated uploads church-logos" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read church-logos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete church-logos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated update church-logos" ON storage.objects;

-- Política para permitir upload de logos por usuários autenticados
CREATE POLICY "Allow authenticated uploads church-logos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'church-logos');

-- Política para permitir leitura pública das logos
CREATE POLICY "Allow public read church-logos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'church-logos');

-- Política para permitir atualização de logos por usuários autenticados
CREATE POLICY "Allow authenticated update church-logos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'church-logos');

-- Política para permitir deleção de logos por usuários autenticados
CREATE POLICY "Allow authenticated delete church-logos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'church-logos');
