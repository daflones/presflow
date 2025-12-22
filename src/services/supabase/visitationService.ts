import { supabase } from '../../lib/supabase';
import type { 
  VisitationFormConfig, 
  VisitationFormResponse, 
  VisitationFollowupHistory,
  VisitationResponseStatus 
} from '../../types/database';

// ============================================
// SERVIÇO DE CONFIGURAÇÃO DO FORMULÁRIO
// ============================================

export const visitationConfigService = {
  async getByChurch(churchId: string): Promise<VisitationFormConfig | null> {
    const { data, error } = await supabase
      .from('visitation_form_config')
      .select('*')
      .eq('church_id', churchId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Erro ao buscar config de visitação:', error);
      throw error;
    }

    return data;
  },

  async getBySlug(slug: string): Promise<VisitationFormConfig | null> {
    const { data, error } = await supabase
      .from('visitation_form_config')
      .select('*')
      .eq('slug', slug)
      .eq('ativo', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Erro ao buscar formulário por slug:', error);
      throw error;
    }

    return data;
  },

  async create(churchId: string, config: Partial<VisitationFormConfig>): Promise<VisitationFormConfig> {
    const { data, error } = await supabase
      .from('visitation_form_config')
      .insert({
        church_id: churchId,
        ...config,
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar config de visitação:', error);
      throw error;
    }

    return data;
  },

  async update(id: string, config: Partial<VisitationFormConfig>): Promise<VisitationFormConfig> {
    const { data, error } = await supabase
      .from('visitation_form_config')
      .update(config)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar config de visitação:', error);
      throw error;
    }

    return data;
  },

  async upsert(churchId: string, config: Partial<VisitationFormConfig>): Promise<VisitationFormConfig> {
    const existing = await this.getByChurch(churchId);
    
    if (existing) {
      return this.update(existing.id, config);
    } else {
      return this.create(churchId, config);
    }
  },

  async checkSlugAvailable(slug: string, excludeId?: string): Promise<boolean> {
    let query = supabase
      .from('visitation_form_config')
      .select('id')
      .eq('slug', slug);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data } = await query;
    return !data || data.length === 0;
  },
};

// ============================================
// SERVIÇO DE RESPOSTAS DO FORMULÁRIO
// ============================================

export const visitationResponsesService = {
  async listByChurch(churchId: string, filters?: {
    status?: VisitationResponseStatus;
    startDate?: string;
    endDate?: string;
    search?: string;
  }): Promise<VisitationFormResponse[]> {
    let query = supabase
      .from('visitation_form_responses')
      .select('*')
      .eq('church_id', churchId)
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.startDate) {
      query = query.gte('created_at', filters.startDate);
    }

    if (filters?.endDate) {
      query = query.lte('created_at', filters.endDate);
    }

    if (filters?.search) {
      query = query.or(`nome.ilike.%${filters.search}%,email.ilike.%${filters.search}%,telefone.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao listar respostas:', error);
      throw error;
    }

    return data || [];
  },

  async getById(id: string): Promise<VisitationFormResponse | null> {
    const { data, error } = await supabase
      .from('visitation_form_responses')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Erro ao buscar resposta:', error);
      throw error;
    }

    return data;
  },

  async create(response: Omit<VisitationFormResponse, 'id' | 'created_at' | 'updated_at'>): Promise<VisitationFormResponse> {
    const { data, error } = await supabase
      .from('visitation_form_responses')
      .insert(response)
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar resposta:', error);
      throw error;
    }

    return data;
  },

  async update(id: string, updates: Partial<VisitationFormResponse>): Promise<VisitationFormResponse> {
    const { data, error } = await supabase
      .from('visitation_form_responses')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar resposta:', error);
      throw error;
    }

    return data;
  },

  async updateStatus(id: string, status: VisitationResponseStatus, notas?: string): Promise<void> {
    const updates: Partial<VisitationFormResponse> = {
      status,
      data_ultimo_contato: new Date().toISOString(),
    };

    if (notas) {
      updates.notas_acompanhamento = notas;
    }

    await this.update(id, updates);
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('visitation_form_responses')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao deletar resposta:', error);
      throw error;
    }
  },

  async getStats(churchId: string): Promise<{
    total: number;
    novos: number;
    contatados: number;
    visitados: number;
    membros: number;
    inativos: number;
    ultimaSemana: number;
    ultimoMes: number;
  }> {
    const { data, error } = await supabase
      .from('visitation_form_responses')
      .select('status, created_at')
      .eq('church_id', churchId);

    if (error) {
      console.error('Erro ao buscar estatísticas:', error);
      throw error;
    }

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const stats = {
      total: data?.length || 0,
      novos: 0,
      contatados: 0,
      visitados: 0,
      membros: 0,
      inativos: 0,
      ultimaSemana: 0,
      ultimoMes: 0,
    };

    data?.forEach((item) => {
      const createdAt = new Date(item.created_at);
      
      switch (item.status) {
        case 'novo': stats.novos++; break;
        case 'contatado': stats.contatados++; break;
        case 'visitado': stats.visitados++; break;
        case 'membro': stats.membros++; break;
        case 'inativo': stats.inativos++; break;
      }

      if (createdAt >= oneWeekAgo) stats.ultimaSemana++;
      if (createdAt >= oneMonthAgo) stats.ultimoMes++;
    });

    return stats;
  },
};

// ============================================
// SERVIÇO DE HISTÓRICO DE ACOMPANHAMENTO
// ============================================

export const visitationFollowupService = {
  async listByResponse(responseId: string): Promise<VisitationFollowupHistory[]> {
    const { data, error } = await supabase
      .from('visitation_followup_history')
      .select('*')
      .eq('response_id', responseId)
      .order('data_contato', { ascending: false });

    if (error) {
      console.error('Erro ao listar histórico:', error);
      throw error;
    }

    return data || [];
  },

  async create(followup: Omit<VisitationFollowupHistory, 'id' | 'created_at'>): Promise<VisitationFollowupHistory> {
    const { data, error } = await supabase
      .from('visitation_followup_history')
      .insert(followup)
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar histórico:', error);
      throw error;
    }

    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('visitation_followup_history')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao deletar histórico:', error);
      throw error;
    }
  },
};
