import { supabase } from '../../lib/supabase';
import type { Client, ClientStatus, ClientCategory } from '../../types/database';
import { getUserData } from '../../lib/user';

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
    const profile = await getUserData();
    if (!profile?.church_id) return [];

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('church_id', profile.church_id)
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
    const profile = await getUserData();
    if (!profile?.church_id) throw new Error('Igreja não encontrada');
    if (String(profile.role || '').toLowerCase() === 'consulta') {
      throw new Error('Somente visualização');
    }

    const { data, error } = await supabase
      .from('clients')
      .insert({
        church_id: profile.church_id,
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
    const profile = await getUserData();
    if (String(profile?.role || '').toLowerCase() === 'consulta') {
      throw new Error('Somente visualização');
    }

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
    const profile = await getUserData();
    if (String(profile?.role || '').toLowerCase() === 'consulta') {
      throw new Error('Somente visualização');
    }

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
