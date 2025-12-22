import { supabase } from '../../lib/supabase';
import type { 
  SupportTicket, 
  SupportTicketMessage, 
  SupportTicketCategory,
  SupportTicketReason,
  TicketStatus,
  TicketPrioridade
} from '../../types/database';

// ============================================
// SERVIÇO DE TICKETS
// ============================================

export const supportTicketsService = {
  async list(churchId: string, filters?: {
    status?: TicketStatus;
    prioridade?: TicketPrioridade;
    search?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<SupportTicket[]> {
    let query = supabase
      .from('support_tickets')
      .select('*')
      .eq('church_id', churchId)
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.prioridade) {
      query = query.eq('prioridade', filters.prioridade);
    }

    if (filters?.startDate) {
      query = query.gte('created_at', filters.startDate);
    }

    if (filters?.endDate) {
      query = query.lte('created_at', filters.endDate);
    }

    if (filters?.search) {
      query = query.or(`nome.ilike.%${filters.search}%,telefone.ilike.%${filters.search}%,motivo.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao listar tickets:', error);
      throw error;
    }

    return data || [];
  },

  async getById(id: string): Promise<SupportTicket | null> {
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Erro ao buscar ticket:', error);
      throw error;
    }

    return data;
  },

  async create(ticket: Omit<SupportTicket, 'id' | 'created_at' | 'updated_at' | 'data_criacao' | 'data_atualizacao'>): Promise<SupportTicket> {
    const { data, error } = await supabase
      .from('support_tickets')
      .insert(ticket)
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar ticket:', error);
      throw error;
    }

    return data;
  },

  async update(id: string, updates: Partial<SupportTicket>): Promise<SupportTicket> {
    const { data, error } = await supabase
      .from('support_tickets')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar ticket:', error);
      throw error;
    }

    return data;
  },

  async updateStatus(id: string, status: TicketStatus, responsavelNome?: string): Promise<void> {
    const updates: Partial<SupportTicket> = { status };
    
    if (status === 'resolvido') {
      updates.data_resolucao = new Date().toISOString();
    }

    if (responsavelNome) {
      updates.responsavel_nome = responsavelNome;
    }

    await this.update(id, updates);
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('support_tickets')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao deletar ticket:', error);
      throw error;
    }
  },

  async getStats(churchId: string): Promise<{
    total: number;
    pendentes: number;
    emAndamento: number;
    resolvidos: number;
    urgentes: number;
    hoje: number;
  }> {
    const { data, error } = await supabase
      .from('support_tickets')
      .select('status, prioridade, created_at')
      .eq('church_id', churchId);

    if (error) {
      console.error('Erro ao buscar estatísticas:', error);
      throw error;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stats = {
      total: data?.length || 0,
      pendentes: 0,
      emAndamento: 0,
      resolvidos: 0,
      urgentes: 0,
      hoje: 0,
    };

    data?.forEach((item) => {
      const createdAt = new Date(item.created_at);
      
      switch (item.status) {
        case 'pendente': stats.pendentes++; break;
        case 'em_andamento': 
        case 'aguardando_resposta': 
          stats.emAndamento++; break;
        case 'resolvido': stats.resolvidos++; break;
      }

      if (item.prioridade === 'urgente' && item.status !== 'resolvido') {
        stats.urgentes++;
      }

      if (createdAt >= today) {
        stats.hoje++;
      }
    });

    return stats;
  },
};

// ============================================
// SERVIÇO DE MENSAGENS DO TICKET
// ============================================

export const ticketMessagesService = {
  async listByTicket(ticketId: string): Promise<SupportTicketMessage[]> {
    const { data, error } = await supabase
      .from('support_ticket_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Erro ao listar mensagens:', error);
      throw error;
    }

    return data || [];
  },

  async create(message: Omit<SupportTicketMessage, 'id' | 'created_at'>): Promise<SupportTicketMessage> {
    const { data, error } = await supabase
      .from('support_ticket_messages')
      .insert(message)
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar mensagem:', error);
      throw error;
    }

    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('support_ticket_messages')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao deletar mensagem:', error);
      throw error;
    }
  },
};

// ============================================
// SERVIÇO DE CATEGORIAS
// ============================================

export const ticketCategoriesService = {
  async list(churchId: string): Promise<SupportTicketCategory[]> {
    const { data, error } = await supabase
      .from('support_ticket_categories')
      .select('*')
      .eq('church_id', churchId)
      .eq('ativo', true)
      .order('ordem', { ascending: true });

    if (error) {
      console.error('Erro ao listar categorias:', error);
      throw error;
    }

    return data || [];
  },

  async create(category: Omit<SupportTicketCategory, 'id' | 'created_at' | 'updated_at'>): Promise<SupportTicketCategory> {
    const { data, error } = await supabase
      .from('support_ticket_categories')
      .insert(category)
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar categoria:', error);
      throw error;
    }

    return data;
  },

  async update(id: string, updates: Partial<SupportTicketCategory>): Promise<SupportTicketCategory> {
    const { data, error } = await supabase
      .from('support_ticket_categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar categoria:', error);
      throw error;
    }

    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('support_ticket_categories')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao deletar categoria:', error);
      throw error;
    }
  },
};

// ============================================
// SERVIÇO DE MOTIVOS
// ============================================

export const ticketReasonsService = {
  async list(churchId: string): Promise<SupportTicketReason[]> {
    const { data, error } = await supabase
      .from('support_ticket_reasons')
      .select('*')
      .eq('church_id', churchId)
      .eq('ativo', true)
      .order('ordem', { ascending: true });

    if (error) {
      console.error('Erro ao listar motivos:', error);
      throw error;
    }

    return data || [];
  },

  async create(reason: Omit<SupportTicketReason, 'id' | 'created_at' | 'updated_at'>): Promise<SupportTicketReason> {
    const { data, error } = await supabase
      .from('support_ticket_reasons')
      .insert(reason)
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar motivo:', error);
      throw error;
    }

    return data;
  },

  async update(id: string, updates: Partial<SupportTicketReason>): Promise<SupportTicketReason> {
    const { data, error } = await supabase
      .from('support_ticket_reasons')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar motivo:', error);
      throw error;
    }

    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('support_ticket_reasons')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao deletar motivo:', error);
      throw error;
    }
  },
};
