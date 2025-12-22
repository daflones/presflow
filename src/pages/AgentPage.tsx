import { useEffect, useState, useCallback } from 'react';
import { Settings2, Check } from 'lucide-react';
import { aiConfigService } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';

type DaySchedule = {
  enabled: boolean;
  startTime: string;
  endTime: string;
};

type InfoCerimonia = {
  lugares: string;
  horarios: string;
  documentacao: string;
  prazo_entrega: string;
  valores: string;
};

type AIConfig = {
  agentName: string;
  informacoesAdicionais: string;
  perguntasFrequentes: string;
  principaisEventos: string;
  menuPrincipal: string;
  localizacaoIgreja: string;
  informacaoHistorica: string;
  documentacaoNecessaria: string;
  toneOfVoice: 'amigavel' | 'formal' | 'profissional';
  textSize: 'curto' | 'medio' | 'longo';
  useEmojis: boolean;
  sendDocuments: boolean;
  autoScheduling: boolean;
  
  // Novos campos
  googleMapsLink: string;
  espacosDisponiveis: string;
  infoCasamento: InfoCerimonia;
  exigeSinal: boolean;
  regrasSinal: string;
  infoBatizados: InfoCerimonia;
  cursos: string;
  sessaoFotos: string;
  regrasHospedagem: string;
  linkVisitacao: string;
  guiaTuristico: string;
  projetosSociaisEmpresas: string;
  projetosSociaisComunidade: string;
  regrasEspecificas: string;
  hospedagemDisponivel: boolean;
  
  qualificationFields: {
    nome: boolean;
    telefone: boolean;
    email: boolean;
    interesse: boolean;
    motivacao: boolean;
    expectativa: boolean;
    tipo_evento: boolean;
  };
  
  businessHours: {
    monday: DaySchedule;
    tuesday: DaySchedule;
    wednesday: DaySchedule;
    thursday: DaySchedule;
    friday: DaySchedule;
    saturday: DaySchedule;
    sunday: DaySchedule;
  };
  
  outsideHoursMessage: string;
};

function getDefaultInfoCerimonia(): InfoCerimonia {
  return {
    lugares: '',
    horarios: '',
    documentacao: '',
    prazo_entrega: '',
    valores: '',
  };
}

