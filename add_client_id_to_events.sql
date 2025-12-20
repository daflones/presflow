-- Adicionar coluna cliente_id na tabela calendar_events
-- Execute este script no Supabase SQL Editor

-- Adicionar coluna cliente_id com foreign key para clients
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'calendar_events' AND column_name = 'cliente_id'
    ) THEN
        ALTER TABLE calendar_events ADD COLUMN cliente_id UUID REFERENCES clients(id) ON DELETE SET NULL;
        RAISE NOTICE 'Coluna cliente_id adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna cliente_id já existe';
    END IF;
END $$;

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_calendar_events_cliente_id ON calendar_events(cliente_id);

-- Verificar estrutura da tabela
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'calendar_events'
ORDER BY ordinal_position;
