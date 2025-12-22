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
      
      // Preparar dados para update, removendo campos undefined e convertendo tipos
      const updateData: any = {};
      
      // Campos de texto - converter null/undefined para string vazia
      if (input.agent_name !== undefined) updateData.agent_name = input.agent_name || '';
      if (input.informacoes_adicionais !== undefined) updateData.informacoes_adicionais = input.informacoes_adicionais || '';
      if (input.perguntas_frequentes !== undefined) updateData.perguntas_frequentes = input.perguntas_frequentes || '';
      if (input.principais_eventos !== undefined) updateData.principais_eventos = input.principais_eventos || '';
      if (input.localizacao_igreja !== undefined) updateData.localizacao_igreja = input.localizacao_igreja || '';
      if (input.informacao_historica !== undefined) updateData.informacao_historica = input.informacao_historica || '';
      if (input.documentacao_necessaria !== undefined) updateData.documentacao_necessaria = input.documentacao_necessaria || '';
      if (input.tone_of_voice !== undefined) updateData.tone_of_voice = input.tone_of_voice;
      if (input.text_size !== undefined) updateData.text_size = input.text_size;
      if (input.outside_hours_message !== undefined) updateData.outside_hours_message = input.outside_hours_message || '';
      
      // Campos boolean - garantir que sejam boolean, não string
      if (input.use_emojis !== undefined) updateData.use_emojis = Boolean(input.use_emojis);
      if (input.send_documents !== undefined) updateData.send_documents = Boolean(input.send_documents);
      if (input.auto_scheduling !== undefined) updateData.auto_scheduling = Boolean(input.auto_scheduling);
      if (input.exige_sinal !== undefined) updateData.exige_sinal = Boolean(input.exige_sinal);
      if (input.hospedagem_disponivel !== undefined) updateData.hospedagem_disponivel = Boolean(input.hospedagem_disponivel);
      
      // Novos campos de texto
      if (input.menu_principal !== undefined) updateData.menu_principal = input.menu_principal || '';
      if (input.google_maps_link !== undefined) updateData.google_maps_link = input.google_maps_link || '';
      if (input.espacos_disponiveis !== undefined) updateData.espacos_disponiveis = input.espacos_disponiveis || '';
      if (input.regras_sinal !== undefined) updateData.regras_sinal = input.regras_sinal || '';
      if (input.cursos !== undefined) updateData.cursos = input.cursos || '';
      if (input.sessao_fotos !== undefined) updateData.sessao_fotos = input.sessao_fotos || '';
      if (input.regras_hospedagem !== undefined) updateData.regras_hospedagem = input.regras_hospedagem || '';
      if (input.link_visitacao !== undefined) updateData.link_visitacao = input.link_visitacao || '';
      if (input.guia_turistico !== undefined) updateData.guia_turistico = input.guia_turistico || '';
      if (input.projetos_sociais_empresas !== undefined) updateData.projetos_sociais_empresas = input.projetos_sociais_empresas || '';
      if (input.projetos_sociais_comunidade !== undefined) updateData.projetos_sociais_comunidade = input.projetos_sociais_comunidade || '';
      if (input.regras_especificas !== undefined) updateData.regras_especificas = input.regras_especificas || '';
      
      // Identidade do Agente
      if (input.agent_gender !== undefined) updateData.agent_gender = input.agent_gender || 'feminino';
      if (input.greeting_message !== undefined) updateData.greeting_message = input.greeting_message || '';
      if (input.error_message !== undefined) updateData.error_message = input.error_message || '';
      
      // Contatos da Igreja
      if (input.phone_landline !== undefined) updateData.phone_landline = input.phone_landline || '';
      if (input.phone_whatsapp !== undefined) updateData.phone_whatsapp = input.phone_whatsapp || '';
      if (input.email_main !== undefined) updateData.email_main = input.email_main || '';
      if (input.email_secretary !== undefined) updateData.email_secretary = input.email_secretary || '';
      if (input.email_documents !== undefined) updateData.email_documents = input.email_documents || '';
      if (input.contact_general !== undefined) updateData.contact_general = input.contact_general || '';
      
      // Regras de Agendamento
      if (input.allow_scheduling_lent !== undefined) updateData.allow_scheduling_lent = Boolean(input.allow_scheduling_lent);
      if (input.allow_scheduling_jubilee !== undefined) updateData.allow_scheduling_jubilee = Boolean(input.allow_scheduling_jubilee);
      if (input.blocked_dates !== undefined) updateData.blocked_dates = input.blocked_dates || [];
      if (input.max_simultaneous_events !== undefined) updateData.max_simultaneous_events = Number(input.max_simultaneous_events) || 1;
      
      // Mensagens Personalizadas
      if (input.donation_text !== undefined) updateData.donation_text = input.donation_text || '';
      if (input.prayer_text !== undefined) updateData.prayer_text = input.prayer_text || '';
      if (input.confirmation_text !== undefined) updateData.confirmation_text = input.confirmation_text || '';
      if (input.unavailability_text !== undefined) updateData.unavailability_text = input.unavailability_text || '';
      if (input.post_scheduling_text !== undefined) updateData.post_scheduling_text = input.post_scheduling_text || '';
      
      // Campos JSONB - garantir que sejam objetos válidos
      if (input.info_casamento !== undefined) {
        updateData.info_casamento = input.info_casamento || { lugares: '', horarios: '', documentacao: '', prazo_entrega: '', valores: '' };
      }
      if (input.info_batizados !== undefined) {
        updateData.info_batizados = input.info_batizados || { lugares: '', horarios: '', documentacao: '', prazo_entrega: '', valores: '' };
      }
      if (input.qualification_fields !== undefined) {
        // Garantir que todos os campos de qualification_fields sejam boolean
        const qf = input.qualification_fields;
        updateData.qualification_fields = {
          nome: Boolean(qf.nome),
          telefone: Boolean(qf.telefone),
          email: Boolean(qf.email),
          interesse: Boolean(qf.interesse),
          motivacao: Boolean(qf.motivacao),
          expectativa: Boolean(qf.expectativa),
          tipo_evento: Boolean(qf.tipo_evento),
        };
      }
      if (input.business_hours !== undefined) {
        // Garantir que business_hours tenha estrutura correta
        const bh = input.business_hours;
        updateData.business_hours = {
          monday: { enabled: Boolean(bh.monday?.enabled), startTime: bh.monday?.startTime || '09:00', endTime: bh.monday?.endTime || '18:00' },
          tuesday: { enabled: Boolean(bh.tuesday?.enabled), startTime: bh.tuesday?.startTime || '09:00', endTime: bh.tuesday?.endTime || '18:00' },
          wednesday: { enabled: Boolean(bh.wednesday?.enabled), startTime: bh.wednesday?.startTime || '09:00', endTime: bh.wednesday?.endTime || '18:00' },
          thursday: { enabled: Boolean(bh.thursday?.enabled), startTime: bh.thursday?.startTime || '09:00', endTime: bh.thursday?.endTime || '18:00' },
          friday: { enabled: Boolean(bh.friday?.enabled), startTime: bh.friday?.startTime || '09:00', endTime: bh.friday?.endTime || '18:00' },
          saturday: { enabled: Boolean(bh.saturday?.enabled), startTime: bh.saturday?.startTime || '09:00', endTime: bh.saturday?.endTime || '13:00' },
          sunday: { enabled: Boolean(bh.sunday?.enabled), startTime: bh.sunday?.startTime || '09:00', endTime: bh.sunday?.endTime || '13:00' },
        };
      }
      
      updateData.updated_at = new Date().toISOString();

      console.log('[aiConfig.createOrUpdate] Update data keys:', Object.keys(updateData));

      const { data, error } = await supabase
        .from('ai_configs')
        .update(updateData)
        .eq('id', existing.id)
        .select()
        .single();

      console.log('[aiConfig.createOrUpdate] Update result:', data, 'error:', error);
      if (error) {
        console.error('[aiConfig.createOrUpdate] Erro detalhado:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }
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
          // Novos campos
          google_maps_link: input.google_maps_link || '',
          espacos_disponiveis: input.espacos_disponiveis || '',
          info_casamento: input.info_casamento || { lugares: '', horarios: '', documentacao: '', prazo_entrega: '', valores: '' },
          exige_sinal: input.exige_sinal ?? false,
          regras_sinal: input.regras_sinal || '',
          info_batizados: input.info_batizados || { lugares: '', horarios: '', documentacao: '', prazo_entrega: '', valores: '' },
          cursos: input.cursos || '',
          sessao_fotos: input.sessao_fotos || '',
          regras_hospedagem: input.regras_hospedagem || '',
          link_visitacao: input.link_visitacao || '',
          guia_turistico: input.guia_turistico || '',
          projetos_sociais_empresas: input.projetos_sociais_empresas || '',
          projetos_sociais_comunidade: input.projetos_sociais_comunidade || '',
          regras_especificas: input.regras_especificas || '',
          hospedagem_disponivel: input.hospedagem_disponivel ?? false,
          qualification_fields: input.qualification_fields || {
            nome: true,
            telefone: true,
            email: true,
            interesse: true,
            motivacao: true,
            expectativa: true,
            tipo_evento: true,
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
