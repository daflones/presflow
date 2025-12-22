import { supabase } from '../../lib/supabase';
import type { HostingConfig, ChurchAccommodation, HostingReservation } from '../../types/database';

// ============================================
// CONFIGURAÇÃO DE HOSPEDAGEM
// ============================================

export type UpdateHostingConfigInput = Partial<Omit<HostingConfig, 'id' | 'church_id' | 'created_at' | 'updated_at'>>;

export const hostingConfigService = {
  // Buscar configuração de hospedagem da igreja
  async getByChurch(churchId: string): Promise<HostingConfig | null> {
    const { data, error } = await supabase
      .from('church_hosting_config')
      .select('*')
      .eq('church_id', churchId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Não encontrado - retorna null
        return null;
      }
      console.error('[hostingConfig.getByChurch] Erro:', error);
      throw error;
    }
    return data;
  },

  // Criar ou atualizar configuração de hospedagem
  async upsert(churchId: string, input: UpdateHostingConfigInput): Promise<HostingConfig> {
    const existing = await this.getByChurch(churchId);

    if (existing) {
      // Atualizar
      return this.update(existing.id, input);
    } else {
      // Criar
      return this.create(churchId, input);
    }
  },

  // Criar configuração de hospedagem
  async create(churchId: string, input: UpdateHostingConfigInput): Promise<HostingConfig> {
    const { data, error } = await supabase
      .from('church_hosting_config')
      .insert({
        church_id: churchId,
        hospedagem_ativa: input.hospedagem_ativa ?? false,
        descricao: input.descricao || '',
        publico_permitido: input.publico_permitido || ['romeiros', 'retiros', 'eventos'],
        idade_minima: input.idade_minima || 0,
        permite_criancas: input.permite_criancas ?? true,
        permite_animais: input.permite_animais ?? false,
        acessibilidade: input.acessibilidade || '',
        dias_funcionamento: input.dias_funcionamento || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        horario_checkin: input.horario_checkin || '14:00',
        horario_checkout: input.horario_checkout || '12:00',
        estadia_minima: input.estadia_minima || 1,
        estadia_maxima: input.estadia_maxima || 30,
        permite_estender_estadia: input.permite_estender_estadia ?? true,
        datas_bloqueadas: input.datas_bloqueadas || [],
        bloqueio_por_evento: input.bloqueio_por_evento ?? true,
        valor_por_noite: input.valor_por_noite,
        valor_por_pessoa: input.valor_por_pessoa ?? false,
        taxa_limpeza: input.taxa_limpeza,
        exige_sinal: input.exige_sinal ?? false,
        valor_sinal: input.valor_sinal,
        percentual_sinal: input.percentual_sinal,
        prazo_pagamento_sinal: input.prazo_pagamento_sinal,
        politica_cancelamento: input.politica_cancelamento || '',
        formas_pagamento: input.formas_pagamento || ['pix', 'dinheiro', 'transferencia'],
        dados_obrigatorios: input.dados_obrigatorios || ['nome', 'cpf', 'telefone', 'email'],
        exige_documento: input.exige_documento ?? true,
        tipos_documento: input.tipos_documento || ['rg', 'cnh', 'passaporte'],
        ficha_hospede_link: input.ficha_hospede_link || '',
        envio_documentos_por: input.envio_documentos_por || ['upload', 'email'],
        ia_nivel_automacao: input.ia_nivel_automacao || 'informar',
        usa_agendamento_ia: input.usa_agendamento_ia ?? false,
        precisa_confirmacao_humana: input.precisa_confirmacao_humana ?? true,
        mensagem_confirmacao_reserva: input.mensagem_confirmacao_reserva || '',
        mensagem_indisponibilidade: input.mensagem_indisponibilidade || '',
        regras_hospedagem: input.regras_hospedagem || '',
        termos_responsabilidade: input.termos_responsabilidade || '',
        orientacoes_hospede: input.orientacoes_hospede || '',
        politica_silencio: input.politica_silencio || '',
        informacoes_gerais: input.informacoes_gerais || '',
      })
      .select()
      .single();

    if (error) {
      console.error('[hostingConfig.create] Erro:', error);
      throw error;
    }
    return data;
  },

  // Atualizar configuração de hospedagem
  async update(id: string, input: UpdateHostingConfigInput): Promise<HostingConfig> {
    const updateData: any = {};

    // Campos boolean
    if (input.hospedagem_ativa !== undefined) updateData.hospedagem_ativa = Boolean(input.hospedagem_ativa);
    if (input.permite_criancas !== undefined) updateData.permite_criancas = Boolean(input.permite_criancas);
    if (input.permite_animais !== undefined) updateData.permite_animais = Boolean(input.permite_animais);
    if (input.permite_estender_estadia !== undefined) updateData.permite_estender_estadia = Boolean(input.permite_estender_estadia);
    if (input.bloqueio_por_evento !== undefined) updateData.bloqueio_por_evento = Boolean(input.bloqueio_por_evento);
    if (input.valor_por_pessoa !== undefined) updateData.valor_por_pessoa = Boolean(input.valor_por_pessoa);
    if (input.exige_sinal !== undefined) updateData.exige_sinal = Boolean(input.exige_sinal);
    if (input.exige_documento !== undefined) updateData.exige_documento = Boolean(input.exige_documento);
    if (input.usa_agendamento_ia !== undefined) updateData.usa_agendamento_ia = Boolean(input.usa_agendamento_ia);
    if (input.precisa_confirmacao_humana !== undefined) updateData.precisa_confirmacao_humana = Boolean(input.precisa_confirmacao_humana);

    // Campos de texto
    if (input.descricao !== undefined) updateData.descricao = input.descricao || '';
    if (input.acessibilidade !== undefined) updateData.acessibilidade = input.acessibilidade || '';
    if (input.horario_checkin !== undefined) updateData.horario_checkin = input.horario_checkin || '14:00';
    if (input.horario_checkout !== undefined) updateData.horario_checkout = input.horario_checkout || '12:00';
    if (input.politica_cancelamento !== undefined) updateData.politica_cancelamento = input.politica_cancelamento || '';
    if (input.ficha_hospede_link !== undefined) updateData.ficha_hospede_link = input.ficha_hospede_link || '';
    if (input.ia_nivel_automacao !== undefined) updateData.ia_nivel_automacao = input.ia_nivel_automacao;
    if (input.mensagem_confirmacao_reserva !== undefined) updateData.mensagem_confirmacao_reserva = input.mensagem_confirmacao_reserva || '';
    if (input.mensagem_indisponibilidade !== undefined) updateData.mensagem_indisponibilidade = input.mensagem_indisponibilidade || '';
    if (input.regras_hospedagem !== undefined) updateData.regras_hospedagem = input.regras_hospedagem || '';
    if (input.termos_responsabilidade !== undefined) updateData.termos_responsabilidade = input.termos_responsabilidade || '';
    if (input.orientacoes_hospede !== undefined) updateData.orientacoes_hospede = input.orientacoes_hospede || '';
    if (input.politica_silencio !== undefined) updateData.politica_silencio = input.politica_silencio || '';
    if (input.informacoes_gerais !== undefined) updateData.informacoes_gerais = input.informacoes_gerais || '';

    // Campos numéricos
    if (input.idade_minima !== undefined) updateData.idade_minima = input.idade_minima;
    if (input.estadia_minima !== undefined) updateData.estadia_minima = input.estadia_minima;
    if (input.estadia_maxima !== undefined) updateData.estadia_maxima = input.estadia_maxima;
    if (input.valor_por_noite !== undefined) updateData.valor_por_noite = input.valor_por_noite;
    if (input.taxa_limpeza !== undefined) updateData.taxa_limpeza = input.taxa_limpeza;
    if (input.valor_sinal !== undefined) updateData.valor_sinal = input.valor_sinal;
    if (input.percentual_sinal !== undefined) updateData.percentual_sinal = input.percentual_sinal;
    if (input.prazo_pagamento_sinal !== undefined) updateData.prazo_pagamento_sinal = input.prazo_pagamento_sinal;

    // Campos JSONB
    if (input.publico_permitido !== undefined) updateData.publico_permitido = input.publico_permitido || [];
    if (input.dias_funcionamento !== undefined) updateData.dias_funcionamento = input.dias_funcionamento || [];
    if (input.datas_bloqueadas !== undefined) updateData.datas_bloqueadas = input.datas_bloqueadas || [];
    if (input.formas_pagamento !== undefined) updateData.formas_pagamento = input.formas_pagamento || [];
    if (input.dados_obrigatorios !== undefined) updateData.dados_obrigatorios = input.dados_obrigatorios || [];
    if (input.tipos_documento !== undefined) updateData.tipos_documento = input.tipos_documento || [];
    if (input.envio_documentos_por !== undefined) updateData.envio_documentos_por = input.envio_documentos_por || [];

    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('church_hosting_config')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[hostingConfig.update] Erro:', error);
      throw error;
    }
    return data;
  },
};

