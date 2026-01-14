import { supabase } from '../../lib/supabase'
import { getUserData } from '../../lib/user'

// =====================================================
// TYPES
// =====================================================

export interface WhatsAppChat {
  id: string
  church_id: string
  instance_name: string
  remote_jid: string
  contact_name?: string
  contact_push_name?: string
  profile_picture_url?: string
  is_group: boolean
  unread_count: number
  last_message_at?: string
  last_message_preview?: string
  is_archived: boolean
  is_pinned: boolean
  created_at: string
  updated_at: string
}

export interface WhatsAppMessage {
  id: string
  church_id: string
  chat_id: string
  instance_name: string
  message_id: string
  remote_jid: string
  from_me: boolean
  sender_jid?: string
  sender_name?: string
  message_type: 'text' | 'image' | 'audio' | 'video' | 'document' | 'sticker' | 'location' | 'contact' | 'poll' | 'reaction'
  text_content?: string
  caption?: string
  media_url?: string
  media_mimetype?: string
  media_filename?: string
  media_size?: number
  media_duration?: number
  media_base64?: string
  thumbnail_base64?: string
  latitude?: number
  longitude?: number
  location_name?: string
  location_address?: string
  vcard?: string
  status: 'sent' | 'delivered' | 'read' | 'failed'
  is_edited: boolean
  is_deleted: boolean
  is_forwarded: boolean
  quoted_message_id?: string
  quoted_message_preview?: string
  reaction_emoji?: string
  reaction_to_message_id?: string
  message_timestamp: string
  created_at: string
  updated_at: string
}

export interface WhatsAppContact {
  id: string
  church_id: string
  instance_name: string
  jid: string
  phone_number?: string
  name?: string
  push_name?: string
  profile_picture_url?: string
  profile_status?: string
  is_business: boolean
  is_blocked: boolean
  last_seen?: string
  created_at: string
  updated_at: string
}

export interface CreateChatInput {
  instance_name: string
  remote_jid: string
  contact_name?: string
  contact_push_name?: string
  profile_picture_url?: string
  is_group?: boolean
}

export interface CreateMessageInput {
  chat_id: string
  instance_name: string
  message_id: string
  remote_jid: string
  from_me: boolean
  sender_jid?: string
  sender_name?: string
  message_type: WhatsAppMessage['message_type']
  text_content?: string
  caption?: string
  media_url?: string
  media_mimetype?: string
  media_filename?: string
  media_size?: number
  media_duration?: number
  media_base64?: string
  thumbnail_base64?: string
  latitude?: number
  longitude?: number
  location_name?: string
  location_address?: string
  vcard?: string
  quoted_message_id?: string
  quoted_message_preview?: string
  reaction_emoji?: string
  reaction_to_message_id?: string
  message_timestamp: string
}

// =====================================================
// SERVICE
// =====================================================

class WhatsAppMessagesService {
  
  private async getChurchId(): Promise<string> {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) throw new Error('Usuário não autenticado')

    // Preferir vínculo do perfil (users.church_id) para suportar usuários que não são owner.
    const profile = await getUserData()
    let churchId: string | null = profile?.church_id || null

    // Fallback: tentar por owner_id
    if (!churchId) {
      const { data: church } = await supabase
        .from('churches')
        .select('id')
        .eq('owner_id', userData.user.id)
        .single()

      if (!church) throw new Error('Igreja não encontrada')
      churchId = church.id
    }

