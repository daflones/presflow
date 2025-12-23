import { supabase } from '../../lib/supabase';
import type { Client, ClientStatus, ClientCategory } from '../../types/database';

export type CreateClientInput = {
  name: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  status?: ClientStatus;
  category?: ClientCategory;
  tags?: string[];
  notes?: string;
  interest?: string;
  motivation?: string;
  expectation?: string;
  event_type?: string;
};

export type UpdateClientInput = Partial<CreateClientInput>;

export const clientsService = {
  async getAll(): Promise<Client[]> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return [];

    // Buscar church_id do usuário
    const { data: church } = await supabase
      .from('churches')
      .select('id')
      .eq('owner_id', userData.user.id)
      .single();

    if (!church) return [];

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('church_id', church.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map((client) => ({
      ...client,
      phone: client.whatsapp || client.phone,
    }));
  },

  async getById(id: string): Promise<Client | null> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data
      ? {
          ...data,
          phone: data.whatsapp || data.phone,
        }
      : null;
  },

  async create(input: CreateClientInput): Promise<Client> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Usuário não autenticado');

    // Buscar church_id diretamente da tabela churches pelo owner_id
    const { data: church } = await supabase
      .from('churches')
      .select('id')
      .eq('owner_id', userData.user.id)
      .single();

    if (!church) throw new Error('Igreja não encontrada');

    const { data, error } = await supabase
      .from('clients')
      .insert({
        church_id: church.id,
        name: input.name,
        email: input.email,
        phone: input.phone || input.whatsapp,
        whatsapp: input.whatsapp || input.phone,
        status: input.status || 'lead',
        category: input.category || 'sem-categoria',
        tags: input.tags || [],
        notes: input.notes,
        interest: input.interest,
        motivation: input.motivation,
        expectation: input.expectation,
        event_type: input.event_type,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, input: UpdateClientInput): Promise<Client> {
    const { data, error } = await supabase
      .from('clients')
      .update({
        ...input,
        phone: input.phone ?? input.whatsapp,
        whatsapp: input.whatsapp ?? input.phone,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async updateCategory(id: string, category: ClientCategory): Promise<Client> {
    return this.update(id, { category });
  },
};
