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
