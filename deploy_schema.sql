-- ============================================
-- DEPLOY COMPLETO DO SCHEMA PRESTFLOW
-- Execute este arquivo INTEIRO no Supabase SQL Editor
-- ============================================

-- 1. Dropar objetos existentes (se houver)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.generate_slug(text) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_church_id() CASCADE;
DROP FUNCTION IF EXISTS public.is_church_owner(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

-- Dropar tabelas na ordem correta (respeitando foreign keys)
DROP TABLE IF EXISTS public.activity_logs CASCADE;
DROP TABLE IF EXISTS public.notices CASCADE;
DROP TABLE IF EXISTS public.files CASCADE;
DROP TABLE IF EXISTS public.ai_prompts CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.conversations CASCADE;
DROP TABLE IF EXISTS public.whatsapp_instances CASCADE;
DROP TABLE IF EXISTS public.clients CASCADE;
DROP TABLE IF EXISTS public.calendar_events CASCADE;
DROP TABLE IF EXISTS public.ai_configs CASCADE;
DROP TABLE IF EXISTS public.churches CASCADE;

-- 2. Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 3. Criar tabela churches
CREATE TABLE public.churches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  cnpj VARCHAR(18),
  email VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(2),
  zip_code VARCHAR(10),
  logo_url TEXT,
  website VARCHAR(255),
  description TEXT,
  timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo',
  language VARCHAR(10) DEFAULT 'pt-BR',
  plan VARCHAR(50) DEFAULT 'free',
  plan_expires_at TIMESTAMPTZ,
  instance VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

CREATE INDEX idx_churches_slug ON public.churches(slug);
CREATE INDEX idx_churches_owner_id ON public.churches(owner_id);
CREATE INDEX idx_churches_is_active ON public.churches(is_active);
CREATE INDEX idx_churches_instance ON public.churches(instance);

-- 4. Criar função generate_slug
CREATE OR REPLACE FUNCTION public.generate_slug(input_name TEXT)
RETURNS TEXT AS $$
DECLARE
  result TEXT;
BEGIN
  result := translate(input_name, 'áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ', 'aaaaaeeeeiiiioooooouuuucAAAAAEEEEIIIIOOOOOUUUUC');
  result := regexp_replace(result, '[^a-zA-Z0-9 -]', '', 'g');
  result := regexp_replace(result, ' +', '-', 'g');
  result := lower(result);
  result := regexp_replace(result, '-+', '-', 'g');
  result := trim(both '-' from result);
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 5. Criar função handle_new_user (TRIGGER)
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
  
  -- Gerar slug base
  base_slug := public.generate_slug(church_name);
  final_slug := base_slug;
  
  -- Garantir slug único
  WHILE EXISTS (SELECT 1 FROM public.churches WHERE slug = final_slug) LOOP
    slug_counter := slug_counter + 1;
    final_slug := base_slug || '-' || slug_counter;
  END LOOP;
  
  -- Criar a igreja
  INSERT INTO public.churches (owner_id, name, slug, email, plan, is_active)
  VALUES (NEW.id, church_name, final_slug, NEW.email, 'free', true);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Criar trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Habilitar RLS na tabela churches
ALTER TABLE public.churches ENABLE ROW LEVEL SECURITY;

-- 8. Criar políticas RLS para churches
CREATE POLICY "Users can view their own church" ON public.churches
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Users can update their own church" ON public.churches
  FOR UPDATE USING (owner_id = auth.uid());

-- 9. Criar função auxiliar get_user_church_id
CREATE OR REPLACE FUNCTION public.get_user_church_id()
RETURNS UUID AS $$
  SELECT id FROM public.churches WHERE owner_id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- 10. Criar função auxiliar is_church_owner
CREATE OR REPLACE FUNCTION public.is_church_owner(p_church_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.churches 
    WHERE id = p_church_id 
    AND owner_id = auth.uid()
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- 11. Criar função update_updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 12. Criar trigger para updated_at
CREATE TRIGGER update_churches_updated_at 
  BEFORE UPDATE ON public.churches 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- SUCESSO! Schema básico criado.
-- Agora você pode cadastrar uma igreja.
-- ============================================
