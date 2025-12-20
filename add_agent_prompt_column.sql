-- Adicionar coluna agent_prompt na tabela ai_configs
-- Execute este script no Supabase SQL Editor

-- Adicionar coluna agent_prompt (prompt do agente de IA)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ai_configs' AND column_name = 'agent_prompt'
    ) THEN
        ALTER TABLE ai_configs ADD COLUMN agent_prompt TEXT;
        RAISE NOTICE 'Coluna agent_prompt adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna agent_prompt já existe';
    END IF;
END $$;

-- Verificar a estrutura da tabela ai_configs
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'ai_configs'
ORDER BY ordinal_position;
