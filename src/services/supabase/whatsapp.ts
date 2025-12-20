import { supabase } from '../../lib/supabase';

export interface WhatsAppInstanceData {
  instance_name: string;
  instance_id?: string;
  status: 'created' | 'connecting' | 'open' | 'close' | 'disconnected';
  connected_at?: string;
  phone_number?: string;
  profile_name?: string;
  profile_picture_url?: string;
}

export const whatsappDbService = {
  /**
   * Salva ou atualiza os dados da instância WhatsApp no banco de dados
   */
  async saveInstance(data: WhatsAppInstanceData): Promise<void> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Usuário não autenticado');

    // Buscar church_id do usuário
    const { data: church, error: churchError } = await supabase
      .from('churches')
      .select('id')
      .eq('owner_id', userData.user.id)
      .single();

    if (churchError || !church) {
      console.error('[whatsappDb.saveInstance] Erro ao buscar igreja:', churchError);
      throw new Error('Igreja não encontrada');
    }

    console.log('[whatsappDb.saveInstance] Salvando instância para church:', church.id, data);

    // Preparar dados para atualização
    const updateData: Record<string, any> = {
      instance: data.instance_name,
      updated_at: new Date().toISOString(),
    };

    // Se o status for 'open' e tiver connected_at, salvar a data de conexão
    if (data.status === 'open' && data.connected_at) {
      updateData.instance_connected_at = data.connected_at;
    }

    // Atualizar a tabela churches com o nome da instância
    const { error: updateError } = await supabase
      .from('churches')
      .update(updateData)
      .eq('id', church.id);

    if (updateError) {
      console.error('[whatsappDb.saveInstance] Erro ao atualizar igreja:', updateError);
      throw updateError;
    }

    console.log('[whatsappDb.saveInstance] Instância salva com sucesso');
  },

  /**
   * Busca os dados da instância WhatsApp do banco de dados
   */
  async getInstance(): Promise<{ instance_name: string | null; connected_at: string | null }> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return { instance_name: null, connected_at: null };

    // Buscar church com o campo instance e instance_connected_at
    const { data: church, error } = await supabase
      .from('churches')
      .select('instance, instance_connected_at')
      .eq('owner_id', userData.user.id)
      .single();

    if (error || !church) {
      console.log('[whatsappDb.getInstance] Igreja não encontrada ou erro:', error);
      return { instance_name: null, connected_at: null };
    }

    console.log('[whatsappDb.getInstance] Instância encontrada:', church.instance, 'connected_at:', church.instance_connected_at);
    return { 
      instance_name: church.instance || null,
      connected_at: church.instance_connected_at || null
    };
  },

  /**
   * Remove os dados da instância WhatsApp do banco de dados
   */
  async clearInstance(): Promise<void> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Usuário não autenticado');

    // Buscar church_id do usuário
    const { data: church, error: churchError } = await supabase
      .from('churches')
      .select('id')
      .eq('owner_id', userData.user.id)
      .single();

    if (churchError || !church) {
      throw new Error('Igreja não encontrada');
    }

    console.log('[whatsappDb.clearInstance] Limpando instância para church:', church.id);

    // Limpar os campos instance e instance_connected_at na tabela churches
    const { error: updateError } = await supabase
      .from('churches')
      .update({
        instance: null,
        instance_connected_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', church.id);

    if (updateError) {
      console.error('[whatsappDb.clearInstance] Erro ao limpar instância:', updateError);
      throw updateError;
    }

    console.log('[whatsappDb.clearInstance] Instância removida com sucesso');
  },
};
