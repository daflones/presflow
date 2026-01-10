// Serviço para integração com Evolution API
import { supabase } from '../../lib/supabase'
export interface WhatsAppInstance {
  instanceName: string
  instanceId: string
  status: 'created' | 'connecting' | 'open' | 'close' | 'disconnected'
  qrcode?: string
  apikey?: string
}

export interface CreateInstanceRequest {
  instanceName: string
  number: string
}

export interface CreateInstanceResponse {
  instance: {
    instanceName: string
    instanceId: string
    status: string
  }
  hash: {
    apikey: string
  }
  qrcode?: {
    code: string
    base64: string
  }
}

export interface ConnectionStatus {
  instance: string
  state: 'open' | 'close' | 'connecting'
}

class WhatsAppService {
  private baseUrl: string
  private apiKey: string
  private webhookUrl: string

  constructor() {
    // Obter configurações do ambiente
    // Em produção (HTTPS), não podemos chamar a Evolution API via HTTP direto do browser (Mixed Content).
    // Então usamos o backend como proxy (mesma origem) em /api.
    const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:'
    this.baseUrl = isHttps ? '/api' : (import.meta.env.VITE_EVOLUTION_API_URL || '')
    this.apiKey = isHttps ? '' : (import.meta.env.VITE_EVOLUTION_API_KEY || '')
    this.webhookUrl = import.meta.env.VITE_WEBHOOK_URL || ''
    
    // Remover barra final da URL se existir
    this.baseUrl = this.baseUrl.endsWith('/') ? this.baseUrl.slice(0, -1) : this.baseUrl
    
    console.log('WhatsApp Service - Base URL:', this.baseUrl)
    console.log('WhatsApp Service - API Key:', this.apiKey ? 'Configurada' : 'Não configurada')
    console.log('WhatsApp Service - Webhook URL:', this.webhookUrl ? 'Configurada' : 'Não configurada')
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    // Garantir que endpoint começa com /
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
    const url = `${this.baseUrl}${cleanEndpoint}`
    
    console.log('Fazendo requisição para:', url)
    
    const authHeaders: Record<string, string> = {}
    if (this.baseUrl.startsWith('/api')) {
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token
      if (token) {
        authHeaders.Authorization = `Bearer ${token}`
      }
    }

    const response = await fetch(url, {
      ...options,
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey ? { apikey: this.apiKey } : {}),
        'Accept': 'application/json',
        ...authHeaders,
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Evolution API Error: ${response.status} - ${error}`)
    }

    return response.json()
  }

  async createInstance(instanceName: string, number: string): Promise<CreateInstanceResponse> {
    const payload = {
      instanceName,
      number,
      qrcode: true,
      integration: 'WHATSAPP-BAILEYS',
      webhook: {
        url: this.webhookUrl,
        byEvents: false,
        base64: true,
        events: [
          'MESSAGES_UPSERT',
          'QRCODE_UPDATED',
          'MESSAGES_UPDATE',
          'SEND_MESSAGE'
        ]
      },
      websocket: {
        enabled: true,
        events: [
          'MESSAGES_UPSERT',
          'QRCODE_UPDATED',
          'MESSAGES_UPDATE',
          'SEND_MESSAGE'
        ]
      },
      rabbitmq: {
        enabled: false
      },
      sqs: {
        enabled: false
      },
      chatwoot: {
        enabled: false
      },
      settings: {
        rejectCall: true,
        msgCall: 'Chamadas não são aceitas neste número.',
        groupsIgnore: true,
        alwaysOnline: true,
        readMessages: true,
        readStatus: false,
        syncFullHistory: false
      }
    }

    console.log('Criando instância com webhook:', this.webhookUrl)
    console.log('Eventos habilitados:', payload.webhook.events)

    return this.makeRequest('/instance/create', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
  }

  async getInstanceStatus(instanceName: string): Promise<any> {
    // Quando usando proxy do backend (/api), o endpoint de status é diferente.
    if (this.baseUrl === '/api') {
      return this.makeRequest(`/instance/status/${instanceName}`)
    }
    return this.makeRequest(`/instance/connectionState/${instanceName}`)
  }

  async fetchInstances(): Promise<any[]> {
    const result = await this.makeRequest('/instance/fetchInstances')
    return result || []
  }

  async getInstanceByName(instanceName: string): Promise<any | null> {
    const instances = await this.fetchInstances()
    const instance = instances.find((inst: any) => inst.name === instanceName)
    
    // Normalizar a estrutura da resposta para compatibilidade
    if (instance) {
      return {
        instanceName: instance.name,
        instanceId: instance.id,
        status: instance.connectionStatus,
        owner: instance.ownerJid,
        profileName: instance.profileName,
        profilePictureUrl: instance.profilePictureUrl,
        profileStatus: instance.profileStatus
      }
    }
    
    return null
  }

  async getQRCode(instanceName: string): Promise<{ code: string; pairingCode: string; count: number; base64: string }> {
    // Verificar primeiro se a instância existe
    const instances = await this.fetchInstances()
    const instance = instances.find((inst: any) => inst.name === instanceName)
    
    if (!instance) {
      throw new Error(`Instância ${instanceName} não encontrada`)
    }
    
    console.log('Instância encontrada:', instance)
    
    // Tentar obter QR code
    const result = await this.makeRequest(`/instance/connect/${instanceName}`)
    console.log('QR Code response:', result)
    console.log('QR Code response keys:', Object.keys(result))
    console.log('QR Code base64:', result.base64)
    
    // Se tiver o campo base64, usar diretamente
    if (result.base64 && typeof result.base64 === 'string') {
      console.log('Using base64 field directly')
      // Remover prefixo data:image/png;base64, se existir
      const base64Data = result.base64.replace('data:image/png;base64,', '')
      return {
        code: base64Data,
        pairingCode: result.pairingCode || '',
        count: result.count || 1,
        base64: base64Data
      }
    }
    
    // Fallback para o campo code se base64 não existir
    if (result.code && typeof result.code === 'string') {
      console.log('Processing QR Code code...')
      
      // Se for uma string concatenada com vírgulas, extrair apenas a primeira parte
      if (result.code.includes(',')) {
        const parts = result.code.split(',')
        const firstPart = parts[0]
        console.log('QR Code is concatenated format, extracting first part:', firstPart)
        
        // Remover prefixo "2@" se existir
        let cleanCode = firstPart
        if (firstPart.startsWith('2@')) {
          cleanCode = firstPart.substring(2)
          console.log('Removed prefix 2@, clean code:', cleanCode)
        }
        
        // Verificar se a parte limpa é base64 válido
        if (cleanCode.match(/^[A-Za-z0-9+/]+={0,2}$/)) {
          console.log('Clean code is valid base64')
          return {
            code: cleanCode,
            pairingCode: result.pairingCode || '',
            count: result.count || 1,
            base64: cleanCode
          }
        } else {
          console.log('Clean code is not valid base64, checking all parts...')
          
          // Tentar cada parte até encontrar base64 válido
          for (let i = 0; i < parts.length; i++) {
            let part = parts[i]
            if (part.startsWith('2@')) {
              part = part.substring(2)
            }
            
            if (part.match(/^[A-Za-z0-9+/]+={0,2}$/)) {
              console.log(`Found valid base64 in part ${i}:`, part)
              return {
                code: part,
                pairingCode: result.pairingCode || '',
                count: result.count || 1,
                base64: part
              }
            }
          }
          
          console.log('No valid base64 found in any part')
        }
      }
      
      // Se já for base64, retornar como está
      if (result.code.startsWith('data:image/png;base64,')) {
        console.log('QR Code is data URL format')
        return {
          code: result.code.replace('data:image/png;base64,', ''),
          pairingCode: result.pairingCode || '',
          count: result.count || 1,
          base64: result.code.replace('data:image/png;base64,', '')
        }
      }
      // Se for base64 sem o prefixo, retornar
      else if (result.code.match(/^[A-Za-z0-9+/]+={0,2}$/)) {
        console.log('QR Code is base64 format')
        return {
          code: result.code,
          pairingCode: result.pairingCode || '',
          count: result.count || 1,
          base64: result.code
        }
      }
      else {
        console.log('QR Code format unknown:', result.code.substring(0, 100))
      }
    } else {
      console.log('QR Code code is missing or not string')
    }
    
    throw new Error('Formato de QR Code inválido')
  }

  async deleteInstance(instanceName: string): Promise<void> {
    // Evolution API usa DELETE no endpoint /instance/delete/{instanceName}
    console.log('[WhatsApp] Deletando instância:', instanceName)
    
    try {
      // Primeiro tentar fazer logout para desconectar
      try {
        await this.makeRequest(`/instance/logout/${instanceName}`, {
          method: 'DELETE'
        })
        console.log('[WhatsApp] Logout realizado com sucesso')
      } catch (logoutError) {
        console.log('[WhatsApp] Logout falhou (instância pode já estar desconectada):', logoutError)
      }
      
      // Depois deletar a instância
      await this.makeRequest(`/instance/delete/${instanceName}`, {
        method: 'DELETE'
      })
      console.log('[WhatsApp] Instância deletada com sucesso')
    } catch (error) {
      console.error('[WhatsApp] Erro ao deletar instância:', error)
      throw error
    }
  }

  async logoutInstance(instanceName: string): Promise<void> {
    await this.makeRequest(`/instance/logout/${instanceName}`, {
      method: 'DELETE'
    })
  }

  // Salvar dados da instância no localStorage
  async saveInstanceToProfile(instanceData: {
    instanceName: string
    instanceId: string
    status: string
    apikey?: string
  }): Promise<void> {
    const existingData = localStorage.getItem('whatsapp_instance')
    const instances = existingData ? JSON.parse(existingData) : []
    
    // Adicionar ou atualizar instância
    const index = instances.findIndex((inst: any) => inst.instanceName === instanceData.instanceName)
    if (index >= 0) {
      instances[index] = { ...instances[index], ...instanceData }
    } else {
      instances.push(instanceData)
    }
    
    localStorage.setItem('whatsapp_instance', JSON.stringify(instances))
  }

  // Buscar dados da instância do localStorage ou banco de dados
  async getInstanceFromProfile(): Promise<{
    instanceName: string | null
    status: string | null
    instanceId: string | null
    connectedAt: string | null
  } | null> {
    // Preferir banco de dados como fonte de verdade (suporta troca de browser/dispositivo)
    try {
      const { whatsappDbService } = await import('../supabase')
      const dbInstance = await whatsappDbService.getInstance()
      
      if (dbInstance && dbInstance.instance_name) {
        // Se possível, verificar status real na Evolution
        let resolvedStatus: any = 'open'
        let resolvedInstanceId = ''
        try {
          const evo = await this.getInstanceByName(dbInstance.instance_name)
          if (evo) {
            resolvedStatus = evo.status || resolvedStatus
            resolvedInstanceId = evo.instanceId || resolvedInstanceId
          }
        } catch (e) {
          // Ignorar erro e seguir com o que temos no banco
        }

        await this.saveInstanceToProfile({
          instanceName: dbInstance.instance_name,
          instanceId: resolvedInstanceId,
          status: resolvedStatus,
        })

        return {
          instanceName: dbInstance.instance_name,
          status: resolvedStatus,
          instanceId: resolvedInstanceId,
          connectedAt: dbInstance.connected_at || null
        }
      }
    } catch (error) {
      console.error('[WhatsApp] Erro ao buscar instância do banco:', error)
    }

    // Fallback: tentar localStorage (cache)
    const existingData = localStorage.getItem('whatsapp_instance')
    if (existingData) {
      const instances = JSON.parse(existingData)
      if (instances.length > 0) {
        const instance = instances[0]
        return {
          instanceName: instance.instanceName,
          status: instance.status,
          instanceId: instance.instanceId,
          connectedAt: instance.connectedAt || null
        }
      }
    }

    return null
  }

  // Limpar dados da instância do localStorage
  async clearInstanceFromProfile(): Promise<void> {
    localStorage.removeItem('whatsapp_instance')
  }

  /**
   * Enviar mensagem de texto via WhatsApp
   */
  async sendText(
    numberOrRemoteJid: string, 
    message: string,
    options?: {
      linkPreview?: boolean
      delay?: number
    }
  ): Promise<any> {
    console.log('Enviando mensagem de texto via WhatsApp')
    
    // Se já for remoteJid (contém @s.whatsapp.net), usar direto
    // Caso contrário, formatar número
    let formattedNumber: string
    
    if (numberOrRemoteJid.includes('@s.whatsapp.net')) {
      formattedNumber = numberOrRemoteJid
    } else {
      const cleanNumber = numberOrRemoteJid.replace(/\D/g, '')
      const numberOnly = cleanNumber.startsWith('55') ? cleanNumber : `55${cleanNumber}`
      formattedNumber = `${numberOnly}@s.whatsapp.net`
    }

    const payload = {
      number: formattedNumber,
      text: message,
      delay: options?.delay || 1200,
      linkPreview: options?.linkPreview !== false // true por padrão
    }

    try {
      const result = await this.makeRequest(`/message/sendText/${formattedNumber}`, {
        method: 'POST',
        body: JSON.stringify(payload)
      })
      console.log('Mensagem enviada com sucesso:', result)
      return result
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
      throw error
    }
  }
}

export const whatsappService = new WhatsAppService()
