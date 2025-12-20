import { supabase } from '../../lib/supabase';
import type { AIConfig } from '../../types/database';

export type UpdateAIConfigInput = Partial<Omit<AIConfig, 'id' | 'church_id' | 'created_at' | 'updated_at'>>;

export const aiConfigService = {
  async get(): Promise<AIConfig | null> {
    const { data: userData } = await supabase.auth.getUser();
    console.log('[aiConfig.get] userData:', userData?.user?.id);
    if (!userData.user) {
      console.log('[aiConfig.get] Usuário não autenticado');
      return null;
    }

    // Buscar church_id do usuário usando fetch direto para evitar problemas
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    try {
      // Buscar igreja
      const churchResponse = await fetch(
        `${supabaseUrl}/rest/v1/churches?owner_id=eq.${userData.user.id}&select=id`,
        {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      const churches = await churchResponse.json();
      console.log('[aiConfig.get] churches:', churches);
      
      if (!churches || churches.length === 0) {
        console.log('[aiConfig.get] Igreja não encontrada');
        return null;
      }
      
      const church_id = churches[0].id;
      console.log('[aiConfig.get] church_id:', church_id);
      
      // Buscar configuração de IA
      const configResponse = await fetch(
        `${supabaseUrl}/rest/v1/ai_configs?church_id=eq.${church_id}&select=*`,
        {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      const configs = await configResponse.json();
      console.log('[aiConfig.get] ai_configs:', configs);
      
      if (!configs || configs.length === 0) {
        console.log('[aiConfig.get] Configuração não encontrada');
        return null;
      }
      
      return configs[0] as AIConfig;
    } catch (error) {
      console.error('[aiConfig.get] Erro:', error);
      return null;
    }
  },

  async createOrUpdate(input: UpdateAIConfigInput): Promise<AIConfig> {
    console.log('[aiConfig.createOrUpdate] input:', input);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Usuário não autenticado');

    // Buscar church_id diretamente da tabela churches pelo owner_id
    const { data: church } = await supabase
      .from('churches')
      .select('id')
      .eq('owner_id', userData.user.id)
      .single();

    if (!church) throw new Error('Igreja não encontrada');
    const church_id = church.id;
    console.log('[aiConfig.createOrUpdate] church_id:', church_id);

    // Verificar se já existe configuração para esta igreja
    const { data: existing } = await supabase
      .from('ai_configs')
      .select('id')
      .eq('church_id', church_id)
      .maybeSingle();

    console.log('[aiConfig.createOrUpdate] existing:', existing);

    if (existing) {
      // Atualizar existente
      console.log('[aiConfig.createOrUpdate] Updating existing config id:', existing.id);
      const { data, error } = await supabase
        .from('ai_configs')
        .update({
          agent_name: input.agent_name,
          informacoes_adicionais: input.informacoes_adicionais,
          perguntas_frequentes: input.perguntas_frequentes,
          principais_eventos: input.principais_eventos,
          menu_principal: input.menu_principal,
          localizacao_igreja: input.localizacao_igreja,
          informacao_historica: input.informacao_historica,
          documentacao_necessaria: input.documentacao_necessaria,
          tone_of_voice: input.tone_of_voice,
          text_size: input.text_size,
          use_emojis: input.use_emojis,
          send_documents: input.send_documents,
          auto_scheduling: input.auto_scheduling,
          qualification_fields: input.qualification_fields,
          business_hours: input.business_hours,
          outside_hours_message: input.outside_hours_message,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();

      console.log('[aiConfig.createOrUpdate] Update result:', data, 'error:', error);
      if (error) throw error;
      return data;
    } else {
      // Criar nova configuração
      const { data, error } = await supabase
        .from('ai_configs')
        .insert({
          church_id: church_id,
          agent_name: input.agent_name || 'Iara',
          informacoes_adicionais: input.informacoes_adicionais || '',
          perguntas_frequentes: input.perguntas_frequentes || '',
          principais_eventos: input.principais_eventos || '',
          menu_principal: input.menu_principal || '',
          localizacao_igreja: input.localizacao_igreja || '',
          informacao_historica: input.informacao_historica || '',
          documentacao_necessaria: input.documentacao_necessaria || '',
          tone_of_voice: input.tone_of_voice || 'amigavel',
          text_size: input.text_size || 'curto',
          use_emojis: input.use_emojis ?? false,
          send_documents: input.send_documents ?? false,
          auto_scheduling: input.auto_scheduling ?? false,
          qualification_fields: input.qualification_fields || {
            nome: true,
            telefone: true,
            email: true,
            interesse: true,
            motivacao: true,
            expectativa: true,
            tipo_evento: true,
            nome_igreja: true,
            segmento: true,
            volume_mensal: true,
          },
          business_hours: input.business_hours || {
            monday: { enabled: true, startTime: '09:00', endTime: '18:00' },
            tuesday: { enabled: true, startTime: '09:00', endTime: '18:00' },
            wednesday: { enabled: true, startTime: '09:00', endTime: '18:00' },
            thursday: { enabled: true, startTime: '09:00', endTime: '18:00' },
            friday: { enabled: true, startTime: '09:00', endTime: '18:00' },
            saturday: { enabled: false, startTime: '09:00', endTime: '13:00' },
            sunday: { enabled: false, startTime: '09:00', endTime: '13:00' },
          },
          outside_hours_message: input.outside_hours_message || 'Desculpe, estamos fora do horário de atendimento. Retornaremos em breve!',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  },
};
