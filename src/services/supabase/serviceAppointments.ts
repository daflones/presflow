import { supabase } from '../../lib/supabase';
import type { ServiceAppointment } from '../../types/database';
import { getUserData } from '../../lib/user';

export type CreateServiceAppointmentInput = {
  service_id: string;
  client_id?: string;
  data_agendamento: string;
  hora_inicio?: string;
  hora_fim?: string;
  solicitante_nome: string;
  solicitante_telefone?: string;
  solicitante_email?: string;
  solicitante_cpf?: string;
  detalhes?: Record<string, any>;
  documentos_entregues?: any[];
  documentos_pendentes?: string[];
  valor_total?: number;
  valor_sinal_pago?: number;
  valor_restante?: number;
  observacoes?: string;
  status?: string;
  pagamento_status?: string;
  forma_pagamento?: string;
  origem?: string;
};

export type UpdateServiceAppointmentInput = Partial<CreateServiceAppointmentInput>;

export const serviceAppointmentsService = {
  async getAll(): Promise<ServiceAppointment[]> {
    const profile = await getUserData();
    if (!profile?.church_id) return [];

    const { data, error } = await supabase
      .from('service_appointments')
      .select('*')
      .eq('church_id', profile.church_id)
      .order('data_agendamento', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getInferredEmailsByClientIds(clientIds: string[]): Promise<Record<string, string>> {
    const profile = await getUserData();
    if (!profile?.church_id) return {};
    const ids = (clientIds || []).filter(Boolean);
    if (ids.length === 0) return {};

    const { data, error } = await supabase
      .from('service_appointments')
      .select('client_id, solicitante_email, updated_at, created_at')
      .eq('church_id', profile.church_id)
      .in('client_id', ids)
      .not('solicitante_email', 'is', null)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    const map: Record<string, string> = {};
    for (const row of data || []) {
      const clientId = String((row as any).client_id || '').trim();
      const email = String((row as any).solicitante_email || '').trim();
      if (!clientId || !email) continue;
      if (!map[clientId]) {
        map[clientId] = email;
      }
    }
    return map;
  },

  async getByClientId(clientId: string): Promise<ServiceAppointment[]> {
    const profile = await getUserData();
    if (!profile?.church_id) return [];

    const { data, error } = await supabase
      .from('service_appointments')
      .select('*')
      .eq('church_id', profile.church_id)
      .eq('client_id', clientId)
      .order('data_agendamento', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<ServiceAppointment | null> {
    const { data, error } = await supabase
      .from('service_appointments')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(input: CreateServiceAppointmentInput): Promise<ServiceAppointment> {
    const profile = await getUserData();
    if (!profile?.church_id) throw new Error('Igreja não encontrada');
    if (String(profile.role || '').toLowerCase() === 'consulta') {
      throw new Error('Somente visualização');
    }

    const { data, error } = await supabase
      .from('service_appointments')
      .insert({
        church_id: profile.church_id,
        service_id: input.service_id,
        client_id: input.client_id || null,
        data_agendamento: input.data_agendamento,
        hora_inicio: input.hora_inicio || null,
        hora_fim: input.hora_fim || null,
        solicitante_nome: input.solicitante_nome,
        solicitante_telefone: input.solicitante_telefone || null,
        solicitante_email: input.solicitante_email || null,
        solicitante_cpf: input.solicitante_cpf || null,
        detalhes: input.detalhes || {},
        documentos_entregues: input.documentos_entregues || [],
        documentos_pendentes: input.documentos_pendentes || [],
        valor_total: input.valor_total ?? null,
        valor_sinal_pago: input.valor_sinal_pago ?? null,
        valor_restante: input.valor_restante ?? null,
        observacoes: input.observacoes || null,
        status: input.status || 'solicitado',
        pagamento_status: input.pagamento_status || 'pendente',
        forma_pagamento: input.forma_pagamento || null,
        origem: input.origem || 'manual',
        atendido_por: profile.auth_id,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, input: UpdateServiceAppointmentInput): Promise<ServiceAppointment> {
    const profile = await getUserData();
    if (String(profile?.role || '').toLowerCase() === 'consulta') {
      throw new Error('Somente visualização');
    }

    const { data, error } = await supabase
      .from('service_appointments')
      .update({
        ...input,
        client_id: input.client_id === undefined ? undefined : input.client_id || null,
        hora_inicio: input.hora_inicio === undefined ? undefined : input.hora_inicio || null,
        hora_fim: input.hora_fim === undefined ? undefined : input.hora_fim || null,
        solicitante_telefone:
          input.solicitante_telefone === undefined ? undefined : input.solicitante_telefone || null,
        solicitante_email: input.solicitante_email === undefined ? undefined : input.solicitante_email || null,
        solicitante_cpf: input.solicitante_cpf === undefined ? undefined : input.solicitante_cpf || null,
        detalhes: input.detalhes === undefined ? undefined : input.detalhes || {},
        documentos_entregues: input.documentos_entregues === undefined ? undefined : input.documentos_entregues || [],
        documentos_pendentes: input.documentos_pendentes === undefined ? undefined : input.documentos_pendentes || [],
        valor_total: input.valor_total === undefined ? undefined : (input.valor_total ?? null),
        valor_sinal_pago: input.valor_sinal_pago === undefined ? undefined : (input.valor_sinal_pago ?? null),
        valor_restante: input.valor_restante === undefined ? undefined : (input.valor_restante ?? null),
        observacoes: input.observacoes === undefined ? undefined : input.observacoes || null,
        forma_pagamento: input.forma_pagamento === undefined ? undefined : input.forma_pagamento || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const profile = await getUserData();
    if (String(profile?.role || '').toLowerCase() === 'consulta') {
      throw new Error('Somente visualização');
    }

    const { error } = await supabase.from('service_appointments').delete().eq('id', id);

    if (error) throw error;
  },
};
