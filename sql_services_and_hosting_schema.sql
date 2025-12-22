-- ============================================
-- SCHEMA COMPLETO: SERVIÇOS ESTRUTURADOS E HOSPEDAGEM
-- Execute este SQL no Supabase SQL Editor
-- ============================================

-- ============================================
-- PARTE 1: SERVIÇOS ESTRUTURADOS
-- Cada serviço da igreja é um objeto completo
-- ============================================

CREATE TABLE IF NOT EXISTS public.church_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  
  -- Identificação do Serviço
  nome VARCHAR NOT NULL,
  slug VARCHAR NOT NULL, -- casamento, batismo, fotos, etc.
  tipo VARCHAR NOT NULL DEFAULT 'cerimonia', -- cerimonia, sacramento, evento, servico, outro
  ativo BOOLEAN DEFAULT true,
  ordem INTEGER DEFAULT 0, -- para ordenação na exibição
  
  -- Descrição Institucional
  descricao_curta TEXT, -- para listagens
  descricao_completa TEXT, -- para detalhamento
  icone VARCHAR, -- nome do ícone (lucide)
  
  -- Etapas do Processo (array de objetos)
  etapas JSONB DEFAULT '[]'::jsonb,
  -- Formato: [{"ordem": 1, "titulo": "Contato inicial", "descricao": "...", "duracao_dias": 0}, ...]
  
  -- Disponibilidade
  dias_permitidos JSONB DEFAULT '["monday","tuesday","wednesday","thursday","friday","saturday","sunday"]'::jsonb,
  horarios_permitidos JSONB DEFAULT '[]'::jsonb,
  -- Formato: [{"inicio": "08:00", "fim": "18:00"}, ...]
  
  -- Documentos Exigidos
  documentos_exigidos JSONB DEFAULT '[]'::jsonb,
  -- Formato: [{"nome": "Certidão de Batismo", "obrigatorio": true, "descricao": "..."}, ...]
  
  -- Valores e Pagamento
  valor DECIMAL(10,2),
  valor_variavel BOOLEAN DEFAULT false, -- se o valor pode variar
  valor_minimo DECIMAL(10,2),
  valor_maximo DECIMAL(10,2),
  forma_pagamento JSONB DEFAULT '["pix", "dinheiro", "transferencia"]'::jsonb,
  exige_sinal BOOLEAN DEFAULT false,
  valor_sinal DECIMAL(10,2),
  percentual_sinal INTEGER, -- ex: 30 para 30%
  prazo_pagamento_sinal INTEGER, -- dias antes do evento
  
  -- Regras Específicas
  regras TEXT,
  restricoes TEXT, -- ex: "Não realizamos durante a Quaresma"
  prazo_minimo_agendamento INTEGER DEFAULT 30, -- dias de antecedência mínima
  prazo_maximo_agendamento INTEGER DEFAULT 365, -- dias de antecedência máxima
  duracao_media_minutos INTEGER, -- duração média do serviço
  capacidade_maxima INTEGER, -- número máximo de pessoas
  
  -- Automação IA
  usa_agendamento BOOLEAN DEFAULT false,
  usa_tool_verificar_agendamento BOOLEAN DEFAULT false,
  usa_tool_realizar_agendamento BOOLEAN DEFAULT false,
  precisa_confirmacao_humana BOOLEAN DEFAULT true,
  
  -- Mensagens Personalizadas
  mensagem_confirmacao TEXT,
  mensagem_indisponibilidade TEXT,
  mensagem_pos_agendamento TEXT,
  
  -- Imagens do Serviço (fotos de cerimônias, locais, etc.)
  imagens JSONB DEFAULT '[]'::jsonb,
  -- Formato: [{"url": "https://...", "descricao": "Foto do altar"}]
  
  -- Metadados
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(church_id, slug)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_church_services_church_id ON public.church_services(church_id);
CREATE INDEX IF NOT EXISTS idx_church_services_slug ON public.church_services(slug);
CREATE INDEX IF NOT EXISTS idx_church_services_ativo ON public.church_services(ativo);

