-- Criar tabela arquivos_ia para armazenar documentos disponíveis para a IA
-- Execute este script no Supabase SQL Editor

CREATE TABLE IF NOT EXISTS arquivos_ia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  
  -- Documento
  nome VARCHAR(255) NOT NULL,
  nome_original VARCHAR(255),
  categoria VARCHAR(100),
  subcategoria VARCHAR(100),
  descricao TEXT,
  
  -- Status e Disponibilidade
  status VARCHAR(50) DEFAULT 'ativo', -- ativo, inativo, arquivado
  disponivel_ia BOOLEAN DEFAULT true,
  processado_ia BOOLEAN DEFAULT false,
  
  -- Instruções de Uso
  instrucoes_ia TEXT,
  contexto_uso TEXT,
  palavras_chave TEXT[], -- Array de palavras-chave
  prioridade INTEGER DEFAULT 0,
  
  -- URL e Armazenamento
  url TEXT,
  bucket_name VARCHAR(100),
  caminho_storage TEXT,
  
  -- Detalhes Técnicos
  tipo_mime VARCHAR(100),
  extensao VARCHAR(20),
  tamanho BIGINT, -- em bytes
  visibilidade VARCHAR(50) DEFAULT 'privado', -- privado, publico
  versao INTEGER DEFAULT 1,
  
  -- Estatísticas
  visualizacoes INTEGER DEFAULT 0,
  downloads INTEGER DEFAULT 0,
  ultima_utilizacao_ia TIMESTAMPTZ,
  
  -- IDs Relacionados (opcionais)
  cliente_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  produto_id UUID,
  proposta_id UUID,
  contrato_id UUID,
  arquivo_pai_id UUID REFERENCES arquivos_ia(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_arquivos_ia_church_id ON arquivos_ia(church_id);
CREATE INDEX IF NOT EXISTS idx_arquivos_ia_status ON arquivos_ia(status);
CREATE INDEX IF NOT EXISTS idx_arquivos_ia_disponivel_ia ON arquivos_ia(disponivel_ia);
CREATE INDEX IF NOT EXISTS idx_arquivos_ia_categoria ON arquivos_ia(categoria);

-- RLS (Row Level Security)
ALTER TABLE arquivos_ia ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes (caso existam)
DROP POLICY IF EXISTS "Users can view own church files" ON arquivos_ia;
DROP POLICY IF EXISTS "Users can insert own church files" ON arquivos_ia;
DROP POLICY IF EXISTS "Users can update own church files" ON arquivos_ia;
DROP POLICY IF EXISTS "Users can delete own church files" ON arquivos_ia;

-- Política para permitir que usuários vejam apenas arquivos da sua igreja
CREATE POLICY "Users can view own church files" ON arquivos_ia
  FOR SELECT
  USING (
    church_id IN (
      SELECT id FROM churches WHERE owner_id = auth.uid()
    )
  );

-- Política para permitir que usuários insiram arquivos na sua igreja
CREATE POLICY "Users can insert own church files" ON arquivos_ia
  FOR INSERT
  WITH CHECK (
    church_id IN (
      SELECT id FROM churches WHERE owner_id = auth.uid()
    )
  );

-- Política para permitir que usuários atualizem arquivos da sua igreja
CREATE POLICY "Users can update own church files" ON arquivos_ia
  FOR UPDATE
  USING (
    church_id IN (
      SELECT id FROM churches WHERE owner_id = auth.uid()
    )
  );

-- Política para permitir que usuários deletem arquivos da sua igreja
CREATE POLICY "Users can delete own church files" ON arquivos_ia
  FOR DELETE
  USING (
    church_id IN (
      SELECT id FROM churches WHERE owner_id = auth.uid()
    )
  );

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_arquivos_ia_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_arquivos_ia_updated_at ON arquivos_ia;
CREATE TRIGGER trigger_arquivos_ia_updated_at
  BEFORE UPDATE ON arquivos_ia
  FOR EACH ROW
  EXECUTE FUNCTION update_arquivos_ia_updated_at();

-- Verificar estrutura da tabela
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'arquivos_ia'
ORDER BY ordinal_position;

-- =====================================================
-- IMPORTANTE: Criar bucket no Supabase Storage
-- =====================================================
-- Vá em Storage > New Bucket e crie um bucket chamado "arquivos-ia"
-- Configurações recomendadas:
--   - Name: arquivos-ia
--   - Public bucket: true (para que a IA possa acessar os arquivos)
--   - File size limit: 50MB (ou conforme necessário)
--   - Allowed MIME types: deixe vazio para permitir todos
--
-- Depois de criar o bucket, adicione a seguinte política de Storage:
-- 
-- Policy name: "Allow authenticated uploads"
-- Allowed operation: INSERT
-- Policy definition:
--   (bucket_id = 'arquivos-ia'::text) AND (auth.role() = 'authenticated'::text)
--
-- Policy name: "Allow public read"
-- Allowed operation: SELECT
-- Policy definition:
--   bucket_id = 'arquivos-ia'::text
--
-- Policy name: "Allow authenticated delete"
-- Allowed operation: DELETE
-- Policy definition:
--   (bucket_id = 'arquivos-ia'::text) AND (auth.role() = 'authenticated'::text)
-- =====================================================
