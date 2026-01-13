import { supabase } from '../../lib/supabase';
import { getUserData } from '../../lib/user';

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

    // Identificar igreja do usuário logado
    // Preferir o vínculo do perfil (users.church_id) para suportar usuários que não são owner.
    const profile = await getUserData();
    if (String(profile?.role || '').toLowerCase() === 'consulta') {
      throw new Error('Somente visualização');
    }
    let churchId: string | null = profile?.church_id || null;

    // Fallback: caso não exista perfil/vínculo, tentar por owner_id.
    if (!churchId) {
      const { data: church, error: churchError } = await supabase
        .from('churches')
        .select('id')
        .eq('owner_id', userData.user.id)
        .single();

      if (churchError || !church) {
        console.error('[whatsappDb.saveInstance] Erro ao buscar igreja:', churchError);
        throw new Error('Igreja não encontrada');
      }
      churchId = church.id;
    }

    console.log('[whatsappDb.saveInstance] Salvando instância para church:', churchId, data);

    const nowIso = new Date().toISOString();

    const { data: existingByName, error: existingByNameError } = await supabase
      .from('whatsapp_instances')
      .select('id,church_id')
      .eq('instance_name', data.instance_name)
      .limit(1)
      .maybeSingle();

    if (existingByNameError) {
      console.error('[whatsappDb.saveInstance] Erro ao buscar whatsapp_instances por instance_name:', existingByNameError);
      throw existingByNameError;
    }

    if (existingByName?.id && existingByName?.church_id && existingByName.church_id !== churchId) {
      throw new Error('Instância já vinculada a outra igreja');
    }

    const { data: existing, error: existingError } = await supabase
      .from('whatsapp_instances')
      .select('id')
      .eq('church_id', churchId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingError) {
      console.error('[whatsappDb.saveInstance] Erro ao buscar whatsapp_instances:', existingError);
      throw existingError;
    }

    const payload: Record<string, any> = {
      church_id: churchId,
      instance_name: data.instance_name,
      instance_id: data.instance_id || null,
      phone_number: data.phone_number || null,
      status: data.status || null,
      updated_at: nowIso,
      is_active: true,
    };

    if (data.status === 'open') {
      payload.connected_at = data.connected_at || nowIso;
      payload.disconnected_at = null;
    } else if (data.status === 'disconnected' || data.status === 'close') {
      payload.disconnected_at = nowIso;
    }

    const targetId = existingByName?.id || existing?.id;

    const { error: upsertError } = targetId
      ? await supabase
          .from('whatsapp_instances')
          .update(payload)
          .eq('id', targetId)
      : await supabase.from('whatsapp_instances').insert(payload);

    if (upsertError) {
      const errAny: any = upsertError as any;
      if (errAny?.code === '23505') {
        const { data: conflictRow } = await supabase
          .from('whatsapp_instances')
          .select('id,church_id')
          .eq('instance_name', data.instance_name)
          .limit(1)
          .maybeSingle();

        if (conflictRow?.church_id && conflictRow.church_id !== churchId) {
          throw new Error('Instância já vinculada a outra igreja');
        }

        if (conflictRow?.id) {
          const { error: conflictUpdateError } = await supabase
            .from('whatsapp_instances')
            .update(payload)
            .eq('id', conflictRow.id);

          if (!conflictUpdateError) {
            console.log('[whatsappDb.saveInstance] Instância salva com sucesso');
            return;
          }
        }
      }
      console.error('[whatsappDb.saveInstance] Erro ao salvar whatsapp_instances:', upsertError);
      throw upsertError;
    }

    console.log('[whatsappDb.saveInstance] Instância salva com sucesso');
  },

  /**
   * Busca os dados da instância WhatsApp do banco de dados
   */
  async getInstance(): Promise<{ instance_name: string | null; connected_at: string | null }> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return { instance_name: null, connected_at: null };

    // Identificar igreja do usuário logado
    const profile = await getUserData();
    let churchId: string | null = profile?.church_id || null;

    // Fallback: tentar por owner_id
    if (!churchId) {
      const { data: church, error: churchError } = await supabase
        .from('churches')
        .select('id')
        .eq('owner_id', userData.user.id)
        .single();

      if (churchError || !church) {
        console.log('[whatsappDb.getInstance] Igreja não encontrada ou erro:', churchError);
        return { instance_name: null, connected_at: null };
      }
      churchId = church.id;
    }

    const { data: inst, error } = await supabase
      .from('whatsapp_instances')
      .select('instance_name, connected_at, status, is_active')
      .eq('church_id', churchId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !inst) {
      console.log('[whatsappDb.getInstance] Instância não encontrada ou erro:', error);
      return { instance_name: null, connected_at: null };
    }

    const status = String(inst.status || '').toLowerCase();
    const connectedAt = inst.connected_at ? String(inst.connected_at) : null;
    const isConnected = status === 'open' && !!connectedAt;

    console.log('[whatsappDb.getInstance] Instância encontrada:', inst.instance_name, 'connected_at:', connectedAt);
    return {
      instance_name: isConnected ? (inst.instance_name || null) : null,
      connected_at: connectedAt,
    };
  },

  /**
   * Remove os dados da instância WhatsApp do banco de dados
   */
  async clearInstance(): Promise<void> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Usuário não autenticado');

    // Identificar igreja do usuário logado
    const profile = await getUserData();
    if (String(profile?.role || '').toLowerCase() === 'consulta') {
      throw new Error('Somente visualização');
    }
    let churchId: string | null = profile?.church_id || null;

    // Fallback: tentar por owner_id
    if (!churchId) {
      const { data: church, error: churchError } = await supabase
        .from('churches')
        .select('id')
        .eq('owner_id', userData.user.id)
        .single();

      if (churchError || !church) {
        throw new Error('Igreja não encontrada');
      }
      churchId = church.id;
    }

    console.log('[whatsappDb.clearInstance] Limpando instância para church:', churchId);

    const nowIso = new Date().toISOString();
    const { data: existing, error: existingError } = await supabase
      .from('whatsapp_instances')
      .select('id')
      .eq('church_id', churchId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingError) {
      console.error('[whatsappDb.clearInstance] Erro ao buscar whatsapp_instances:', existingError);
      throw existingError;
    }

    if (existing?.id) {
      const { error: updateError } = await supabase
        .from('whatsapp_instances')
        .update({
          status: 'disconnected',
          disconnected_at: nowIso,
          is_active: false,
          updated_at: nowIso,
        })
        .eq('id', existing.id);

      if (updateError) {
        console.error('[whatsappDb.clearInstance] Erro ao limpar whatsapp_instances:', updateError);
        throw updateError;
      }
    }

    console.log('[whatsappDb.clearInstance] Instância removida com sucesso');
  },
};
