-- Adicionar colunas instance e instance_connected_at na tabela churches
-- Execute este script no Supabase SQL Editor

-- Adicionar coluna instance (nome da instância WhatsApp)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'churches' AND column_name = 'instance'
    ) THEN
        ALTER TABLE churches ADD COLUMN instance TEXT;
        RAISE NOTICE 'Coluna instance adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna instance já existe';
    END IF;
END $$;

-- Adicionar coluna instance_connected_at (data/hora da conexão)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'churches' AND column_name = 'instance_connected_at'
    ) THEN
        ALTER TABLE churches ADD COLUMN instance_connected_at TIMESTAMPTZ;
        RAISE NOTICE 'Coluna instance_connected_at adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna instance_connected_at já existe';
    END IF;
END $$;

-- Verificar a estrutura da tabela
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'churches'
ORDER BY ordinal_position;
