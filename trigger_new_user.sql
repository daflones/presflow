-- ============================================
-- TRIGGER PARA CRIAR IGREJA AUTOMATICAMENTE (SEM TABELA USERS)
-- Execute este SQL no Supabase SQL Editor APÓS executar supabase_schema.sql
-- ============================================

-- Este trigger já está incluído no supabase_schema.sql
-- Use este arquivo apenas se precisar recriar o trigger separadamente

-- 1. Dropar trigger e função existente (se houver)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Recriar a função (já está no schema principal)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  church_name TEXT;
  base_slug TEXT;
  final_slug TEXT;
  slug_counter INTEGER := 0;
BEGIN
  -- Extrair nome da igreja do metadata
  church_name := NEW.raw_user_meta_data->>'church_name';
  
  -- Se não tiver church_name, não criar igreja
  IF church_name IS NULL OR church_name = '' THEN
    RETURN NEW;
  END IF;
  
  -- Gerar slug base usando a função generate_slug
  base_slug := generate_slug(church_name);
  final_slug := base_slug;
  
  -- Garantir slug único
  WHILE EXISTS (SELECT 1 FROM churches WHERE slug = final_slug) LOOP
    slug_counter := slug_counter + 1;
    final_slug := base_slug || '-' || slug_counter;
  END LOOP;
  
  -- Criar a igreja vinculada ao owner_id (auth.users.id)
  INSERT INTO churches (owner_id, name, slug, email, plan, is_active)
  VALUES (NEW.id, church_name, final_slug, NEW.email, 'free', true);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Recriar o trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- NOTA: As políticas RLS já estão definidas no supabase_schema.sql
-- ============================================
