import { supabase } from '../../lib/supabase';
import type { CalendarEvent } from '../../types/database';
import { getUserData } from '../../lib/user';

export type CreateEventInput = {
  title: string;
  description?: string;
  location?: string;
  notes?: string;
  start_at: string;
  end_at?: string;
  all_day?: boolean;
  color?: string;
  event_type?: string;
  cliente_id?: string;
};

export type UpdateEventInput = Partial<CreateEventInput>;

export const calendarService = {
  async getAll(): Promise<CalendarEvent[]> {
    const profile = await getUserData();
    if (!profile?.church_id) return [];

    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('church_id', profile.church_id)
      .order('start_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<CalendarEvent | null> {
    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async getByDateRange(startDate: string, endDate: string): Promise<CalendarEvent[]> {
    const profile = await getUserData();
    if (!profile?.church_id) return [];

    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('church_id', profile.church_id)
      .gte('start_at', startDate)
      .lte('start_at', endDate)
      .order('start_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async create(input: CreateEventInput): Promise<CalendarEvent> {
    const profile = await getUserData();
    if (!profile?.church_id) throw new Error('Igreja não encontrada');
    if (String(profile.role || '').toLowerCase() === 'consulta') {
      throw new Error('Somente visualização');
    }

    const { data, error } = await supabase
      .from('calendar_events')
      .insert({
        church_id: profile.church_id,
        created_by: profile.auth_id,
        title: input.title,
        description: input.description,
        location: input.location,
        notes: input.notes,
        start_at: input.start_at,
        end_at: input.end_at,
        all_day: input.all_day || false,
        color: input.color || '#3b82f6',
        event_type: input.event_type || 'general',
        cliente_id: input.cliente_id || null,
        attendees: [],
        reminders: [],
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, input: UpdateEventInput): Promise<CalendarEvent> {
    const profile = await getUserData();
    if (String(profile?.role || '').toLowerCase() === 'consulta') {
      throw new Error('Somente visualização');
    }

    const { data, error } = await supabase
      .from('calendar_events')
      .update({
        ...input,
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
      .from('calendar_events')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getByClienteId(clienteId: string): Promise<CalendarEvent[]> {
    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('cliente_id', clienteId)
      .order('start_at', { ascending: false });

    if (error) {
      console.error('[calendar.getByClienteId] Erro:', error);
      return [];
    }
    return data || [];
  },
};