-- Comentários
COMMENT ON TABLE public.church_services IS 'Serviços estruturados oferecidos pela igreja (casamento, batismo, etc.)';
COMMENT ON COLUMN public.church_services.etapas IS 'Array JSON com etapas do processo do serviço';
COMMENT ON COLUMN public.church_services.documentos_exigidos IS 'Array JSON com documentos necessários';
COMMENT ON COLUMN public.church_services.usa_tool_verificar_agendamento IS 'Se a IA pode usar a tool de verificar disponibilidade';
COMMENT ON COLUMN public.church_services.usa_tool_realizar_agendamento IS 'Se a IA pode usar a tool de realizar agendamento';

-- ============================================
-- PARTE 2: CONFIGURAÇÃO GERAL DE HOSPEDAGEM
-- Nível institucional - se existe e como funciona
-- ============================================

CREATE TABLE IF NOT EXISTS public.church_hosting_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID NOT NULL UNIQUE REFERENCES public.churches(id) ON DELETE CASCADE,
  
  -- Status Geral
  hospedagem_ativa BOOLEAN DEFAULT false,
  
  -- Descrição Institucional
  descricao TEXT,
  publico_permitido JSONB DEFAULT '["romeiros", "retiros", "eventos"]'::jsonb,
  -- Opções: romeiros, retiros, clero, turistas, eventos, grupos, familias
  
  -- Restrições
  idade_minima INTEGER DEFAULT 0,
  permite_criancas BOOLEAN DEFAULT true,
  permite_animais BOOLEAN DEFAULT false,
  acessibilidade TEXT, -- descrição de acessibilidade
  
  -- Regras de Funcionamento
  dias_funcionamento JSONB DEFAULT '["monday","tuesday","wednesday","thursday","friday","saturday","sunday"]'::jsonb,
  horario_checkin VARCHAR DEFAULT '14:00',
  horario_checkout VARCHAR DEFAULT '12:00',
  estadia_minima INTEGER DEFAULT 1, -- noites
  estadia_maxima INTEGER DEFAULT 30, -- noites
  permite_estender_estadia BOOLEAN DEFAULT true,
  
  -- Bloqueios
  datas_bloqueadas JSONB DEFAULT '[]'::jsonb,
  -- Formato: [{"inicio": "2025-03-05", "fim": "2025-04-20", "motivo": "Quaresma"}]
  bloqueio_por_evento BOOLEAN DEFAULT true, -- bloqueia automaticamente em eventos
  
  -- Valores e Pagamento
  valor_por_noite DECIMAL(10,2),
  valor_por_pessoa BOOLEAN DEFAULT false, -- se o valor é por pessoa ou por quarto
  taxa_limpeza DECIMAL(10,2),
  exige_sinal BOOLEAN DEFAULT false,
  valor_sinal DECIMAL(10,2),
  percentual_sinal INTEGER,
  prazo_pagamento_sinal INTEGER, -- dias antes
  politica_cancelamento TEXT,
  formas_pagamento JSONB DEFAULT '["pix", "dinheiro", "transferencia"]'::jsonb,
  
  -- Dados do Hóspede
  dados_obrigatorios JSONB DEFAULT '["nome", "cpf", "telefone", "email"]'::jsonb,
  -- Opções: nome, cpf, rg, data_nascimento, telefone, email, endereco, profissao
  exige_documento BOOLEAN DEFAULT true,
  tipos_documento JSONB DEFAULT '["rg", "cnh", "passaporte"]'::jsonb,
  ficha_hospede_link TEXT, -- link para FNRH ou similar
  envio_documentos_por JSONB DEFAULT '["upload", "email"]'::jsonb,
  
  -- Automação IA
  ia_nivel_automacao VARCHAR DEFAULT 'informar',
  -- Opções: informar, coletar_dados, pre_reservar, confirmar_reserva
  usa_agendamento_ia BOOLEAN DEFAULT false,
  precisa_confirmacao_humana BOOLEAN DEFAULT true,
  
  -- Mensagens
  mensagem_confirmacao_reserva TEXT,
  mensagem_indisponibilidade TEXT,
  
  -- Textos Institucionais
  regras_hospedagem TEXT,
  termos_responsabilidade TEXT,
  orientacoes_hospede TEXT,
  politica_silencio TEXT,
  informacoes_gerais TEXT,
  
  -- Imagens da Hospedagem (fotos dos espaços, áreas comuns, etc.)
  imagens JSONB DEFAULT '[]'::jsonb,
  -- Formato: [{"url": "https://...", "descricao": "Área comum"}]
  
  -- Metadados
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Comentários
COMMENT ON TABLE public.church_hosting_config IS 'Configuração geral de hospedagem da igreja';
COMMENT ON COLUMN public.church_hosting_config.ia_nivel_automacao IS 'Nível de automação: informar, coletar_dados, pre_reservar, confirmar_reserva';

