// Serviço para instâncias WhatsApp de igrejas
import { whatsappService, type CreateInstanceResponse } from './whatsapp';

export interface ChurchInstance {
  id: string;
  churchId: string;
  instanceName: string;
  instanceId: string;
  phoneNumber: string;
  status: 'created' | 'connecting' | 'open' | 'close' | 'disconnected';
  qrcode?: string;
  apikey?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateChurchInstanceRequest {
  churchId: string;
  instanceName: string;
  phoneNumber: string;
}

class WhatsAppChurchService {
  constructor() {
    // whatsappService já é uma instância
  }

  async createChurchInstance(request: CreateChurchInstanceRequest): Promise<CreateInstanceResponse> {
    // Formatar número: remover todos os caracteres especiais, manter apenas dígitos
    const formattedNumber = request.phoneNumber.replace(/\D/g, '');
    
    // Validar se o número tem pelo menos 10 dígitos (código país + DDD + número)
    if (formattedNumber.length < 10) {
      throw new Error('Número inválido. Insira o número completo com código do país (ex: 5511999999999)');
    }

    // Verificar se já existe instância para esta igreja
    const existingInstance = await this.getChurchInstance(request.churchId);
    if (existingInstance) {
      throw new Error('Esta igreja já possui uma instância WhatsApp configurada');
    }

    // Criar instância na Evolution API
    const response = await whatsappService.createInstance(request.instanceName, formattedNumber);
    
    // Salvar informações da instância vinculada à igreja
    await this.saveChurchInstance({
      id: crypto.randomUUID(),
      churchId: request.churchId,
      instanceName: response.instance.instanceName,
      instanceId: response.instance.instanceId,
      phoneNumber: formattedNumber,
      status: 'connecting',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      qrcode: response.qrcode?.base64,
      apikey: response.hash.apikey
    });

    return response;
  }

  async deleteChurchInstance(churchId: string): Promise<void> {
    const instance = await this.getChurchInstance(churchId);
    if (!instance) {
      throw new Error('Instância não encontrada para esta igreja');
    }

    // Deletar instância na Evolution API
    await whatsappService.deleteInstance(instance.instanceName);
    
    // Remover do localStorage
    await this.removeChurchInstance(churchId);
  }

  async getChurchInstance(churchId: string): Promise<ChurchInstance | null> {
    const instances = this.getAllChurchInstances();
    return instances.find(instance => instance.churchId === churchId) || null;
  }

  async getChurchInstanceStatus(churchId: string): Promise<ChurchInstance | null> {
    const instance = await this.getChurchInstance(churchId);
    if (!instance) return null;

    try {
      // Buscar status atual na Evolution API
      const status = await whatsappService.getInstanceByName(instance.instanceName);
      
      // Atualizar status local
      const updatedInstance = {
        ...instance,
        status: status.instance.state as ChurchInstance['status'],
        updatedAt: new Date().toISOString()
      };

      await this.updateChurchInstance(updatedInstance);
      return updatedInstance;
    } catch (error) {
      console.error('Erro ao buscar status da instância:', error);
      return instance;
    }
  }

  private async saveChurchInstance(instance: ChurchInstance): Promise<void> {
    const instances = this.getAllChurchInstances();
    instances.push(instance);
    localStorage.setItem('church_whatsapp_instances', JSON.stringify(instances));
  }

  private async updateChurchInstance(updatedInstance: ChurchInstance): Promise<void> {
    const instances = this.getAllChurchInstances();
    const index = instances.findIndex(instance => instance.id === updatedInstance.id);
    if (index !== -1) {
      instances[index] = updatedInstance;
      localStorage.setItem('church_whatsapp_instances', JSON.stringify(instances));
    }
  }

  private async removeChurchInstance(churchId: string): Promise<void> {
    const instances = this.getAllChurchInstances();
    const filteredInstances = instances.filter(instance => instance.churchId !== churchId);
    localStorage.setItem('church_whatsapp_instances', JSON.stringify(filteredInstances));
  }

  private getAllChurchInstances(): ChurchInstance[] {
    try {
      const stored = localStorage.getItem('church_whatsapp_instances');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Erro ao carregar instâncias de igrejas:', error);
      return [];
    }
  }

  async getAllChurchInstancesList(): Promise<ChurchInstance[]> {
    return this.getAllChurchInstances();
  }
}

export const whatsappChurchService = new WhatsAppChurchService();
