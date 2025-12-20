-- Adicionar novas colunas na tabela ai_configs
-- Execute este script no Supabase SQL Editor

-- Adicionar coluna informacoes_adicionais (texto longo para informações extras da IA)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ai_configs' AND column_name = 'informacoes_adicionais'
    ) THEN
        ALTER TABLE ai_configs ADD COLUMN informacoes_adicionais TEXT;
        RAISE NOTICE 'Coluna informacoes_adicionais adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna informacoes_adicionais já existe';
    END IF;
END $$;

-- Adicionar coluna perguntas_frequentes (texto longo para FAQ)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ai_configs' AND column_name = 'perguntas_frequentes'
    ) THEN
        ALTER TABLE ai_configs ADD COLUMN perguntas_frequentes TEXT;
        RAISE NOTICE 'Coluna perguntas_frequentes adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna perguntas_frequentes já existe';
    END IF;
END $$;

-- Adicionar coluna principais_eventos (texto longo para eventos principais)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ai_configs' AND column_name = 'principais_eventos'
    ) THEN
        ALTER TABLE ai_configs ADD COLUMN principais_eventos TEXT;
        RAISE NOTICE 'Coluna principais_eventos adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna principais_eventos já existe';
    END IF;
END $$;

-- Adicionar coluna menu_principal (texto para conteúdo do menu)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ai_configs' AND column_name = 'menu_principal'
    ) THEN
        ALTER TABLE ai_configs ADD COLUMN menu_principal TEXT;
        RAISE NOTICE 'Coluna menu_principal adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna menu_principal já existe';
    END IF;
END $$;

-- Adicionar coluna localizacao_igreja (texto para capelas e santuários)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ai_configs' AND column_name = 'localizacao_igreja'
    ) THEN
        ALTER TABLE ai_configs ADD COLUMN localizacao_igreja TEXT;
        RAISE NOTICE 'Coluna localizacao_igreja adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna localizacao_igreja já existe';
    END IF;
END $$;

-- Adicionar coluna informacao_historica (texto para história da igreja)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ai_configs' AND column_name = 'informacao_historica'
    ) THEN
        ALTER TABLE ai_configs ADD COLUMN informacao_historica TEXT;
        RAISE NOTICE 'Coluna informacao_historica adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna informacao_historica já existe';
    END IF;
END $$;

-- Adicionar coluna documentacao_necessaria (texto longo para documentação)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ai_configs' AND column_name = 'documentacao_necessaria'
    ) THEN
        ALTER TABLE ai_configs ADD COLUMN documentacao_necessaria TEXT;
        RAISE NOTICE 'Coluna documentacao_necessaria adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna documentacao_necessaria já existe';
    END IF;
END $$;

-- Verificar estrutura da tabela
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'ai_configs'
ORDER BY ordinal_position;
