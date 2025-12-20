-- Adicionar colunas ultima_mensagem, origem e instancia na tabela clients
-- Execute este script no Supabase SQL Editor

-- Adicionar coluna ultima_mensagem (timestamp da última mensagem recebida)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' AND column_name = 'ultima_mensagem'
    ) THEN
        ALTER TABLE clients ADD COLUMN ultima_mensagem TIMESTAMPTZ;
        RAISE NOTICE 'Coluna ultima_mensagem adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna ultima_mensagem já existe';
    END IF;
END $$;

-- Adicionar coluna origem (de onde veio o cliente: whatsapp, instagram, etc)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' AND column_name = 'origem'
    ) THEN
        ALTER TABLE clients ADD COLUMN origem VARCHAR(50);
        RAISE NOTICE 'Coluna origem adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna origem já existe';
    END IF;
END $$;

-- Adicionar coluna instancia (nome da instância WhatsApp associada)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' AND column_name = 'instancia'
    ) THEN
        ALTER TABLE clients ADD COLUMN instancia VARCHAR(100);
        RAISE NOTICE 'Coluna instancia adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna instancia já existe';
    END IF;
END $$;

-- Verificar a estrutura da tabela clients
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'clients'
ORDER BY ordinal_position;
