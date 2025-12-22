import { supabase } from '../../lib/supabase';
import type { ChurchService } from '../../types/database';

export type CreateServiceInput = Omit<ChurchService, 'id' | 'created_at' | 'updated_at'>;
export type UpdateServiceInput = Partial<Omit<ChurchService, 'id' | 'church_id' | 'created_at' | 'updated_at'>>;

export const churchServicesService = {
  // Listar todos os serviços de uma igreja
  async listByChurch(churchId: string): Promise<ChurchService[]> {
    const { data, error } = await supabase
      .from('church_services')
      .select('*')
      .eq('church_id', churchId)
      .order('ordem', { ascending: true });

    if (error) {
      console.error('[churchServices.listByChurch] Erro:', error);
      throw error;
    }
    return data || [];
  },

  // Listar apenas serviços ativos
  async listActiveByChurch(churchId: string): Promise<ChurchService[]> {
    const { data, error } = await supabase
      .from('church_services')
      .select('*')
      .eq('church_id', churchId)
      .eq('ativo', true)
      .order('ordem', { ascending: true });

    if (error) {
      console.error('[churchServices.listActiveByChurch] Erro:', error);
      throw error;
    }
    return data || [];
  },

  // Buscar serviço por ID
  async getById(id: string): Promise<ChurchService | null> {
    const { data, error } = await supabase
      .from('church_services')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('[churchServices.getById] Erro:', error);
      return null;
    }
    return data;
  },

  // Buscar serviço por slug
  async getBySlug(churchId: string, slug: string): Promise<ChurchService | null> {
    const { data, error } = await supabase
      .from('church_services')
      .select('*')
      .eq('church_id', churchId)
      .eq('slug', slug)
      .single();

    if (error) {
      console.error('[churchServices.getBySlug] Erro:', error);
      return null;
    }
    return data;
  },

  // Criar novo serviço
  async create(input: CreateServiceInput): Promise<ChurchService> {
    const { data, error } = await supabase
      .from('church_services')
      .insert({
        church_id: input.church_id,
        nome: input.nome,
        slug: input.slug,
        tipo: input.tipo || 'servico',
        ativo: input.ativo ?? true,
        ordem: input.ordem || 0,
        descricao_curta: input.descricao_curta || '',
        descricao_completa: input.descricao_completa || '',
        icone: input.icone || '',
        etapas: input.etapas || [],
        dias_permitidos: input.dias_permitidos || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        horarios_permitidos: input.horarios_permitidos || [],
        documentos_exigidos: input.documentos_exigidos || [],
        valor: input.valor,
        valor_variavel: input.valor_variavel || false,
        valor_minimo: input.valor_minimo,
        valor_maximo: input.valor_maximo,
        forma_pagamento: input.forma_pagamento || ['pix', 'dinheiro', 'transferencia'],
        exige_sinal: input.exige_sinal || false,
        valor_sinal: input.valor_sinal,
        percentual_sinal: input.percentual_sinal,
        prazo_pagamento_sinal: input.prazo_pagamento_sinal,
        regras: input.regras || '',
        restricoes: input.restricoes || '',
        prazo_minimo_agendamento: input.prazo_minimo_agendamento || 30,
        prazo_maximo_agendamento: input.prazo_maximo_agendamento || 365,
        duracao_media_minutos: input.duracao_media_minutos,
        capacidade_maxima: input.capacidade_maxima,
        usa_agendamento: input.usa_agendamento || false,
        usa_tool_verificar_agendamento: input.usa_tool_verificar_agendamento || false,
        usa_tool_realizar_agendamento: input.usa_tool_realizar_agendamento || false,
        precisa_confirmacao_humana: input.precisa_confirmacao_humana ?? true,
        mensagem_confirmacao: input.mensagem_confirmacao || '',
        mensagem_indisponibilidade: input.mensagem_indisponibilidade || '',
        mensagem_pos_agendamento: input.mensagem_pos_agendamento || '',
      })
      .select()
      .single();

    if (error) {
      console.error('[churchServices.create] Erro:', error);
      throw error;
    }
    return data;
  },

  // Atualizar serviço
  async update(id: string, input: UpdateServiceInput): Promise<ChurchService> {
    const updateData: any = {};

    // Campos de texto
    if (input.nome !== undefined) updateData.nome = input.nome;
    if (input.slug !== undefined) updateData.slug = input.slug;
    if (input.tipo !== undefined) updateData.tipo = input.tipo;
    if (input.descricao_curta !== undefined) updateData.descricao_curta = input.descricao_curta || '';
    if (input.descricao_completa !== undefined) updateData.descricao_completa = input.descricao_completa || '';
    if (input.icone !== undefined) updateData.icone = input.icone || '';
    if (input.regras !== undefined) updateData.regras = input.regras || '';
    if (input.restricoes !== undefined) updateData.restricoes = input.restricoes || '';
    if (input.mensagem_confirmacao !== undefined) updateData.mensagem_confirmacao = input.mensagem_confirmacao || '';
    if (input.mensagem_indisponibilidade !== undefined) updateData.mensagem_indisponibilidade = input.mensagem_indisponibilidade || '';
    if (input.mensagem_pos_agendamento !== undefined) updateData.mensagem_pos_agendamento = input.mensagem_pos_agendamento || '';

    // Campos numéricos
    if (input.ordem !== undefined) updateData.ordem = input.ordem;
    if (input.valor !== undefined) updateData.valor = input.valor;
    if (input.valor_minimo !== undefined) updateData.valor_minimo = input.valor_minimo;
    if (input.valor_maximo !== undefined) updateData.valor_maximo = input.valor_maximo;
    if (input.valor_sinal !== undefined) updateData.valor_sinal = input.valor_sinal;
    if (input.percentual_sinal !== undefined) updateData.percentual_sinal = input.percentual_sinal;
    if (input.prazo_pagamento_sinal !== undefined) updateData.prazo_pagamento_sinal = input.prazo_pagamento_sinal;
    if (input.prazo_minimo_agendamento !== undefined) updateData.prazo_minimo_agendamento = input.prazo_minimo_agendamento;
    if (input.prazo_maximo_agendamento !== undefined) updateData.prazo_maximo_agendamento = input.prazo_maximo_agendamento;
    if (input.duracao_media_minutos !== undefined) updateData.duracao_media_minutos = input.duracao_media_minutos;
    if (input.capacidade_maxima !== undefined) updateData.capacidade_maxima = input.capacidade_maxima;

    // Campos boolean
    if (input.ativo !== undefined) updateData.ativo = Boolean(input.ativo);
    if (input.valor_variavel !== undefined) updateData.valor_variavel = Boolean(input.valor_variavel);
    if (input.exige_sinal !== undefined) updateData.exige_sinal = Boolean(input.exige_sinal);
    if (input.usa_agendamento !== undefined) updateData.usa_agendamento = Boolean(input.usa_agendamento);
    if (input.usa_tool_verificar_agendamento !== undefined) updateData.usa_tool_verificar_agendamento = Boolean(input.usa_tool_verificar_agendamento);
    if (input.usa_tool_realizar_agendamento !== undefined) updateData.usa_tool_realizar_agendamento = Boolean(input.usa_tool_realizar_agendamento);
    if (input.precisa_confirmacao_humana !== undefined) updateData.precisa_confirmacao_humana = Boolean(input.precisa_confirmacao_humana);

    // Campos JSONB
    if (input.etapas !== undefined) updateData.etapas = input.etapas || [];
    if (input.dias_permitidos !== undefined) updateData.dias_permitidos = input.dias_permitidos || [];
    if (input.horarios_permitidos !== undefined) updateData.horarios_permitidos = input.horarios_permitidos || [];
    if (input.documentos_exigidos !== undefined) updateData.documentos_exigidos = input.documentos_exigidos || [];
    if (input.forma_pagamento !== undefined) updateData.forma_pagamento = input.forma_pagamento || [];

    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('church_services')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[churchServices.update] Erro:', error);
      throw error;
    }
    return data;
  },

  // Deletar serviço
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('church_services')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[churchServices.delete] Erro:', error);
      throw error;
    }
  },

  // Ativar/Desativar serviço
  async toggleActive(id: string, ativo: boolean): Promise<ChurchService> {
    const { data, error } = await supabase
      .from('church_services')
      .update({ ativo, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[churchServices.toggleActive] Erro:', error);
      throw error;
    }
    return data;
  },

  // Reordenar serviços
  async reorder(churchId: string, orderedIds: string[]): Promise<void> {
    const updates = orderedIds.map((id, index) => ({
      id,
      ordem: index,
      updated_at: new Date().toISOString(),
    }));

    for (const update of updates) {
      const { error } = await supabase
        .from('church_services')
        .update({ ordem: update.ordem, updated_at: update.updated_at })
        .eq('id', update.id)
        .eq('church_id', churchId);

      if (error) {
        console.error('[churchServices.reorder] Erro:', error);
        throw error;
      }
    }
  },

  // Inserir serviços padrão para uma igreja
  async insertDefaultServices(churchId: string): Promise<void> {
    const defaultServices: Partial<ChurchService>[] = [
      {
        nome: 'Casamento',
        slug: 'casamento',
        tipo: 'sacramento',
        descricao_curta: 'Celebração do Sacramento do Matrimônio',
        icone: 'heart',
        prazo_minimo_agendamento: 180,
        duracao_media_minutos: 60,
      },
      {
        nome: 'Batismo',
        slug: 'batismo',
        tipo: 'sacramento',
        descricao_curta: 'Celebração do Sacramento do Batismo',
        icone: 'droplets',
        prazo_minimo_agendamento: 30,
        duracao_media_minutos: 30,
      },
      {
        nome: 'Missa de Intenção',
        slug: 'missa-intencao',
        tipo: 'cerimonia',
        descricao_curta: 'Missa com intenção especial',
        icone: 'church',
        prazo_minimo_agendamento: 7,
        duracao_media_minutos: 60,
      },
      {
        nome: 'Sessão de Fotos',
        slug: 'sessao-fotos',
        tipo: 'servico',
        descricao_curta: 'Sessão fotográfica nos espaços da igreja',
        icone: 'camera',
        prazo_minimo_agendamento: 14,
        duracao_media_minutos: 120,
      },
      {
        nome: 'Visitação Guiada',
        slug: 'visitacao',
        tipo: 'servico',
        descricao_curta: 'Tour guiado pelos espaços históricos',
        icone: 'map',
        prazo_minimo_agendamento: 3,
        duracao_media_minutos: 90,
      },
    ];

    for (let i = 0; i < defaultServices.length; i++) {
      const service = defaultServices[i];
      try {
        await this.create({
          church_id: churchId,
          nome: service.nome!,
          slug: service.slug!,
          tipo: service.tipo as any,
          ativo: true,
          ordem: i,
          descricao_curta: service.descricao_curta,
          descricao_completa: '',
          icone: service.icone,
          etapas: [],
          dias_permitidos: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
          horarios_permitidos: [],
          documentos_exigidos: [],
          valor_variavel: false,
          forma_pagamento: ['pix', 'dinheiro', 'transferencia'],
          exige_sinal: false,
          prazo_minimo_agendamento: service.prazo_minimo_agendamento || 30,
          prazo_maximo_agendamento: 365,
          duracao_media_minutos: service.duracao_media_minutos,
          usa_agendamento: false,
          usa_tool_verificar_agendamento: false,
          usa_tool_realizar_agendamento: false,
          precisa_confirmacao_humana: true,
        });
      } catch (error) {
        // Ignora erro de duplicata (serviço já existe)
        console.log(`[churchServices.insertDefaultServices] Serviço ${service.slug} já existe ou erro:`, error);
      }
    }
  },
};