-- ============================================
-- PARTE 3: TIPOS DE ACOMODAÇÃO
-- Estrutura física real dos quartos/dormitórios
-- ============================================

CREATE TABLE IF NOT EXISTS public.church_accommodations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  
  -- Identificação
  nome VARCHAR NOT NULL,
  codigo VARCHAR, -- ex: Q01, SUITE-A
  tipo VARCHAR NOT NULL DEFAULT 'individual',
  -- Opções: individual, duplo, triplo, quadruplo, coletivo, dormitorio, suite, apartamento
  
  -- Capacidade
  capacidade_maxima INTEGER NOT NULL DEFAULT 1,
  quantidade_disponivel INTEGER NOT NULL DEFAULT 1, -- quantos desse tipo existem
  
  -- Descrição
  descricao TEXT,
  
  -- Comodidades
  possui_banheiro BOOLEAN DEFAULT false,
  possui_banheiro_privativo BOOLEAN DEFAULT false,
  possui_roupa_cama BOOLEAN DEFAULT true,
  possui_toalhas BOOLEAN DEFAULT false,
  possui_ar_condicionado BOOLEAN DEFAULT false,
  possui_ventilador BOOLEAN DEFAULT false,
  possui_tv BOOLEAN DEFAULT false,
  possui_wifi BOOLEAN DEFAULT true,
  possui_frigobar BOOLEAN DEFAULT false,
  comodidades_extras JSONB DEFAULT '[]'::jsonb,
  -- Formato: ["armário", "mesa de trabalho", "varanda"]
  
  -- Valores (pode sobrescrever o valor geral)
  valor_noite_override DECIMAL(10,2), -- se diferente do padrão
  
  -- Fotos
  fotos JSONB DEFAULT '[]'::jsonb,
  -- Formato: [{"url": "...", "descricao": "Vista do quarto"}]
  
  -- Status
  ativo BOOLEAN DEFAULT true,
  em_manutencao BOOLEAN DEFAULT false,
  
  -- Metadados
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_church_accommodations_church_id ON public.church_accommodations(church_id);
CREATE INDEX IF NOT EXISTS idx_church_accommodations_tipo ON public.church_accommodations(tipo);
CREATE INDEX IF NOT EXISTS idx_church_accommodations_ativo ON public.church_accommodations(ativo);

-- Comentários
COMMENT ON TABLE public.church_accommodations IS 'Tipos de acomodação disponíveis para hospedagem';

-- ============================================
-- PARTE 4: RESERVAS DE HOSPEDAGEM
-- Histórico e gestão de reservas
-- ============================================