// ============================================
// ACOMODAÇÕES
// ============================================

export type CreateAccommodationInput = Omit<ChurchAccommodation, 'id' | 'created_at' | 'updated_at'>;
export type UpdateAccommodationInput = Partial<Omit<ChurchAccommodation, 'id' | 'church_id' | 'created_at' | 'updated_at'>>;

export const accommodationsService = {
  // Listar acomodações de uma igreja
  async listByChurch(churchId: string): Promise<ChurchAccommodation[]> {
    const { data, error } = await supabase
      .from('church_accommodations')
      .select('*')
      .eq('church_id', churchId)
      .order('nome', { ascending: true });

    if (error) {
      console.error('[accommodations.listByChurch] Erro:', error);
      throw error;
    }
    return data || [];
  },

  // Listar apenas acomodações ativas
  async listActiveByChurch(churchId: string): Promise<ChurchAccommodation[]> {
    const { data, error } = await supabase
      .from('church_accommodations')
      .select('*')
      .eq('church_id', churchId)
      .eq('ativo', true)
      .eq('em_manutencao', false)
      .order('nome', { ascending: true });

    if (error) {
      console.error('[accommodations.listActiveByChurch] Erro:', error);
      throw error;
    }
    return data || [];
  },

  // Buscar acomodação por ID
  async getById(id: string): Promise<ChurchAccommodation | null> {
    const { data, error } = await supabase
      .from('church_accommodations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('[accommodations.getById] Erro:', error);
      return null;
    }
    return data;
  },

  // Criar acomodação
  async create(input: CreateAccommodationInput): Promise<ChurchAccommodation> {
    const { data, error } = await supabase
      .from('church_accommodations')
      .insert({
        church_id: input.church_id,
        nome: input.nome,
        codigo: input.codigo || '',
        tipo: input.tipo || 'individual',
        capacidade_maxima: input.capacidade_maxima || 1,
        quantidade_disponivel: input.quantidade_disponivel || 1,
        descricao: input.descricao || '',
        possui_banheiro: input.possui_banheiro ?? false,
        possui_banheiro_privativo: input.possui_banheiro_privativo ?? false,
        possui_roupa_cama: input.possui_roupa_cama ?? true,
        possui_toalhas: input.possui_toalhas ?? false,
        possui_ar_condicionado: input.possui_ar_condicionado ?? false,
        possui_ventilador: input.possui_ventilador ?? false,
        possui_tv: input.possui_tv ?? false,
        possui_wifi: input.possui_wifi ?? true,
        possui_frigobar: input.possui_frigobar ?? false,
        comodidades_extras: input.comodidades_extras || [],
        valor_noite_override: input.valor_noite_override,
        fotos: input.fotos || [],
        ativo: input.ativo ?? true,
        em_manutencao: input.em_manutencao ?? false,
      })
      .select()
      .single();

    if (error) {
      console.error('[accommodations.create] Erro:', error);
      throw error;
    }
    return data;
  },

  // Atualizar acomodação
  async update(id: string, input: UpdateAccommodationInput): Promise<ChurchAccommodation> {
    const updateData: any = {};

    // Campos de texto
    if (input.nome !== undefined) updateData.nome = input.nome;
    if (input.codigo !== undefined) updateData.codigo = input.codigo || '';
    if (input.tipo !== undefined) updateData.tipo = input.tipo;
    if (input.descricao !== undefined) updateData.descricao = input.descricao || '';

    // Campos numéricos
    if (input.capacidade_maxima !== undefined) updateData.capacidade_maxima = input.capacidade_maxima;
    if (input.quantidade_disponivel !== undefined) updateData.quantidade_disponivel = input.quantidade_disponivel;
    if (input.valor_noite_override !== undefined) updateData.valor_noite_override = input.valor_noite_override;

    // Campos boolean
    if (input.possui_banheiro !== undefined) updateData.possui_banheiro = Boolean(input.possui_banheiro);
    if (input.possui_banheiro_privativo !== undefined) updateData.possui_banheiro_privativo = Boolean(input.possui_banheiro_privativo);
    if (input.possui_roupa_cama !== undefined) updateData.possui_roupa_cama = Boolean(input.possui_roupa_cama);
    if (input.possui_toalhas !== undefined) updateData.possui_toalhas = Boolean(input.possui_toalhas);
    if (input.possui_ar_condicionado !== undefined) updateData.possui_ar_condicionado = Boolean(input.possui_ar_condicionado);
    if (input.possui_ventilador !== undefined) updateData.possui_ventilador = Boolean(input.possui_ventilador);
    if (input.possui_tv !== undefined) updateData.possui_tv = Boolean(input.possui_tv);
    if (input.possui_wifi !== undefined) updateData.possui_wifi = Boolean(input.possui_wifi);
    if (input.possui_frigobar !== undefined) updateData.possui_frigobar = Boolean(input.possui_frigobar);
    if (input.ativo !== undefined) updateData.ativo = Boolean(input.ativo);
    if (input.em_manutencao !== undefined) updateData.em_manutencao = Boolean(input.em_manutencao);

    // Campos JSONB
    if (input.comodidades_extras !== undefined) updateData.comodidades_extras = input.comodidades_extras || [];
    if (input.fotos !== undefined) updateData.fotos = input.fotos || [];

    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('church_accommodations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[accommodations.update] Erro:', error);
      throw error;
    }
    return data;
  },

  // Deletar acomodação
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('church_accommodations')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[accommodations.delete] Erro:', error);
      throw error;
    }
  },
};