function getDefaultConfig(): AIConfig {
  return {
    agentName: 'Iara',
    informacoesAdicionais: '',
    perguntasFrequentes: '',
    principaisEventos: '',
    menuPrincipal: '',
    localizacaoIgreja: '',
    informacaoHistorica: '',
    documentacaoNecessaria: '',
    toneOfVoice: 'amigavel',
    textSize: 'curto',
    useEmojis: false,
    sendDocuments: false,
    autoScheduling: false,
    
    // Novos campos
    googleMapsLink: '',
    espacosDisponiveis: '',
    infoCasamento: getDefaultInfoCerimonia(),
    exigeSinal: false,
    regrasSinal: '',
    infoBatizados: getDefaultInfoCerimonia(),
    cursos: '',
    sessaoFotos: '',
    regrasHospedagem: '',
    linkVisitacao: '',
    guiaTuristico: '',
    projetosSociaisEmpresas: '',
    projetosSociaisComunidade: '',
    regrasEspecificas: '',
    hospedagemDisponivel: false,
    
    qualificationFields: {
      nome: true,
      telefone: true,
      email: true,
      interesse: true,
      motivacao: true,
      expectativa: true,
      tipo_evento: true,
    },
    businessHours: {
      monday: { enabled: true, startTime: '09:00', endTime: '18:00' },
      tuesday: { enabled: true, startTime: '09:00', endTime: '18:00' },
      wednesday: { enabled: true, startTime: '09:00', endTime: '18:00' },
      thursday: { enabled: true, startTime: '09:00', endTime: '18:00' },
      friday: { enabled: true, startTime: '09:00', endTime: '18:00' },
      saturday: { enabled: false, startTime: '09:00', endTime: '13:00' },
      sunday: { enabled: false, startTime: '09:00', endTime: '13:00' },
    },
    outsideHoursMessage: 'Desculpe, estamos fora do horário de atendimento. Retornaremos em breve!',
  };
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? 'bg-purple-600' : 'bg-gray-200'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

export function AgentPage() {
  const { user, church, loading: authLoading } = useAuth();
  const [config, setConfig] = useState<AIConfig>(getDefaultConfig());
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar configuração do Supabase
  const loadConfig = useCallback(async () => {
    if (!user || !church) {
      console.log('[AgentPage] Aguardando autenticação... user:', !!user, 'church:', !!church);
      return;
    }
    
    try {
      setIsLoading(true);
      console.log('[AgentPage] Carregando configurações para church:', church.id);
      const data = await aiConfigService.get();
      console.log('[AgentPage] Dados recebidos:', data);
      if (data) {
        const newConfig: AIConfig = {
          agentName: data.agent_name || 'Iara',
          informacoesAdicionais: data.informacoes_adicionais || '',
          perguntasFrequentes: data.perguntas_frequentes || '',
          principaisEventos: data.principais_eventos || '',
          menuPrincipal: data.menu_principal || '',
          localizacaoIgreja: data.localizacao_igreja || '',
          informacaoHistorica: data.informacao_historica || '',
          documentacaoNecessaria: data.documentacao_necessaria || '',
          toneOfVoice: data.tone_of_voice || 'amigavel',
          textSize: data.text_size || 'curto',
          useEmojis: data.use_emojis ?? false,
          sendDocuments: data.send_documents ?? false,
          autoScheduling: data.auto_scheduling ?? false,
          
          // Novos campos
          googleMapsLink: data.google_maps_link || '',
          espacosDisponiveis: data.espacos_disponiveis || '',
          infoCasamento: data.info_casamento as InfoCerimonia || getDefaultInfoCerimonia(),
          exigeSinal: data.exige_sinal ?? false,
          regrasSinal: data.regras_sinal || '',
          infoBatizados: data.info_batizados as InfoCerimonia || getDefaultInfoCerimonia(),
          cursos: data.cursos || '',
          sessaoFotos: data.sessao_fotos || '',
          regrasHospedagem: data.regras_hospedagem || '',
          linkVisitacao: data.link_visitacao || '',
          guiaTuristico: data.guia_turistico || '',
          projetosSociaisEmpresas: data.projetos_sociais_empresas || '',
          projetosSociaisComunidade: data.projetos_sociais_comunidade || '',
          regrasEspecificas: data.regras_especificas || '',
          hospedagemDisponivel: data.hospedagem_disponivel ?? false,
          
          qualificationFields: data.qualification_fields as AIConfig['qualificationFields'] || getDefaultConfig().qualificationFields,
          businessHours: data.business_hours as AIConfig['businessHours'] || getDefaultConfig().businessHours,
          outsideHoursMessage: data.outside_hours_message || 'Desculpe, estamos fora do horário de atendimento. Retornaremos em breve!',
        };
        console.log('[AgentPage] Configuração processada:', newConfig);
        setConfig(newConfig);
      } else {
        console.log('[AgentPage] Nenhum dado encontrado, usando configuração padrão');
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, church]);

  useEffect(() => {
    if (!authLoading) {
      loadConfig();
    }
  }, [authLoading, loadConfig]);

  function updateConfig<K extends keyof AIConfig>(key: K, value: AIConfig[K]) {
    setConfig((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  }


  function updateBusinessHours(day: keyof AIConfig['businessHours'], updates: Partial<DaySchedule>) {
    setConfig((prev) => ({
      ...prev,
      businessHours: {
        ...prev.businessHours,
        [day]: { ...prev.businessHours[day], ...updates },
      },
    }));
    setHasChanges(true);
  }

  function updateInfoCerimonia(tipo: 'infoCasamento' | 'infoBatizados', field: keyof InfoCerimonia, value: string) {
    setConfig((prev) => ({
      ...prev,
      [tipo]: { ...prev[tipo], [field]: value },
    }));
    setHasChanges(true);
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      await aiConfigService.createOrUpdate({
        agent_name: config.agentName,
        informacoes_adicionais: config.informacoesAdicionais,
        perguntas_frequentes: config.perguntasFrequentes,
        principais_eventos: config.principaisEventos,
        menu_principal: config.menuPrincipal,
        localizacao_igreja: config.localizacaoIgreja,
        informacao_historica: config.informacaoHistorica,
        documentacao_necessaria: config.documentacaoNecessaria,
        tone_of_voice: config.toneOfVoice,
        text_size: config.textSize,
        use_emojis: config.useEmojis,
        send_documents: config.sendDocuments,
        auto_scheduling: config.autoScheduling,
        
        // Novos campos
        google_maps_link: config.googleMapsLink,
        espacos_disponiveis: config.espacosDisponiveis,
        info_casamento: config.infoCasamento,
        exige_sinal: config.exigeSinal,
        regras_sinal: config.regrasSinal,
        info_batizados: config.infoBatizados,
        cursos: config.cursos,
        sessao_fotos: config.sessaoFotos,
        regras_hospedagem: config.regrasHospedagem,
        link_visitacao: config.linkVisitacao,
        guia_turistico: config.guiaTuristico,
        projetos_sociais_empresas: config.projetosSociaisEmpresas,
        projetos_sociais_comunidade: config.projetosSociaisComunidade,
        regras_especificas: config.regrasEspecificas,
        hospedagem_disponivel: config.hospedagemDisponivel,
        
        qualification_fields: config.qualificationFields,
        business_hours: config.businessHours,
        outside_hours_message: config.outsideHoursMessage,
      });
      setHasChanges(false);
      alert('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      alert('Erro ao salvar configurações. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  }

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-900 text-white">
            <Settings2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Configurações de IA</h1>
            <p className="text-sm text-gray-500">Configure o comportamento e personalidade do assistente de IA da sua igreja.</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={!hasChanges}
          className="inline-flex items-center gap-2 rounded-md bg-purple-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          <Check className="h-4 w-4" />
          Salvar Alterações
        </button>
      </div>

      <div className="space-y-6">
        {/* Nome e Tom de Fala */}
        <div className="rounded-xl border bg-white p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-1">Nome e Tom de Fala</h2>
          <p className="text-sm text-gray-500 mb-6">Personalize o nome do assistente virtual e escolha o estilo de comunicação que melhor representa sua igreja.</p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Nome do Agente de IA</label>
              <input
                type="text"
                value={config.agentName}
                onChange={(e) => updateConfig('agentName', e.target.value)}
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Tom de Fala</label>
              <select
                value={config.toneOfVoice}
                onChange={(e) => updateConfig('toneOfVoice', e.target.value as AIConfig['toneOfVoice'])}
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100"
              >
                <option value="amigavel">Amigável</option>
                <option value="formal">Formal</option>
                <option value="profissional">Profissional</option>
              </select>
            </div>
          </div>
        </div>

        {/* Informações para IA */}
        <div className="rounded-xl border bg-white p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-1">Informações para a IA</h2>
          <p className="text-sm text-gray-500 mb-6">Configure as informações que a IA usará para atender seus clientes.</p>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Informações Adicionais</label>
              <textarea
                value={config.informacoesAdicionais}
                onChange={(e) => updateConfig('informacoesAdicionais', e.target.value)}
                rows={4}
                placeholder="Informações extras sobre a igreja que a IA deve saber (história, missão, valores, etc.)..."
                className="w-full resize-none rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Perguntas Frequentes</label>
              <textarea
                value={config.perguntasFrequentes}
                onChange={(e) => updateConfig('perguntasFrequentes', e.target.value)}
                rows={4}
                placeholder="Liste as perguntas mais comuns e suas respostas (horários, localização, dízimos, etc.)..."
                className="w-full resize-none rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Principais Eventos</label>
              <textarea
                value={config.principaisEventos}
                onChange={(e) => updateConfig('principaisEventos', e.target.value)}
                rows={4}
                placeholder="Descreva os principais eventos (missas, cultos, retiros, encontros, etc.)..."
                className="w-full resize-none rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Documentação Necessária</label>
              <textarea
                value={config.documentacaoNecessaria}
                onChange={(e) => updateConfig('documentacaoNecessaria', e.target.value)}
                rows={4}
                placeholder="Liste os documentos necessários para cada tipo de serviço (batismo, casamento, etc.)..."
                className="w-full resize-none rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Menu Principal</label>
              <textarea
                value={config.menuPrincipal}
                onChange={(e) => updateConfig('menuPrincipal', e.target.value)}
                rows={4}
                placeholder="Digite o conteúdo do menu que será exibido para o cliente..."
                className="w-full resize-none rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100"
              />
              <p className="mt-1 text-xs text-gray-500">Se preenchido, a IA exibirá este menu de opções para o cliente.</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Localização da Igreja (Capelas e Santuários)</label>
              <textarea
                value={config.localizacaoIgreja}
                onChange={(e) => updateConfig('localizacaoIgreja', e.target.value)}
                rows={4}
                placeholder="Descreva a localização, capelas, santuários e pontos de referência..."
                className="w-full resize-none rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Informação Histórica</label>
              <textarea
                value={config.informacaoHistorica}
                onChange={(e) => updateConfig('informacaoHistorica', e.target.value)}
                rows={4}
                placeholder="Conte a história da igreja, fundação, eventos importantes..."
                className="w-full resize-none rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Link do Google Maps</label>
              <input
                type="url"
                value={config.googleMapsLink}
                onChange={(e) => updateConfig('googleMapsLink', e.target.value)}
                placeholder="https://maps.google.com/..."
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Espaços Disponíveis</label>
              <textarea
                value={config.espacosDisponiveis}
                onChange={(e) => updateConfig('espacosDisponiveis', e.target.value)}
                rows={4}
                placeholder="Descreva os espaços disponíveis (capelas, santuários, salões, jardins, etc.)..."
                className="w-full resize-none rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Regras Específicas</label>
              <textarea
                value={config.regrasEspecificas}
                onChange={(e) => updateConfig('regrasEspecificas', e.target.value)}
                rows={4}
                placeholder="Regras específicas da igreja que a IA deve informar..."
                className="w-full resize-none rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100"
              />
            </div>
          </div>
        </div>

        {/* Informações sobre Casamentos */}
        <div className="rounded-xl border bg-white p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-1">Informações sobre Casamentos</h2>
          <p className="text-sm text-gray-500 mb-6">Configure as informações sobre casamentos que a IA deve fornecer.</p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Lugares para Casamentos</label>
              <textarea
                value={config.infoCasamento.lugares}
                onChange={(e) => updateInfoCerimonia('infoCasamento', 'lugares', e.target.value)}
                rows={3}
                placeholder="Capelas, santuários, jardins disponíveis para casamentos..."
                className="w-full resize-none rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Horários Disponíveis</label>
              <textarea
                value={config.infoCasamento.horarios}
                onChange={(e) => updateInfoCerimonia('infoCasamento', 'horarios', e.target.value)}
                rows={3}
                placeholder="Horários disponíveis para cerimônias de casamento..."
                className="w-full resize-none rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Documentação Necessária</label>
              <textarea
                value={config.infoCasamento.documentacao}
                onChange={(e) => updateInfoCerimonia('infoCasamento', 'documentacao', e.target.value)}
                rows={3}
                placeholder="Lista de documentos necessários para casamento..."
                className="w-full resize-none rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Prazo para Entrega de Documentos</label>
              <textarea
                value={config.infoCasamento.prazo_entrega}
                onChange={(e) => updateInfoCerimonia('infoCasamento', 'prazo_entrega', e.target.value)}
                rows={2}
                placeholder="Prazo mínimo para entrega de documentação..."
                className="w-full resize-none rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Valores e Pagamento</label>
              <textarea
                value={config.infoCasamento.valores}
                onChange={(e) => updateInfoCerimonia('infoCasamento', 'valores', e.target.value)}
                rows={3}
                placeholder="Valores, formas de pagamento, taxas..."
                className="w-full resize-none rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100"
              />
            </div>
          </div>
        </div>

        {/* Informações sobre Batizados */}
        <div className="rounded-xl border bg-white p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-1">Informações sobre Batizados</h2>
          <p className="text-sm text-gray-500 mb-6">Configure as informações sobre batizados que a IA deve fornecer.</p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Lugares para Batizados</label>
              <textarea
                value={config.infoBatizados.lugares}
                onChange={(e) => updateInfoCerimonia('infoBatizados', 'lugares', e.target.value)}
                rows={3}
                placeholder="Capelas, batistérios disponíveis para batizados..."
                className="w-full resize-none rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Horários Disponíveis</label>
              <textarea
                value={config.infoBatizados.horarios}
                onChange={(e) => updateInfoCerimonia('infoBatizados', 'horarios', e.target.value)}
                rows={3}
                placeholder="Horários disponíveis para cerimônias de batizado..."
                className="w-full resize-none rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Documentação Necessária</label>
              <textarea
                value={config.infoBatizados.documentacao}
                onChange={(e) => updateInfoCerimonia('infoBatizados', 'documentacao', e.target.value)}
                rows={3}
                placeholder="Lista de documentos necessários para batizado..."
                className="w-full resize-none rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Prazo para Entrega de Documentos</label>
              <textarea
                value={config.infoBatizados.prazo_entrega}
                onChange={(e) => updateInfoCerimonia('infoBatizados', 'prazo_entrega', e.target.value)}
                rows={2}
                placeholder="Prazo mínimo para entrega de documentação..."
                className="w-full resize-none rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Valores e Pagamento</label>
              <textarea
                value={config.infoBatizados.valores}
                onChange={(e) => updateInfoCerimonia('infoBatizados', 'valores', e.target.value)}
                rows={3}
                placeholder="Valores, formas de pagamento, taxas..."
                className="w-full resize-none rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100"
              />
            </div>
          </div>
        </div>

        {/* Sinal e Reservas */}
        <div className="rounded-xl border bg-white p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-1">Sinal e Reservas</h2>
          <p className="text-sm text-gray-500 mb-6">Configure as regras de sinal para reservas.</p>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-semibold text-gray-700">Exige Sinal para Reservas?</p>
                <p className="text-xs text-gray-500">Se ativado, a IA informará sobre a necessidade de sinal.</p>
              </div>
              <Toggle checked={config.exigeSinal} onChange={(val) => updateConfig('exigeSinal', val)} />
            </div>

            {config.exigeSinal && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Regras para Sinal</label>
                <textarea
                  value={config.regrasSinal}
                  onChange={(e) => updateConfig('regrasSinal', e.target.value)}
                  rows={4}
                  placeholder="Valor do sinal, prazo, formas de pagamento, política de cancelamento..."
                  className="w-full resize-none rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100"
                />
              </div>
            )}
          </div>
        </div>

        {/* Cursos e Sessão de Fotos */}
        <div className="rounded-xl border bg-white p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-1">Cursos e Sessão de Fotos</h2>
          <p className="text-sm text-gray-500 mb-6">Informações sobre cursos oferecidos e sessões de fotos.</p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Cursos Oferecidos</label>
              <textarea
                value={config.cursos}
                onChange={(e) => updateConfig('cursos', e.target.value)}
                rows={4}
                placeholder="Cursos de preparação para casamento, batismo, catequese, etc..."
                className="w-full resize-none rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Sessão de Fotos</label>
              <textarea
                value={config.sessaoFotos}
                onChange={(e) => updateConfig('sessaoFotos', e.target.value)}
                rows={4}
                placeholder="Regras, horários, valores e locais disponíveis para sessão de fotos..."
                className="w-full resize-none rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100"
              />
            </div>
          </div>
        </div>

        {/* Hospedagem */}
        <div className="rounded-xl border bg-white p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-1">Hospedagem</h2>
          <p className="text-sm text-gray-500 mb-6">Configure informações sobre hospedagem disponível.</p>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-semibold text-gray-700">Hospedagem Disponível?</p>
                <p className="text-xs text-gray-500">Se a igreja oferece hospedagem para visitantes.</p>
              </div>
              <Toggle checked={config.hospedagemDisponivel} onChange={(val) => updateConfig('hospedagemDisponivel', val)} />
            </div>

            {config.hospedagemDisponivel && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Regras para Hospedagem</label>
                <textarea
                  value={config.regrasHospedagem}
                  onChange={(e) => updateConfig('regrasHospedagem', e.target.value)}
                  rows={4}
                  placeholder="Regras, valores, disponibilidade, como reservar..."
                  className="w-full resize-none rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100"
                />
              </div>
            )}
          </div>
        </div>

        {/* Visitação e Turismo */}
        <div className="rounded-xl border bg-white p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-1">Visitação e Turismo</h2>
          <p className="text-sm text-gray-500 mb-6">Configure informações sobre visitação e turismo.</p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Link para Agendamento de Visitação</label>
              <input
                type="url"
                value={config.linkVisitacao}
                onChange={(e) => updateConfig('linkVisitacao', e.target.value)}
                placeholder="https://..."
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Guia Turístico / Visita Autoguiada</label>
              <textarea
                value={config.guiaTuristico}
                onChange={(e) => updateConfig('guiaTuristico', e.target.value)}
                rows={4}
                placeholder="Informações sobre visita autoguiada, pontos de interesse, horários de visitação..."
                className="w-full resize-none rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100"
              />
            </div>
          </div>
        </div>

        {/* Projetos Sociais */}
        <div className="rounded-xl border bg-white p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-1">Projetos Sociais</h2>
          <p className="text-sm text-gray-500 mb-6">Configure informações sobre projetos sociais da igreja.</p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Projetos Sociais para Parceria com Empresas</label>
              <textarea
                value={config.projetosSociaisEmpresas}
                onChange={(e) => updateConfig('projetosSociaisEmpresas', e.target.value)}
                rows={4}
                placeholder="Projetos disponíveis para parceria com empresas, patrocínios, doações corporativas..."
                className="w-full resize-none rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Projetos Sociais para Comunidade</label>
              <textarea
                value={config.projetosSociaisComunidade}
                onChange={(e) => updateConfig('projetosSociaisComunidade', e.target.value)}
                rows={4}
                placeholder="Projetos disponíveis para a comunidade, como participar, voluntariado..."
                className="w-full resize-none rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100"
              />
            </div>
          </div>
        </div>

        {/* Configurações de Texto */}
        <div className="rounded-xl border bg-white p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-1">Configurações de Texto</h2>
          <p className="text-sm text-gray-500 mb-6">Personalize como a IA estrutura suas respostas.</p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Tamanho dos Textos</label>
              <select
                value={config.textSize}
                onChange={(e) => updateConfig('textSize', e.target.value as AIConfig['textSize'])}
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100"
              >
                <option value="curto">Curto</option>
                <option value="medio">Médio</option>
                <option value="longo">Longo</option>
              </select>
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-semibold text-gray-700">Usar Emojis</p>
                <p className="text-xs text-gray-500">Permite que a IA use emojis nas respostas.</p>
              </div>
              <Toggle checked={config.useEmojis} onChange={(val) => updateConfig('useEmojis', val)} />
            </div>
          </div>
        </div>

        {/* Configurações de Agendamento e Envio de Materiais */}
        <div className="rounded-xl border bg-white p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-1">Configurações de Agendamento e Envio de Materiais</h2>
          <p className="text-sm text-gray-500 mb-6">Configure como a IA deve se comportar com agendamentos, os horários disponíveis e o envio de documentos aos clientes.</p>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-semibold text-gray-700">IA enviará documentos?</p>
                <p className="text-xs text-gray-500">Quando ativado, a área de Arquivos IA ficará visível e funcional.</p>
              </div>
              <Toggle checked={config.sendDocuments} onChange={(val) => updateConfig('sendDocuments', val)} />
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-semibold text-gray-700">Agendamentos com IA?</p>
                <p className="text-xs text-gray-500">Permitir que a IA realize agendamentos automaticamente.</p>
              </div>
              <Toggle checked={config.autoScheduling} onChange={(val) => updateConfig('autoScheduling', val)} />
            </div>
          </div>
        </div>

        {/* Configurações de Qualificação */}
        <div className="rounded-xl border bg-white p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-1">Configurações de Qualificação</h2>
          <p className="text-sm text-gray-500 mb-6">Configure quais informações a IA deve coletar para qualificar os leads.</p>

          <div className="mb-6">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Campos Obrigatórios</h3>
            <p className="text-xs text-gray-500 mb-4">Estes campos são sempre obrigatórios na qualificação de leads.</p>
            
            <div className="space-y-3">
              {[
                { key: 'nome' as const, label: 'Nome' },
                { key: 'telefone' as const, label: 'Telefone' },
                { key: 'email' as const, label: 'Email' },
                { key: 'interesse' as const, label: 'Serviço de Interesse' },
                { key: 'motivacao' as const, label: 'Motivação' },
                { key: 'expectativa' as const, label: 'Expectativa' },
                { key: 'tipo_evento' as const, label: 'Tipo de Evento' },
              ].map((field) => (
                <div key={field.key} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <span className="text-sm text-gray-700">{field.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-green-600 font-medium">Obrigatório</span>
                    <Check className="h-4 w-4 text-green-600" />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Horários de Funcionamento */}
        <div className="rounded-xl border bg-white p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-1">Horários de Funcionamento</h2>
          <p className="text-sm text-gray-500 mb-6">Configure os horários em que a IA estará ativa para atendimento.</p>

          <div className="space-y-4">
            {[
              { key: 'monday' as const, label: 'Segunda' },
              { key: 'tuesday' as const, label: 'Terça' },
              { key: 'wednesday' as const, label: 'Quarta' },
              { key: 'thursday' as const, label: 'Quinta' },
              { key: 'friday' as const, label: 'Sexta' },
              { key: 'saturday' as const, label: 'Sábado' },
              { key: 'sunday' as const, label: 'Domingo' },
            ].map((day) => (
              <div key={day.key} className="flex items-center gap-4">
                <div className="w-24">
                  <span className="text-sm font-medium text-gray-700">{day.label}</span>
                </div>
                <Toggle
                  checked={config.businessHours[day.key].enabled}
                  onChange={(val) => updateBusinessHours(day.key, { enabled: val })}
                />
                <input
                  type="time"
                  value={config.businessHours[day.key].startTime}
                  onChange={(e) => updateBusinessHours(day.key, { startTime: e.target.value })}
                  disabled={!config.businessHours[day.key].enabled}
                  className="rounded-md border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100 disabled:bg-gray-50 disabled:text-gray-400"
                />
                <span className="text-sm text-gray-500">às</span>
                <input
                  type="time"
                  value={config.businessHours[day.key].endTime}
                  onChange={(e) => updateBusinessHours(day.key, { endTime: e.target.value })}
                  disabled={!config.businessHours[day.key].enabled}
                  className="rounded-md border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100 disabled:bg-gray-50 disabled:text-gray-400"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Mensagem Fora do Horário */}
        <div className="rounded-xl border bg-white p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-1">Mensagem Fora do Horário</h2>
          <p className="text-sm text-gray-500 mb-6">Mensagem exibida quando o atendimento estiver indisponível fora do horário de funcionamento.</p>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Mensagem de Ausência</label>
            <textarea
              value={config.outsideHoursMessage}
              onChange={(e) => updateConfig('outsideHoursMessage', e.target.value)}
              rows={3}
              className="w-full resize-none rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100"
            />
          </div>
        </div>
      </div>

      {/* Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 border-t bg-white p-4 shadow-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-end">
          <button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className="inline-flex items-center gap-2 rounded-md bg-purple-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            <Check className="h-4 w-4" />
            {isSaving ? 'Salvando...' : 'Salvar Configurações'}
          </button>
        </div>
      </div>
    </div>
  );
}