CREATE TABLE IF NOT EXISTS public.hosting_reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  accommodation_id UUID REFERENCES public.church_accommodations(id),
  client_id UUID REFERENCES public.clients(id),
  
  -- Datas
  data_checkin DATE NOT NULL,
  data_checkout DATE NOT NULL,
  
  -- Hóspede Principal
  hospede_nome VARCHAR NOT NULL,
  hospede_cpf VARCHAR,
  hospede_rg VARCHAR,
  hospede_telefone VARCHAR,
  hospede_email VARCHAR,
  hospede_endereco TEXT,
  hospede_data_nascimento DATE,
  
  -- Acompanhantes
  quantidade_hospedes INTEGER DEFAULT 1,
  acompanhantes JSONB DEFAULT '[]'::jsonb,
  -- Formato: [{"nome": "...", "cpf": "...", "parentesco": "..."}]
  
  -- Valores
  valor_total DECIMAL(10,2),
  valor_sinal_pago DECIMAL(10,2),
  valor_restante DECIMAL(10,2),
  
  -- Status
  status VARCHAR DEFAULT 'pendente',
  -- Opções: pendente, confirmada, checkin_realizado, checkout_realizado, cancelada, no_show
  
  -- Pagamento
  pagamento_status VARCHAR DEFAULT 'pendente',
  -- Opções: pendente, sinal_pago, pago_total, reembolsado
  forma_pagamento VARCHAR,
  
  -- Observações
  observacoes TEXT,
  motivo_visita TEXT,
  
  -- Origem
  origem VARCHAR DEFAULT 'manual',
  -- Opções: manual, whatsapp, site, telefone
  atendido_por UUID REFERENCES auth.users(id),
  
  -- Metadados
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_hosting_reservations_church_id ON public.hosting_reservations(church_id);
CREATE INDEX IF NOT EXISTS idx_hosting_reservations_dates ON public.hosting_reservations(data_checkin, data_checkout);
CREATE INDEX IF NOT EXISTS idx_hosting_reservations_status ON public.hosting_reservations(status);
CREATE INDEX IF NOT EXISTS idx_hosting_reservations_client_id ON public.hosting_reservations(client_id);

-- Comentários
COMMENT ON TABLE public.hosting_reservations IS 'Reservas de hospedagem realizadas';

-- ============================================
-- PARTE 5: AGENDAMENTOS DE SERVIÇOS
-- Histórico e gestão de agendamentos
-- ============================================

CREATE TABLE IF NOT EXISTS public.service_appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.church_services(id),
  client_id UUID REFERENCES public.clients(id),
  
  -- Data e Hora
  data_agendamento DATE NOT NULL,
  hora_inicio TIME,
  hora_fim TIME,
  
  -- Solicitante
  solicitante_nome VARCHAR NOT NULL,
  solicitante_telefone VARCHAR,
  solicitante_email VARCHAR,
  solicitante_cpf VARCHAR,
  
  -- Detalhes do Serviço (específicos por tipo)
  detalhes JSONB DEFAULT '{}'::jsonb,
  -- Ex para casamento: {"noivo": "...", "noiva": "...", "padrinhos": [...]}
  -- Ex para batismo: {"batizando": "...", "padrinhos": [...], "data_nascimento": "..."}
  
  -- Documentos
  documentos_entregues JSONB DEFAULT '[]'::jsonb,
  -- Formato: [{"nome": "Certidão", "entregue": true, "data": "2025-01-15"}]
  documentos_pendentes JSONB DEFAULT '[]'::jsonb,
  
  -- Valores
  valor_total DECIMAL(10,2),
  valor_sinal_pago DECIMAL(10,2),
  valor_restante DECIMAL(10,2),
  
  -- Status
  status VARCHAR DEFAULT 'solicitado',
  -- Opções: solicitado, aguardando_documentos, confirmado, realizado, cancelado
  
  -- Pagamento
  pagamento_status VARCHAR DEFAULT 'pendente',
  forma_pagamento VARCHAR,
  
  -- Observações
  observacoes TEXT,
  
  -- Origem
  origem VARCHAR DEFAULT 'manual',
  atendido_por UUID REFERENCES auth.users(id),
  
  -- Metadados
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_service_appointments_church_id ON public.service_appointments(church_id);
CREATE INDEX IF NOT EXISTS idx_service_appointments_service_id ON public.service_appointments(service_id);
CREATE INDEX IF NOT EXISTS idx_service_appointments_date ON public.service_appointments(data_agendamento);
CREATE INDEX IF NOT EXISTS idx_service_appointments_status ON public.service_appointments(status);
CREATE INDEX IF NOT EXISTS idx_service_appointments_client_id ON public.service_appointments(client_id);

