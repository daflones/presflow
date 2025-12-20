-- Script para definir a role 'manager' para um usuário
-- Execute este script no Supabase SQL Editor

-- IMPORTANTE: Substitua 'EMAIL_DO_USUARIO' pelo email do usuário que será manager

-- Opção 1: Atualizar via raw_user_meta_data (recomendado)
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "manager"}'::jsonb
WHERE email = 'EMAIL_DO_USUARIO';

-- Opção 2: Atualizar via raw_app_meta_data (alternativa)
-- UPDATE auth.users
-- SET raw_app_meta_data = raw_app_meta_data || '{"role": "manager"}'::jsonb
-- WHERE email = 'EMAIL_DO_USUARIO';

-- Verificar se a atualização foi feita
SELECT id, email, raw_user_meta_data, raw_app_meta_data
FROM auth.users
WHERE email = 'EMAIL_DO_USUARIO';

-- =====================================================
-- EXEMPLO: Para definir o usuário admin@exemplo.com como manager:
-- 
-- UPDATE auth.users
-- SET raw_user_meta_data = raw_user_meta_data || '{"role": "manager"}'::jsonb
-- WHERE email = 'admin@exemplo.com';
-- =====================================================

-- Para REMOVER a role de manager:
-- UPDATE auth.users
-- SET raw_user_meta_data = raw_user_meta_data - 'role'
-- WHERE email = 'EMAIL_DO_USUARIO';
