-- Adicionar colunas de redes sociais na tabela churches
-- Execute este script no Supabase SQL Editor

-- Adicionar coluna instagram
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'churches' AND column_name = 'instagram'
    ) THEN
        ALTER TABLE churches ADD COLUMN instagram VARCHAR(255);
        RAISE NOTICE 'Coluna instagram adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna instagram já existe';
    END IF;
END $$;

-- Adicionar coluna facebook
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'churches' AND column_name = 'facebook'
    ) THEN
        ALTER TABLE churches ADD COLUMN facebook VARCHAR(255);
        RAISE NOTICE 'Coluna facebook adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna facebook já existe';
    END IF;
END $$;

-- Verificar estrutura da tabela
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'churches'
ORDER BY ordinal_position;