-- Comentários
COMMENT ON TABLE public.service_appointments IS 'Agendamentos de serviços da igreja';

-- ============================================
-- PARTE 6: TRIGGERS PARA UPDATED_AT
-- ============================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers
DROP TRIGGER IF EXISTS update_church_services_updated_at ON public.church_services;
CREATE TRIGGER update_church_services_updated_at
    BEFORE UPDATE ON public.church_services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_church_hosting_config_updated_at ON public.church_hosting_config;
CREATE TRIGGER update_church_hosting_config_updated_at
    BEFORE UPDATE ON public.church_hosting_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_church_accommodations_updated_at ON public.church_accommodations;
CREATE TRIGGER update_church_accommodations_updated_at
    BEFORE UPDATE ON public.church_accommodations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_hosting_reservations_updated_at ON public.hosting_reservations;
CREATE TRIGGER update_hosting_reservations_updated_at
    BEFORE UPDATE ON public.hosting_reservations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_service_appointments_updated_at ON public.service_appointments;
CREATE TRIGGER update_service_appointments_updated_at
    BEFORE UPDATE ON public.service_appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- PARTE 7: DADOS INICIAIS DE EXEMPLO
-- Serviços padrão para facilitar setup
-- ============================================

-- Função para inserir serviços padrão para uma igreja
CREATE OR REPLACE FUNCTION insert_default_services(p_church_id UUID)
RETURNS void AS $$
BEGIN
  -- Casamento
  INSERT INTO public.church_services (church_id, nome, slug, tipo, descricao_curta, icone, prazo_minimo_agendamento, duracao_media_minutos)
  VALUES (p_church_id, 'Casamento', 'casamento', 'sacramento', 'Celebração do Sacramento do Matrimônio', 'heart', 180, 60)
  ON CONFLICT (church_id, slug) DO NOTHING;
  
  -- Batismo
  INSERT INTO public.church_services (church_id, nome, slug, tipo, descricao_curta, icone, prazo_minimo_agendamento, duracao_media_minutos)
  VALUES (p_church_id, 'Batismo', 'batismo', 'sacramento', 'Celebração do Sacramento do Batismo', 'droplets', 30, 30)
  ON CONFLICT (church_id, slug) DO NOTHING;
  
  -- Missa de Intenção
  INSERT INTO public.church_services (church_id, nome, slug, tipo, descricao_curta, icone, prazo_minimo_agendamento, duracao_media_minutos)
  VALUES (p_church_id, 'Missa de Intenção', 'missa-intencao', 'cerimonia', 'Missa com intenção especial', 'church', 7, 60)
  ON CONFLICT (church_id, slug) DO NOTHING;
  
  -- Sessão de Fotos
  INSERT INTO public.church_services (church_id, nome, slug, tipo, descricao_curta, icone, prazo_minimo_agendamento, duracao_media_minutos)
  VALUES (p_church_id, 'Sessão de Fotos', 'sessao-fotos', 'servico', 'Sessão fotográfica nos espaços da igreja', 'camera', 14, 120)
  ON CONFLICT (church_id, slug) DO NOTHING;
  
  -- Visitação Guiada
  INSERT INTO public.church_services (church_id, nome, slug, tipo, descricao_curta, icone, prazo_minimo_agendamento, duracao_media_minutos)
  VALUES (p_church_id, 'Visitação Guiada', 'visitacao', 'servico', 'Tour guiado pelos espaços históricos', 'map', 3, 90)
  ON CONFLICT (church_id, slug) DO NOTHING;
  
  -- Retiro Espiritual
  INSERT INTO public.church_services (church_id, nome, slug, tipo, descricao_curta, icone, prazo_minimo_agendamento, duracao_media_minutos)
  VALUES (p_church_id, 'Retiro Espiritual', 'retiro', 'evento', 'Retiros espirituais e dias de oração', 'sunrise', 30, 480)
  ON CONFLICT (church_id, slug) DO NOTHING;
  
  -- Curso de Noivos
  INSERT INTO public.church_services (church_id, nome, slug, tipo, descricao_curta, icone, prazo_minimo_agendamento, duracao_media_minutos)
  VALUES (p_church_id, 'Curso de Noivos', 'curso-noivos', 'evento', 'Preparação para o Sacramento do Matrimônio', 'users', 60, 180)
  ON CONFLICT (church_id, slug) DO NOTHING;
  
  -- Catequese
  INSERT INTO public.church_services (church_id, nome, slug, tipo, descricao_curta, icone, prazo_minimo_agendamento, duracao_media_minutos)
  VALUES (p_church_id, 'Catequese', 'catequese', 'evento', 'Formação catequética para crianças e adultos', 'book-open', 30, 90)
  ON CONFLICT (church_id, slug) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PARTE 8: RLS (Row Level Security)
