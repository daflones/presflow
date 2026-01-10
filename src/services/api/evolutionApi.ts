/**
 * Evolution API Service - Complete WhatsApp Web Implementation
 * Based on Evolution API v1 Documentation
 * https://doc.evolution-api.com/v1/api-reference
 */

import { supabase } from '../../lib/supabase'

// =====================================================
// TYPES
// =====================================================

export interface SendTextOptions {
  number: string
  text: string
  delay?: number
  linkPreview?: boolean
  mentionsEveryOne?: boolean
  mentioned?: string[]
}

export interface SendMediaOptions {
  number: string
  mediatype: 'image' | 'video' | 'document' | 'audio'
  mimetype?: string
  caption?: string
  fileName?: string
  media: string // URL or base64
  delay?: number
}

export interface SendAudioOptions {
  number: string
  audio: string // URL or base64
  delay?: number
  encoding?: boolean // PTT (push to talk) format
}

export interface SendLocationOptions {
  number: string
  name: string
  address: string
  latitude: number
  longitude: number
  delay?: number
}

export interface SendContactOptions {
  number: string
  contact: {
    fullName: string
    wuid: string
    phoneNumber: string
    organization?: string
    email?: string
    url?: string
  }[]
}

export interface SendReactionOptions {
  key: {
    remoteJid: string
    fromMe: boolean
    id: string
  }
  reaction: string // emoji
}

export interface SendPollOptions {
  number: string
  name: string
  selectableCount: number
  values: string[]
  delay?: number
}

export interface SendListOptions {
  number: string
  title: string
  description: string
  buttonText: string
  footerText?: string
  sections: {
    title: string
    rows: {
      title: string
      description?: string
      rowId: string
    }[]
  }[]
  delay?: number
}

export interface SendButtonsOptions {
  number: string
  title: string
  description: string
  footer?: string
  buttons: {
    type: 'reply' | 'copy' | 'url' | 'call'
    displayText: string
    id?: string
    copyCode?: string
    url?: string
    phoneNumber?: string
  }[]
  delay?: number
}

export interface FindMessagesOptions {
  where: {
    key?: {
      remoteJid?: string
      fromMe?: boolean
      id?: string
    }
    message?: any
  }
  limit?: number
}

export interface ProfileInfo {
  wuid: string
  name?: string
  picture?: string
  status?: string
  isBusiness?: boolean
}

export interface ChatInfo {
  id: string
  name?: string
  unreadCount?: number
  lastMessage?: any
  archived?: boolean
  pinned?: boolean
}

export interface MessageInfo {
  key: {
    remoteJid: string
    fromMe: boolean
    id: string
    participant?: string
  }
  pushName?: string
  message: any
  messageType: string
  messageTimestamp: number
  status?: string
}

// =====================================================
// EVOLUTION API SERVICE
// =====================================================

class EvolutionApiService {
  private baseUrl: string
  private apiKey: string