    if (!churchId) throw new Error('Igreja não encontrada')
    return churchId
  }

  // =====================================================
  // CHATS
  // =====================================================

  async getChats(instanceName: string): Promise<WhatsAppChat[]> {
    void instanceName
    return []
  }

  async getChatByJid(instanceName: string, remoteJid: string): Promise<WhatsAppChat | null> {
    void instanceName
    void remoteJid
    return null
  }

  async createOrUpdateChat(input: CreateChatInput): Promise<WhatsAppChat> {
    // Tabela removida: manter compatibilidade sem bater no Supabase
    const nowIso = new Date().toISOString()
    return {
      id: `disabled:${input.instance_name}:${input.remote_jid}`,
      church_id: 'disabled',
      instance_name: input.instance_name,
      remote_jid: input.remote_jid,
      contact_name: input.contact_name,
      contact_push_name: input.contact_push_name,
      profile_picture_url: input.profile_picture_url,
      is_group: input.is_group || input.remote_jid.includes('@g.us'),
      unread_count: 0,
      is_archived: false,
      is_pinned: false,
      created_at: nowIso,
      updated_at: nowIso,
    }
  }

  async updateChatLastMessage(chatId: string, preview: string, timestamp: string): Promise<void> {
    void chatId
    void preview
    void timestamp
  }

  async updateChatUnreadCount(chatId: string, count: number): Promise<void> {
    void chatId
    void count
  }

  async incrementUnreadCount(chatId: string): Promise<void> {
    void chatId
  }

  async archiveChat(chatId: string, archived: boolean): Promise<void> {
    void chatId
    void archived
  }

  async pinChat(chatId: string, pinned: boolean): Promise<void> {
    void chatId
    void pinned
  }

  // =====================================================
  // MESSAGES
  // =====================================================

  async getMessages(chatId: string, limit: number = 50, offset: number = 0): Promise<WhatsAppMessage[]> {
    const { data, error } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .eq('chat_id', chatId)
      .eq('is_deleted', false)
      .order('message_timestamp', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error
    return (data || []).reverse() // Return in chronological order
  }

  async getMessageById(messageId: string, instanceName: string): Promise<WhatsAppMessage | null> {
    const churchId = await this.getChurchId()
    
    const { data, error } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .eq('church_id', churchId)
      .eq('instance_name', instanceName)
      .eq('message_id', messageId)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  async createMessage(input: CreateMessageInput): Promise<WhatsAppMessage> {
    const churchId = await this.getChurchId()

    const { data, error } = await supabase
      .from('whatsapp_messages')
      .upsert(
        {
          church_id: churchId,
          ...input,
          status: input.from_me ? 'sent' : 'delivered',
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'church_id,instance_name,message_id',
        }
      )
      .select()
      .single()

    if (error) throw error

    const preview = input.text_content || input.caption || `[${input.message_type}]`
    await this.updateChatLastMessage(input.chat_id, preview.substring(0, 100), input.message_timestamp)

    if (!input.from_me) {
      await this.incrementUnreadCount(input.chat_id)
    }

    return data
  }

  async updateMessageStatus(messageId: string, instanceName: string, status: WhatsAppMessage['status']): Promise<void> {
    const churchId = await this.getChurchId()
    
    const { error } = await supabase
      .from('whatsapp_messages')
      .update({ status })
      .eq('church_id', churchId)
      .eq('instance_name', instanceName)
      .eq('message_id', messageId)

    if (error) throw error
  }

  async softDeleteMessage(messageId: string, instanceName: string): Promise<void> {
    const churchId = await this.getChurchId()
    
    // Soft delete - never actually delete messages
    const { error } = await supabase
      .from('whatsapp_messages')
      .update({ 
        is_deleted: true,
        text_content: '[Mensagem apagada]',
        media_url: null,
        media_base64: null
      })
      .eq('church_id', churchId)
      .eq('instance_name', instanceName)
      .eq('message_id', messageId)

    if (error) throw error
  }

  async searchMessages(instanceName: string, query: string, limit: number = 50): Promise<WhatsAppMessage[]> {
    const churchId = await this.getChurchId()
    
    const { data, error } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .eq('church_id', churchId)
      .eq('instance_name', instanceName)
      .eq('is_deleted', false)
      .ilike('text_content', `%${query}%`)
      .order('message_timestamp', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  }

  // =====================================================
  // CONTACTS
  // =====================================================

  async getContacts(instanceName: string): Promise<WhatsAppContact[]> {
    const churchId = await this.getChurchId()
    
    const { data, error } = await supabase
      .from('whatsapp_contacts')
      .select('*')
      .eq('church_id', churchId)
      .eq('instance_name', instanceName)
      .order('name', { ascending: true })

    if (error) throw error
    return data || []
  }

  async getContactByJid(instanceName: string, jid: string): Promise<WhatsAppContact | null> {
    const churchId = await this.getChurchId()
    
    const { data, error } = await supabase
      .from('whatsapp_contacts')
      .select('*')
      .eq('church_id', churchId)
      .eq('instance_name', instanceName)
      .eq('jid', jid)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  async createOrUpdateContact(instanceName: string, contact: Partial<WhatsAppContact>): Promise<WhatsAppContact> {
    const churchId = await this.getChurchId()
    
    if (!contact.jid) throw new Error('JID é obrigatório')

    const existing = await this.getContactByJid(instanceName, contact.jid)
    
    if (existing) {
      const { data, error } = await supabase
        .from('whatsapp_contacts')
        .update({
          ...contact,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw error
      return data
    } else {
      const { data, error } = await supabase
        .from('whatsapp_contacts')
        .insert({
          church_id: churchId,
          instance_name: instanceName,
          ...contact
        })
        .select()
        .single()

      if (error) throw error
      return data
    }
  }

  // =====================================================
  // MEDIA
  // =====================================================

  async saveMedia(messageId: string, mediaData: {
    media_type: string
    mimetype?: string
    filename?: string
    file_size?: number
    duration?: number
    width?: number
    height?: number
    url?: string
    base64_data?: string
    thumbnail_base64?: string
  }): Promise<void> {
    const churchId = await this.getChurchId()
    
    const { error } = await supabase
      .from('whatsapp_media')
      .insert({
        church_id: churchId,
        message_id: messageId,
        ...mediaData,
        is_downloaded: !!mediaData.base64_data
      })

    if (error) throw error
  }

  async getMediaByMessageId(messageId: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('whatsapp_media')
      .select('*')
      .eq('message_id', messageId)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  }
}

export const whatsappMessagesService = new WhatsAppMessagesService()
