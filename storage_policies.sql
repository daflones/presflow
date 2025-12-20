-- Configurar políticas de Storage para o bucket arquivos-ia
-- Execute este script no Supabase SQL Editor

-- Remover políticas existentes (caso existam)
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read arquivos-ia" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete arquivos-ia" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated update arquivos-ia" ON storage.objects;

-- Política para permitir upload de arquivos autenticados
CREATE POLICY "Allow authenticated uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'arquivos-ia');

-- Política para permitir leitura pública dos arquivos
CREATE POLICY "Allow public read arquivos-ia"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'arquivos-ia');

-- Política para permitir atualização de arquivos autenticados
CREATE POLICY "Allow authenticated update arquivos-ia"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'arquivos-ia');

-- Política para permitir deleção de arquivos autenticados
CREATE POLICY "Allow authenticated delete arquivos-ia"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'arquivos-ia');