  constructor() {
    // Em produção (HTTPS), não podemos chamar a Evolution API via HTTP direto do browser (Mixed Content).
    // Então usamos o backend como proxy (mesma origem) em /api/evolution.
    const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:'
    this.baseUrl = isHttps ? '/api/evolution' : (import.meta.env.VITE_EVOLUTION_API_URL || '')
    this.apiKey = isHttps ? '' : (import.meta.env.VITE_EVOLUTION_API_KEY || '')
    this.baseUrl = this.baseUrl.endsWith('/') ? this.baseUrl.slice(0, -1) : this.baseUrl
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
    const url = `${this.baseUrl}${cleanEndpoint}`

    const authHeaders: Record<string, string> = {}
    if (this.baseUrl.startsWith('/api')) {
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token
      if (token) {
        authHeaders.Authorization = `Bearer ${token}`
      }
    }

    const controller = new AbortController()
    const timeoutMs = 15000
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
    
    let response: Response
    try {
      response = await fetch(url, {
        ...options,
        mode: 'cors',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey ? { apikey: this.apiKey } : {}),
          'Accept': 'application/json',
          ...authHeaders,
          ...options.headers,
        },
      })
    } finally {
      clearTimeout(timeoutId)
    }

    if (!response.ok) {
      const error = await response.text()
      console.error(`[EvolutionAPI] Error ${response.status}:`, error)
      throw new Error(`Evolution API Error: ${response.status} - ${error}`)
    }

    return response.json()
  }

  private normalizeBase64(input: string): string {
    if (!input) return input
    // Accept both pure base64 and Data URL formats
    if (input.startsWith('data:') && input.includes(',')) {
      return input.split(',')[1] || ''
    }
    return input
  }

  // =====================================================
  // SEND MESSAGE ENDPOINTS
  // =====================================================

  /**
   * POST /message/sendText/{instanceName}
   * Send plain text message
   */
  async sendText(instanceName: string, options: SendTextOptions): Promise<any> {
    const payload: any = {
      number: this.formatNumber(options.number),
      text: options.text,
      delay: options.delay || 1200,
      linkPreview: options.linkPreview !== false
    }
    
    // Only include mentions if they exist and have items
    if (options.mentionsEveryOne) {
      payload.mentionsEveryOne = true
    }
    if (options.mentioned && options.mentioned.length > 0) {
      payload.mentioned = options.mentioned
    }
    
    return this.request(`/message/sendText/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify(payload)
    })
  }

  /**
   * POST /message/sendMedia/{instanceName}
   * Send media (image, video, document)
   */
  async sendMedia(instanceName: string, options: SendMediaOptions): Promise<any> {
    return this.request(`/message/sendMedia/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify({
        number: this.formatNumber(options.number),
        mediatype: options.mediatype,
        mimetype: options.mimetype,
        caption: options.caption || '',
        fileName: options.fileName,
        media: this.normalizeBase64(options.media),
        delay: options.delay || 1200
      })
    })
  }

  /**
   * POST /message/sendWhatsAppAudio/{instanceName}
   * Send audio message (PTT format)
   */
  async sendAudio(instanceName: string, options: SendAudioOptions): Promise<any> {
    return this.request(`/message/sendWhatsAppAudio/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify({
        number: this.formatNumber(options.number),
        audio: this.normalizeBase64(options.audio),
        delay: options.delay || 1200,
        encoding: options.encoding !== false
      })
    })
  }

  /**
   * POST /message/sendSticker/{instanceName}
   * Send sticker
   */
  async sendSticker(instanceName: string, number: string, sticker: string): Promise<any> {
    return this.request(`/message/sendSticker/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify({
        number: this.formatNumber(number),
        sticker
      })
    })
  }

  /**
   * POST /message/sendLocation/{instanceName}
   * Send location
   */
  async sendLocation(instanceName: string, options: SendLocationOptions): Promise<any> {
    return this.request(`/message/sendLocation/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify({
        number: this.formatNumber(options.number),
        name: options.name,
        address: options.address,
        latitude: options.latitude,
        longitude: options.longitude,
        delay: options.delay || 1200
      })
    })
  }

  /**
   * POST /message/sendContact/{instanceName}
   * Send contact card
   */
  async sendContact(instanceName: string, options: SendContactOptions): Promise<any> {
    return this.request(`/message/sendContact/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify({
        number: this.formatNumber(options.number),
        contact: options.contact
      })
    })
  }

  /**
   * POST /message/sendReaction/{instanceName}
   * Send reaction to a message
   */
  async sendReaction(instanceName: string, options: SendReactionOptions): Promise<any> {
    return this.request(`/message/sendReaction/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify({
        key: options.key,
        reaction: options.reaction
      })
    })
  }

  /**
   * POST /message/sendPoll/{instanceName}
   * Send poll
   */
  async sendPoll(instanceName: string, options: SendPollOptions): Promise<any> {
    return this.request(`/message/sendPoll/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify({
        number: this.formatNumber(options.number),
        name: options.name,
        selectableCount: options.selectableCount,
        values: options.values,
        delay: options.delay || 1200
      })
    })
  }

  /**
   * POST /message/sendList/{instanceName}
   * Send list message
   */
  async sendList(instanceName: string, options: SendListOptions): Promise<any> {
    return this.request(`/message/sendList/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify({
        number: this.formatNumber(options.number),
        title: options.title,
        description: options.description,
        buttonText: options.buttonText,
        footerText: options.footerText,
        sections: options.sections,
        delay: options.delay || 1200
      })
    })
  }

  /**
   * POST /message/sendButtons/{instanceName}
   * Send buttons message
   */
  async sendButtons(instanceName: string, options: SendButtonsOptions): Promise<any> {
    return this.request(`/message/sendButtons/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify({
        number: this.formatNumber(options.number),
        title: options.title,
        description: options.description,
        footer: options.footer,
        buttons: options.buttons,
        delay: options.delay || 1200
      })
    })
  }

  // =====================================================
  // CHAT CONTROLLER ENDPOINTS
  // =====================================================

  /**
   * POST /chat/checkIsWhatsApp/{instanceName}
   * Check if number is on WhatsApp
   */
  async checkIsWhatsApp(instanceName: string, numbers: string[]): Promise<any> {
    return this.request(`/chat/checkIsWhatsApp/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify({
        numbers: numbers.map(n => this.formatNumber(n))
      })
    })
  }

  /**
   * POST /chat/markMessageAsRead/{instanceName}
   * Mark message as read
   */
  async markMessageAsRead(instanceName: string, remoteJid: string, messageId: string): Promise<any> {
    return this.request(`/chat/markMessageAsRead/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify({
        readMessages: [{
          remoteJid,
          id: messageId
        }]
      })
    })
  }

  /**
   * POST /chat/markMessageAsUnread/{instanceName}
   * Mark message as unread
   */
  async markMessageAsUnread(instanceName: string, remoteJid: string): Promise<any> {
    return this.request(`/chat/markMessageAsUnread/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify({
        chat: remoteJid
      })
    })
  }

  /**
   * POST /chat/archiveChat/{instanceName}
   * Archive/unarchive chat
   */
  async archiveChat(instanceName: string, remoteJid: string, archive: boolean): Promise<any> {
    return this.request(`/chat/archiveChat/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify({
        chat: remoteJid,
        archive
      })
    })
  }

  /**
   * DELETE /chat/deleteMessageForEveryone/{instanceName}
   * Delete message for everyone
   */
  async deleteMessageForEveryone(instanceName: string, remoteJid: string, messageId: string, fromMe: boolean): Promise<any> {
    return this.request(`/chat/deleteMessageForEveryone/${instanceName}`, {
      method: 'DELETE',
      body: JSON.stringify({
        key: {
          remoteJid,
          fromMe,
          id: messageId
        }
      })
    })
  }

  /**
   * POST /chat/updateMessage/{instanceName}
   * Update/edit a message
   */
  async updateMessage(instanceName: string, remoteJid: string, messageId: string, text: string): Promise<any> {
    return this.request(`/chat/updateMessage/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify({
        key: {
          remoteJid,
          fromMe: true,
          id: messageId
        },
        text
      })
    })
  }

  /**
   * POST /chat/sendPresence/{instanceName}
   * Send presence (typing, recording, etc)
   */
  async sendPresence(instanceName: string, remoteJid: string, presence: 'composing' | 'recording' | 'paused'): Promise<any> {
    return this.request(`/chat/sendPresence/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify({
        number: remoteJid,
        presence
      })
    })
  }

  /**
   * POST /chat/updateBlockStatus/{instanceName}
   * Block/unblock contact
   */
  async updateBlockStatus(instanceName: string, remoteJid: string, status: 'block' | 'unblock'): Promise<any> {
    return this.request(`/chat/updateBlockStatus/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify({
        number: remoteJid,
        status
      })
    })
  }

  /**
   * POST /chat/fetchProfilePictureUrl/{instanceName}
   * Get profile picture URL
   */
  async fetchProfilePictureUrl(instanceName: string, number: string): Promise<{ profilePictureUrl: string }> {
    return this.request(`/chat/fetchProfilePictureUrl/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify({
        number: this.formatNumber(number)
      })
    })
  }

  /**
   * POST /chat/getBase64FromMediaMessage/{instanceName}
   * Get base64 from media message
   */
  async getBase64FromMediaMessage(instanceName: string, messageId: string, remoteJid: string): Promise<{ base64: string; mimetype: string }> {
    return this.request(`/chat/getBase64FromMediaMessage/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify({
        message: {
          key: {
            remoteJid,
            id: messageId
          }
        },
        convertToMp4: false
      })
    })
  }

  /**
   * POST /chat/findContacts/{instanceName}
   * Find contacts
   */
  async findContacts(instanceName: string, where?: { id?: string; pushName?: string }): Promise<any[]> {
    return this.request(`/chat/findContacts/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify({ where: where || {} })
    })
  }

  /**
   * POST /chat/findMessages/{instanceName}
   * Find messages
   */
  async findMessages(instanceName: string, options: FindMessagesOptions): Promise<MessageInfo[]> {
    return this.request(`/chat/findMessages/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify(options)
    })
  }

  /**
   * POST /chat/findStatusMessage/{instanceName}
   * Find status messages
   */
  async findStatusMessage(instanceName: string): Promise<any[]> {
    return this.request(`/chat/findStatusMessage/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify({})
    })
  }

  /**
   * POST /chat/findChats/{instanceName}
   * Find all chats
   */
  async findChats(instanceName: string): Promise<ChatInfo[]> {
    return this.request(`/chat/findChats/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify({})
    })
  }

  // =====================================================
  // PROFILE SETTINGS ENDPOINTS
  // =====================================================

  /**
   * POST /chat/fetchBusinessProfile/{instanceName}
   * Fetch business profile
   */
  async fetchBusinessProfile(instanceName: string, number: string): Promise<any> {
    return this.request(`/chat/fetchBusinessProfile/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify({
        number: this.formatNumber(number)
      })
    })
  }

  /**
   * POST /chat/fetchProfile/{instanceName}
   * Fetch profile info
   */
  async fetchProfile(instanceName: string, number: string): Promise<ProfileInfo> {
    return this.request(`/chat/fetchProfile/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify({
        number: this.formatNumber(number)
      })
    })
  }

  /**
   * POST /chat/updateProfileName/{instanceName}
   * Update profile name
   */
  async updateProfileName(instanceName: string, name: string): Promise<any> {
    return this.request(`/chat/updateProfileName/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify({ name })
    })
  }

  /**
   * POST /chat/updateProfileStatus/{instanceName}
   * Update profile status
   */
  async updateProfileStatus(instanceName: string, status: string): Promise<any> {
    return this.request(`/chat/updateProfileStatus/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify({ status })
    })
  }

  /**
   * POST /chat/updateProfilePicture/{instanceName}
   * Update profile picture
   */
  async updateProfilePicture(instanceName: string, picture: string): Promise<any> {
    return this.request(`/chat/updateProfilePicture/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify({ picture })
    })
  }

  /**
   * DELETE /chat/removeProfilePicture/{instanceName}
   * Remove profile picture
   */
  async removeProfilePicture(instanceName: string): Promise<any> {
    return this.request(`/chat/removeProfilePicture/${instanceName}`, {
      method: 'DELETE'
    })
  }

  /**
   * GET /chat/fetchPrivacySettings/{instanceName}
   * Fetch privacy settings
   */
  async fetchPrivacySettings(instanceName: string): Promise<any> {
    return this.request(`/chat/fetchPrivacySettings/${instanceName}`, {
      method: 'GET'
    })
  }

  /**
   * POST /chat/updatePrivacySettings/{instanceName}
   * Update privacy settings
   */
  async updatePrivacySettings(instanceName: string, settings: any): Promise<any> {
    return this.request(`/chat/updatePrivacySettings/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify(settings)
    })
  }

  // =====================================================
  // GROUP CONTROLLER ENDPOINTS
  // =====================================================

  /**
   * POST /group/create/{instanceName}
   * Create group
   */
  async createGroup(instanceName: string, subject: string, participants: string[], description?: string): Promise<any> {
    return this.request(`/group/create/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify({
        subject,
        participants: participants.map(p => this.formatNumber(p)),
        description
      })
    })
  }

  /**
   * POST /group/updateGroupPicture/{instanceName}
   * Update group picture
   */
  async updateGroupPicture(instanceName: string, groupJid: string, image: string): Promise<any> {
    return this.request(`/group/updateGroupPicture/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify({
        groupJid,
        image
      })
    })
  }

  /**
   * POST /group/updateGroupSubject/{instanceName}
   * Update group subject/name
   */
  async updateGroupSubject(instanceName: string, groupJid: string, subject: string): Promise<any> {
    return this.request(`/group/updateGroupSubject/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify({
        groupJid,
        subject
      })
    })
  }

  /**
   * POST /group/updateGroupDescription/{instanceName}
   * Update group description
   */
  async updateGroupDescription(instanceName: string, groupJid: string, description: string): Promise<any> {
    return this.request(`/group/updateGroupDescription/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify({
        groupJid,
        description
      })
    })
  }

  /**
   * GET /group/inviteCode/{instanceName}
   * Get group invite code
   */
  async fetchInviteCode(instanceName: string, groupJid: string): Promise<{ inviteCode: string; inviteUrl: string }> {
    return this.request(`/group/inviteCode/${instanceName}?groupJid=${encodeURIComponent(groupJid)}`, {
      method: 'GET'
    })
  }

  /**
   * POST /group/revokeInviteCode/{instanceName}
   * Revoke group invite code
   */
  async revokeInviteCode(instanceName: string, groupJid: string): Promise<any> {
    return this.request(`/group/revokeInviteCode/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify({ groupJid })
    })
  }

  /**
   * POST /group/sendInvite/{instanceName}
   * Send group invite
   */
  async sendGroupInvite(instanceName: string, groupJid: string, numbers: string[], description?: string): Promise<any> {
    return this.request(`/group/sendInvite/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify({
        groupJid,
        numbers: numbers.map(n => this.formatNumber(n)),
        description
      })
    })
  }

  /**
   * GET /group/findGroupByInviteCode/{instanceName}
   * Find group by invite code
   */
  async findGroupByInviteCode(instanceName: string, inviteCode: string): Promise<any> {
    return this.request(`/group/findGroupByInviteCode/${instanceName}?inviteCode=${encodeURIComponent(inviteCode)}`, {
      method: 'GET'
    })
  }

  /**
   * GET /group/findGroupByJid/{instanceName}
   * Find group by JID
   */
  async findGroupByJid(instanceName: string, groupJid: string): Promise<any> {
    return this.request(`/group/findGroupByJid/${instanceName}?groupJid=${encodeURIComponent(groupJid)}`, {
      method: 'GET'
    })
  }

  /**
   * GET /group/fetchAllGroups/{instanceName}
   * Fetch all groups
   */
  async fetchAllGroups(instanceName: string, getParticipants: boolean = false): Promise<any[]> {
    return this.request(`/group/fetchAllGroups/${instanceName}?getParticipants=${getParticipants}`, {
      method: 'GET'
    })
  }

  /**
   * GET /group/participants/{instanceName}
   * Get group participants
   */
  async findGroupMembers(instanceName: string, groupJid: string): Promise<any[]> {
    return this.request(`/group/participants/${instanceName}?groupJid=${encodeURIComponent(groupJid)}`, {
      method: 'GET'
    })
  }

  /**
   * POST /group/updateParticipant/{instanceName}
   * Update group members (add, remove, promote, demote)
   */
  async updateGroupMembers(instanceName: string, groupJid: string, action: 'add' | 'remove' | 'promote' | 'demote', participants: string[]): Promise<any> {
    return this.request(`/group/updateParticipant/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify({
        groupJid,
        action,
        participants: participants.map(p => this.formatNumber(p))
      })
    })
  }

  /**
   * POST /group/updateSetting/{instanceName}
   * Update group settings
   */
  async updateGroupSetting(instanceName: string, groupJid: string, action: 'announcement' | 'not_announcement' | 'locked' | 'unlocked'): Promise<any> {
    return this.request(`/group/updateSetting/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify({
        groupJid,
        action
      })
    })
  }

  /**
   * POST /group/toggleEphemeral/{instanceName}
   * Toggle ephemeral messages
   */
  async toggleEphemeral(instanceName: string, groupJid: string, expiration: number): Promise<any> {
    return this.request(`/group/toggleEphemeral/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify({
        groupJid,
        expiration // 0, 86400 (1 day), 604800 (7 days), 7776000 (90 days)
      })
    })
  }

  /**
   * DELETE /group/leaveGroup/{instanceName}
   * Leave group
   */
  async leaveGroup(instanceName: string, groupJid: string): Promise<any> {
    return this.request(`/group/leaveGroup/${instanceName}`, {
      method: 'DELETE',
      body: JSON.stringify({ groupJid })
    })
  }

  // =====================================================
  // INSTANCE CONTROLLER ENDPOINTS
  // =====================================================

  /**
   * GET /instance/fetchInstances
   * Fetch all instances
   */
  async fetchInstances(): Promise<any[]> {
    const result = await this.request<any[]>('/instance/fetchInstances', { method: 'GET' })
    return result || []
  }

  /**
   * GET /instance/connectionState/{instanceName}
   * Get connection state
   */
  async getConnectionState(instanceName: string): Promise<{ state: string }> {
    return this.request(`/instance/connectionState/${instanceName}`, { method: 'GET' })
  }

  /**
   * GET /instance/connect/{instanceName}
   * Connect instance and get QR code
   */
  async connectInstance(instanceName: string): Promise<any> {
    return this.request(`/instance/connect/${instanceName}`, { method: 'GET' })
  }

  /**
   * DELETE /instance/logout/{instanceName}
   * Logout instance
   */
  async logoutInstance(instanceName: string): Promise<any> {
    return this.request(`/instance/logout/${instanceName}`, { method: 'DELETE' })
  }

  /**
   * DELETE /instance/delete/{instanceName}
   * Delete instance
   */
  async deleteInstance(instanceName: string): Promise<any> {
    return this.request(`/instance/delete/${instanceName}`, { method: 'DELETE' })
  }

  /**
   * POST /instance/restart/{instanceName}
   * Restart instance
   */
  async restartInstance(instanceName: string): Promise<any> {
    return this.request(`/instance/restart/${instanceName}`, { method: 'POST' })
  }

  // =====================================================
  // HELPER METHODS
  // =====================================================

  /**
   * Format phone number to WhatsApp format
   */
  formatNumber(number: string): string {
    // If already in JID format, return as-is
    if (number.includes('@s.whatsapp.net') || number.includes('@g.us') || number.includes('@lid')) {
      return number
    }
    // Clean the number - remove all non-digits
    const clean = number.replace(/\D/g, '')
    // Add country code if not present
    const withCountry = clean.startsWith('55') ? clean : `55${clean}`
    return `${withCountry}@s.whatsapp.net`
  }

  /**
   * Extract phone number from JID
   */
  extractNumber(jid: string): string {
    return jid.replace('@s.whatsapp.net', '').replace('@g.us', '').replace('@lid', '')
  }

  /**
   * Check if JID is a group
   */
  isGroup(jid: string): boolean {
    return jid.includes('@g.us')
  }
}

export const evolutionApi = new EvolutionApiService()
