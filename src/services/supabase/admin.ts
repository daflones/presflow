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
        outside_hours_message: input.outside_hours_message,
        // Novos campos
        google_maps_link: input.google_maps_link,
        espacos_disponiveis: input.espacos_disponiveis,
        info_casamento: input.info_casamento,
        exige_sinal: input.exige_sinal,
        regras_sinal: input.regras_sinal,
        info_batizados: input.info_batizados,
        cursos: input.cursos,
        sessao_fotos: input.sessao_fotos,
        regras_hospedagem: input.regras_hospedagem,
        link_visitacao: input.link_visitacao,
        guia_turistico: input.guia_turistico,
        projetos_sociais_empresas: input.projetos_sociais_empresas,
        projetos_sociais_comunidade: input.projetos_sociais_comunidade,
        regras_especificas: input.regras_especificas,
        hospedagem_disponivel: input.hospedagem_disponivel,
        qualification_fields: input.qualification_fields,
        business_hours: input.business_hours,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[admin.updateAIConfig] Erro:', error);
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