// ============================================
// RESERVAS DE HOSPEDAGEM
// ============================================

export type CreateReservationInput = Omit<HostingReservation, 'id' | 'created_at' | 'updated_at'>;
export type UpdateReservationInput = Partial<Omit<HostingReservation, 'id' | 'church_id' | 'created_at' | 'updated_at'>>;

export const hostingReservationsService = {
  // Listar reservas de uma igreja
  async listByChurch(churchId: string, filters?: {
    status?: string;
    dataInicio?: string;
    dataFim?: string;
  }): Promise<HostingReservation[]> {
    let query = supabase
      .from('hosting_reservations')
      .select('*')
      .eq('church_id', churchId)
      .order('data_checkin', { ascending: true });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.dataInicio) {
      query = query.gte('data_checkin', filters.dataInicio);
    }
    if (filters?.dataFim) {
      query = query.lte('data_checkout', filters.dataFim);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[hostingReservations.listByChurch] Erro:', error);
      throw error;
    }
    return data || [];
  },

  // Buscar reserva por ID
  async getById(id: string): Promise<HostingReservation | null> {
    const { data, error } = await supabase
      .from('hosting_reservations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('[hostingReservations.getById] Erro:', error);
      return null;
    }
    return data;
  },

  // Verificar disponibilidade
  async checkAvailability(churchId: string, accommodationId: string, checkin: string, checkout: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('hosting_reservations')
      .select('id')
      .eq('church_id', churchId)
      .eq('accommodation_id', accommodationId)
      .not('status', 'in', '("cancelada","no_show")')
      .or(`data_checkin.lte.${checkout},data_checkout.gte.${checkin}`);

    if (error) {
      console.error('[hostingReservations.checkAvailability] Erro:', error);
      throw error;
    }

    // Se não encontrou reservas conflitantes, está disponível
    return !data || data.length === 0;
  },

  // Criar reserva
  async create(input: CreateReservationInput): Promise<HostingReservation> {
    const { data, error } = await supabase
      .from('hosting_reservations')
      .insert({
        church_id: input.church_id,
        accommodation_id: input.accommodation_id,
        client_id: input.client_id,
        data_checkin: input.data_checkin,
        data_checkout: input.data_checkout,
        hospede_nome: input.hospede_nome,
        hospede_cpf: input.hospede_cpf || '',
        hospede_rg: input.hospede_rg || '',
        hospede_telefone: input.hospede_telefone || '',
        hospede_email: input.hospede_email || '',
        hospede_endereco: input.hospede_endereco || '',
        hospede_data_nascimento: input.hospede_data_nascimento,
        quantidade_hospedes: input.quantidade_hospedes || 1,
        acompanhantes: input.acompanhantes || [],
        valor_total: input.valor_total,
        valor_sinal_pago: input.valor_sinal_pago,
        valor_restante: input.valor_restante,
        status: input.status || 'pendente',
        pagamento_status: input.pagamento_status || 'pendente',
        forma_pagamento: input.forma_pagamento || '',
        observacoes: input.observacoes || '',
        motivo_visita: input.motivo_visita || '',
        origem: input.origem || 'manual',
        atendido_por: input.atendido_por,
      })
      .select()
      .single();

    if (error) {
      console.error('[hostingReservations.create] Erro:', error);
      throw error;
    }
    return data;
  },

  // Atualizar reserva
  async update(id: string, input: UpdateReservationInput): Promise<HostingReservation> {
    const updateData: any = {};

    // Campos de data
    if (input.data_checkin !== undefined) updateData.data_checkin = input.data_checkin;
    if (input.data_checkout !== undefined) updateData.data_checkout = input.data_checkout;

    // Campos do hóspede
    if (input.hospede_nome !== undefined) updateData.hospede_nome = input.hospede_nome;
    if (input.hospede_cpf !== undefined) updateData.hospede_cpf = input.hospede_cpf || '';
    if (input.hospede_rg !== undefined) updateData.hospede_rg = input.hospede_rg || '';
    if (input.hospede_telefone !== undefined) updateData.hospede_telefone = input.hospede_telefone || '';
    if (input.hospede_email !== undefined) updateData.hospede_email = input.hospede_email || '';
    if (input.hospede_endereco !== undefined) updateData.hospede_endereco = input.hospede_endereco || '';
    if (input.hospede_data_nascimento !== undefined) updateData.hospede_data_nascimento = input.hospede_data_nascimento;

    // Campos numéricos
    if (input.quantidade_hospedes !== undefined) updateData.quantidade_hospedes = input.quantidade_hospedes;
    if (input.valor_total !== undefined) updateData.valor_total = input.valor_total;
    if (input.valor_sinal_pago !== undefined) updateData.valor_sinal_pago = input.valor_sinal_pago;
    if (input.valor_restante !== undefined) updateData.valor_restante = input.valor_restante;

    // Status
    if (input.status !== undefined) updateData.status = input.status;
    if (input.pagamento_status !== undefined) updateData.pagamento_status = input.pagamento_status;
    if (input.forma_pagamento !== undefined) updateData.forma_pagamento = input.forma_pagamento || '';

    // Outros
    if (input.observacoes !== undefined) updateData.observacoes = input.observacoes || '';
    if (input.motivo_visita !== undefined) updateData.motivo_visita = input.motivo_visita || '';
    if (input.accommodation_id !== undefined) updateData.accommodation_id = input.accommodation_id;
    if (input.client_id !== undefined) updateData.client_id = input.client_id;

    // JSONB
    if (input.acompanhantes !== undefined) updateData.acompanhantes = input.acompanhantes || [];

    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('hosting_reservations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[hostingReservations.update] Erro:', error);
      throw error;
    }
    return data;
  },

  // Atualizar status da reserva
  async updateStatus(id: string, status: HostingReservation['status']): Promise<HostingReservation> {
    return this.update(id, { status });
  },

  // Cancelar reserva
  async cancel(id: string): Promise<HostingReservation> {
    return this.update(id, { status: 'cancelada' });
  },
};
