import { supabase } from '../../lib/supabase';
import type { Church, AIConfig, Client, ArquivoIA } from '../../types/database';

export const adminService = {
  // ==================== IGREJAS ====================
  async listChurches(): Promise<Church[]> {
    const { data, error } = await supabase
      .from('churches')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[admin.listChurches] Erro:', error);
      return [];
    }
    return data || [];
  },

  async getChurchById(id: string): Promise<Church | null> {
    const { data, error } = await supabase
      .from('churches')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('[admin.getChurchById] Erro:', error);
      return null;
    }
    return data;
  },

  async createChurch(input: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    owner_id: string;
  }): Promise<Church | null> {
    const { data, error } = await supabase
      .from('churches')
      .insert([input])
      .select()
      .single();

    if (error) {
      console.error('[admin.createChurch] Erro:', error);
      throw error;
    }
    return data;
  },

  async updateChurch(id: string, input: Partial<Church>): Promise<Church | null> {
    const { data, error } = await supabase
      .from('churches')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[admin.updateChurch] Erro:', error);
      throw error;
    }
    return data;
  },

  // ==================== AI CONFIGS ====================
  async listAIConfigs(): Promise<(AIConfig & { church?: Church })[]> {
    const { data, error } = await supabase
      .from('ai_configs')
      .select('*, churches(*)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[admin.listAIConfigs] Erro:', error);
      return [];
    }

    return (data || []).map((item: any) => ({
      ...item,
      church: item.churches,
    }));
  },

  async getAIConfigByChurchId(churchId: string): Promise<AIConfig | null> {
    const { data, error } = await supabase
      .from('ai_configs')
      .select('*')
      .eq('church_id', churchId)
      .single();

    if (error) {
      console.error('[admin.getAIConfigByChurchId] Erro:', error);
      return null;
    }
    return data;
  },

  async updateAIConfig(id: string, input: Partial<AIConfig>): Promise<AIConfig | null> {
    // Preparar dados para update, removendo campos undefined e convertendo tipos
    const updateData: any = {};
    
    // Campos de texto simples - converter null/undefined para string vazia
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
    
    // Regras de Agendamento - boolean
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

    // Verificar e logar todos os valores para debug
    console.log('[admin.updateAIConfig] Dados para update:', JSON.stringify(updateData, null, 2));
    
    // Verificar se há algum valor inválido
    for (const [key, value] of Object.entries(updateData)) {
      if (value === '' && (key === 'use_emojis' || key === 'send_documents' || key === 'auto_scheduling' || key === 'exige_sinal' || key === 'hospedagem_disponivel')) {
        console.error(`[admin.updateAIConfig] ERRO: Campo boolean ${key} tem valor string vazia!`);
        updateData[key] = false;
      }
      console.log(`[admin.updateAIConfig] ${key}: ${typeof value} = ${JSON.stringify(value)}`);
    }

    const { data, error } = await supabase
      .from('ai_configs')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[admin.updateAIConfig] Erro:', error);
      console.error('[admin.updateAIConfig] Detalhes do erro:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      throw error;
    }
    return data;
  },

  // ==================== CLIENTES ====================
  async listClientsByChurch(churchId: string): Promise<Client[]> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('church_id', churchId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[admin.listClientsByChurch] Erro:', error);
      return [];
    }
    return data || [];
  },

  async listAllClients(): Promise<(Client & { church?: Church })[]> {
    const { data, error } = await supabase
      .from('clients')
      .select('*, churches(*)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[admin.listAllClients] Erro:', error);
      return [];
    }

    return (data || []).map((item: any) => ({
      ...item,
      church: item.churches,
    }));
  },

  // ==================== ARQUIVOS IA ====================
  async listArquivosByChurch(churchId: string): Promise<ArquivoIA[]> {
    const { data, error } = await supabase
      .from('arquivos_ia')
      .select('*')
      .eq('church_id', churchId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[admin.listArquivosByChurch] Erro:', error);
      return [];
    }
    return data || [];
  },

  async listAllArquivos(): Promise<(ArquivoIA & { church?: Church })[]> {
    const { data, error } = await supabase
      .from('arquivos_ia')
      .select('*, churches(*)')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[admin.listAllArquivos] Erro:', error);
      return [];
    }

    return (data || []).map((item: any) => ({
      ...item,
      church: item.churches,
    }));
  },

  // ==================== ESTATÍSTICAS ====================
  async getStats(): Promise<{
    totalChurches: number;
    totalClients: number;
    totalArquivos: number;
    totalAIConfigs: number;
  }> {
    const [churches, clients, arquivos, aiConfigs] = await Promise.all([
      supabase.from('churches').select('id', { count: 'exact', head: true }),
      supabase.from('clients').select('id', { count: 'exact', head: true }),
      supabase.from('arquivos_ia').select('id', { count: 'exact', head: true }).is('deleted_at', null),
      supabase.from('ai_configs').select('id', { count: 'exact', head: true }),
    ]);

    return {
      totalChurches: churches.count || 0,
      totalClients: clients.count || 0,
      totalArquivos: arquivos.count || 0,
      totalAIConfigs: aiConfigs.count || 0,
    };
  },
};
