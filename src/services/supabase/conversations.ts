import { supabase } from '../../lib/supabase';
import type { Conversation, Message } from '../../types/database';

export const conversationsService = {
  async getAll(): Promise<Conversation[]> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return [];

    const { data: church } = await supabase
      .from('churches')
      .select('id')
      .eq('owner_id', userData.user.id)
      .single();

    if (!church) return [];

    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('church_id', church.id)
      .order('last_message_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<Conversation | null> {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async getByRemoteJid(remoteJid: string): Promise<Conversation | null> {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('remote_jid', remoteJid)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async createOrUpdate(input: {
    remote_jid: string;
    contact_name?: string;
    contact_phone?: string;
    source?: 'whatsapp' | 'instagram';
    whatsapp_instance_id?: string;
  }): Promise<Conversation> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Usuário não autenticado');

    const { data: church } = await supabase
      .from('churches')
      .select('id')
      .eq('owner_id', userData.user.id)
      .single();

    if (!church) throw new Error('Igreja não encontrada');

    // Verificar se já existe
    const existing = await this.getByRemoteJid(input.remote_jid);

    if (existing) {
      const { data, error } = await supabase
        .from('conversations')
        .update({
          contact_name: input.contact_name || existing.contact_name,
          contact_phone: input.contact_phone || existing.contact_phone,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    const { data, error } = await supabase
      .from('conversations')
      .insert({
        church_id: church.id,
        remote_jid: input.remote_jid,
        contact_name: input.contact_name,
        contact_phone: input.contact_phone,
        source: input.source || 'whatsapp',
        whatsapp_instance_id: input.whatsapp_instance_id,
        status: 'open',
        unread_count: 0,
        is_group: input.remote_jid.includes('@g.us'),
        last_message_from_me: false,
        tags: [],
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateLastMessage(conversationId: string, message: {
    text?: string;
    timestamp: string;
    fromMe: boolean;
  }): Promise<void> {
    const { error } = await supabase
      .from('conversations')
      .update({
        last_message_text: message.text,
        last_message_at: message.timestamp,
        last_message_from_me: message.fromMe,
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversationId);

    if (error) throw error;
  },
};

export const messagesService = {
  async getByConversation(conversationId: string, limit = 50, offset = 0): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return (data || []).reverse();
  },

  async create(input: {
    conversation_id: string;
    message_id?: string;
    from_me: boolean;
    sender_jid?: string;
    sender_name?: string;
    message_type: 'text' | 'image' | 'audio' | 'video' | 'document' | 'sticker' | 'location' | 'contact';
    content?: string;
    caption?: string;
    media_url?: string;
    media_mimetype?: string;
    media_filename?: string;
    media_base64?: string;
    timestamp: string;
  }): Promise<Message> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Usuário não autenticado');

    const { data: church } = await supabase
      .from('churches')
      .select('id')
      .eq('owner_id', userData.user.id)
      .single();

    if (!church) throw new Error('Igreja não encontrada');

    const { data, error } = await supabase
      .from('messages')
      .insert({
        church_id: church.id,
        conversation_id: input.conversation_id,
        message_id: input.message_id,
        from_me: input.from_me,
        sender_jid: input.sender_jid,
        sender_name: input.sender_name,
        message_type: input.message_type,
        content: input.content,
        caption: input.caption,
        media_url: input.media_url,
        media_mimetype: input.media_mimetype,
        media_filename: input.media_filename,
        media_base64: input.media_base64,
        timestamp: input.timestamp,
        status: 'sent',
        reactions: [],
        is_deleted: false,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