-- ============================================

-- Habilitar RLS
ALTER TABLE public.church_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.church_hosting_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.church_accommodations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hosting_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_appointments ENABLE ROW LEVEL SECURITY;

-- Políticas para church_services
CREATE POLICY "Users can view services of their church" ON public.church_services
  FOR SELECT USING (
    church_id IN (SELECT id FROM public.churches WHERE owner_id = auth.uid())
  );

CREATE POLICY "Users can manage services of their church" ON public.church_services
  FOR ALL USING (
    church_id IN (SELECT id FROM public.churches WHERE owner_id = auth.uid())
  );

-- Políticas para church_hosting_config
CREATE POLICY "Users can view hosting config of their church" ON public.church_hosting_config
  FOR SELECT USING (
    church_id IN (SELECT id FROM public.churches WHERE owner_id = auth.uid())
  );

CREATE POLICY "Users can manage hosting config of their church" ON public.church_hosting_config
  FOR ALL USING (
    church_id IN (SELECT id FROM public.churches WHERE owner_id = auth.uid())
  );

-- Políticas para church_accommodations
CREATE POLICY "Users can view accommodations of their church" ON public.church_accommodations
  FOR SELECT USING (
    church_id IN (SELECT id FROM public.churches WHERE owner_id = auth.uid())
  );

CREATE POLICY "Users can manage accommodations of their church" ON public.church_accommodations
  FOR ALL USING (
    church_id IN (SELECT id FROM public.churches WHERE owner_id = auth.uid())
  );

-- Políticas para hosting_reservations
CREATE POLICY "Users can view reservations of their church" ON public.hosting_reservations
  FOR SELECT USING (
    church_id IN (SELECT id FROM public.churches WHERE owner_id = auth.uid())
  );

CREATE POLICY "Users can manage reservations of their church" ON public.hosting_reservations
  FOR ALL USING (
    church_id IN (SELECT id FROM public.churches WHERE owner_id = auth.uid())
  );

-- Políticas para service_appointments
CREATE POLICY "Users can view appointments of their church" ON public.service_appointments
  FOR SELECT USING (
    church_id IN (SELECT id FROM public.churches WHERE owner_id = auth.uid())
  );

CREATE POLICY "Users can manage appointments of their church" ON public.service_appointments
  FOR ALL USING (
    church_id IN (SELECT id FROM public.churches WHERE owner_id = auth.uid())
  );

-- ============================================
-- FIM DO SCHEMA
-- ============================================
