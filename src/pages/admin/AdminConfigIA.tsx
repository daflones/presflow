import { useEffect, useState } from 'react';
import { Bot, Search, Pencil, X, Check, Church, Clock, FileText, Settings, Phone, MessageSquare, Calendar, Plus, Trash2, ClipboardList } from 'lucide-react';
import { adminService } from '../../services/supabase/admin';
import type { AIConfig, Church as ChurchType, BlockedDatePeriod } from '../../types/database';
import { useSearchParams } from 'react-router-dom';

const DEFAULT_BUSINESS_HOURS = {
  monday: { enabled: true, startTime: '09:00', endTime: '18:00' },
  tuesday: { enabled: true, startTime: '09:00', endTime: '18:00' },
  wednesday: { enabled: true, startTime: '09:00', endTime: '18:00' },
  thursday: { enabled: true, startTime: '09:00', endTime: '18:00' },
  friday: { enabled: true, startTime: '09:00', endTime: '18:00' },
  saturday: { enabled: false, startTime: '09:00', endTime: '13:00' },
  sunday: { enabled: false, startTime: '09:00', endTime: '13:00' },
};

const DEFAULT_QUALIFICATION_FIELDS = {
  nome: true,
  telefone: true,
  email: true,
  interesse: true,
  motivacao: true,
  expectativa: true,
  tipo_evento: true,
};

const DAY_LABELS: Record<string, string> = {
  monday: 'Segunda',
  tuesday: 'Terça',
  wednesday: 'Quarta',
  thursday: 'Quinta',
  friday: 'Sexta',
  saturday: 'Sábado',
  sunday: 'Domingo',
};

const QUALIFICATION_LABELS: Record<string, string> = {
  nome: 'Nome',
  telefone: 'Telefone',
  email: 'Email',
  interesse: 'Serviço de Interesse',
  motivacao: 'Motivação',
  expectativa: 'Expectativa',
  tipo_evento: 'Tipo de Evento',
  business_hours: 'Horário de Funcionamento',
};

const createDefaultEditForm = () => ({
  agent_name: '',
  informacoes_adicionais: '',
  perguntas_frequentes: '',
  principais_eventos: '',
  menu_principal: '',
  localizacao_igreja: '',
  informacao_historica: '',
  documentacao_necessaria: '',
  tone_of_voice: 'amigavel' as 'amigavel' | 'formal' | 'profissional',
  text_size: 'curto' as 'curto' | 'medio' | 'longo',
  use_emojis: false,
  send_documents: false,
  auto_scheduling: false,
  outside_hours_message: '',
  google_maps_link: '',
  espacos_disponiveis: '',
  info_casamento: { lugares: '', horarios: '', documentacao: '', prazo_entrega: '', valores: '' },
  exige_sinal: false,
  regras_sinal: '',
  info_batizados: { lugares: '', horarios: '', documentacao: '', prazo_entrega: '', valores: '' },
  cursos: '',
  sessao_fotos: '',
  regras_hospedagem: '',
  link_visitacao: '',
  guia_turistico: '',
  projetos_sociais_empresas: '',
  projetos_sociais_comunidade: '',
  regras_especificas: '',
  hospedagem_disponivel: false,
  imagens_acomodacoes: '',
  agent_gender: 'feminino' as 'feminino' | 'masculino' | 'neutro',
  greeting_message: '',
  error_message: '',
  phone_landline: '',
  phone_whatsapp: '',
  email_main: '',
  email_secretary: '',
  email_documents: '',
  contact_general: '',
  allow_scheduling_lent: true,
  allow_scheduling_jubilee: true,
  blocked_dates: [] as BlockedDatePeriod[],
  max_simultaneous_events: 1,
  donation_text: '',
  prayer_text: '',
  confirmation_text: '',
  unavailability_text: '',
  post_scheduling_text: '',
  qualification_fields: DEFAULT_QUALIFICATION_FIELDS,
  business_hours: DEFAULT_BUSINESS_HOURS,
});

export function AdminConfigIA() {
  const [searchParams] = useSearchParams();
  const churchIdParam = searchParams.get('church');
  
  const [configs, setConfigs] = useState<(AIConfig & { church?: ChurchType })[]>([]);
  const [churches, setChurches] = useState<ChurchType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterChurch, setFilterChurch] = useState(churchIdParam || '');
  
  // Edit modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<AIConfig | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'identity' | 'contacts' | 'services' | 'hospedagem' | 'visitacao' | 'scheduling' | 'messages' | 'qualification' | 'hours'>('identity');
  
  const [modalMode, setModalMode] = useState<'edit' | 'create'>('edit');
  const [creatingChurchId, setCreatingChurchId] = useState<string | null>(null);
  const [pendingChurchId, setPendingChurchId] = useState('');
  const [editForm, setEditForm] = useState(createDefaultEditForm);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (churchIdParam) {
      setFilterChurch(churchIdParam);
    }
  }, [churchIdParam]);

  async function loadData() {
    setIsLoading(true);
    try {
      const [configsData, churchesData] = await Promise.all([
        adminService.listAIConfigs(),
        adminService.listChurches(),
      ]);
      setConfigs(configsData);
      setChurches(churchesData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function openEdit(config: AIConfig) {
    setSelectedConfig(config);
    setActiveTab('identity');
    setEditForm({
      agent_name: config.agent_name || '',
      informacoes_adicionais: config.informacoes_adicionais || '',
      perguntas_frequentes: config.perguntas_frequentes || '',
      principais_eventos: config.principais_eventos || '',
      menu_principal: config.menu_principal || '',
      localizacao_igreja: config.localizacao_igreja || '',
      informacao_historica: config.informacao_historica || '',
      documentacao_necessaria: config.documentacao_necessaria || '',
      tone_of_voice: config.tone_of_voice || 'amigavel',
      text_size: config.text_size || 'curto',
      use_emojis: config.use_emojis || false,
      send_documents: config.send_documents || false,
      auto_scheduling: config.auto_scheduling || false,
      outside_hours_message: config.outside_hours_message || '',
      // Campos de serviços
      google_maps_link: config.google_maps_link || '',
      espacos_disponiveis: config.espacos_disponiveis || '',
      info_casamento: config.info_casamento || { lugares: '', horarios: '', documentacao: '', prazo_entrega: '', valores: '' },
      exige_sinal: config.exige_sinal || false,
      regras_sinal: config.regras_sinal || '',
      info_batizados: config.info_batizados || { lugares: '', horarios: '', documentacao: '', prazo_entrega: '', valores: '' },
      cursos: config.cursos || '',
      sessao_fotos: config.sessao_fotos || '',
      regras_hospedagem: config.regras_hospedagem || '',
      link_visitacao: config.link_visitacao || '',
      guia_turistico: config.guia_turistico || '',
      projetos_sociais_empresas: config.projetos_sociais_empresas || '',
      projetos_sociais_comunidade: config.projetos_sociais_comunidade || '',
      regras_especificas: config.regras_especificas || '',
      hospedagem_disponivel: config.hospedagem_disponivel || false,
      imagens_acomodacoes: config.imagens_acomodacoes || '',
      // Identidade do Agente
      agent_gender: config.agent_gender || 'feminino',
      greeting_message: config.greeting_message || '',
      error_message: config.error_message || '',
      // Contatos da Igreja
      phone_landline: config.phone_landline || '',
      phone_whatsapp: config.phone_whatsapp || '',
      email_main: config.email_main || '',
      email_secretary: config.email_secretary || '',
      email_documents: config.email_documents || '',
      contact_general: config.contact_general || '',
      // Regras de Agendamento
      allow_scheduling_lent: config.allow_scheduling_lent ?? true,
      allow_scheduling_jubilee: config.allow_scheduling_jubilee ?? true,
      blocked_dates: config.blocked_dates || [],
      max_simultaneous_events: config.max_simultaneous_events || 1,
      // Mensagens Personalizadas
      donation_text: config.donation_text || '',
      prayer_text: config.prayer_text || '',
      confirmation_text: config.confirmation_text || '',
      unavailability_text: config.unavailability_text || '',
      post_scheduling_text: config.post_scheduling_text || '',
      // Campos existentes
      qualification_fields: config.qualification_fields || DEFAULT_QUALIFICATION_FIELDS,
      business_hours: config.business_hours || DEFAULT_BUSINESS_HOURS,
    });
    setIsModalOpen(true);
    setModalMode('edit');
    setCreatingChurchId(null);
    setPendingChurchId('');
  }

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedConfig(null);
    setModalMode('edit');
    setCreatingChurchId(null);
    setPendingChurchId('');
  }

  const openCreateModal = (churchId: string) => {
    setModalMode('create');
    setCreatingChurchId(churchId);
    setSelectedConfig(null);
    setEditForm(createDefaultEditForm());
    setActiveTab('identity');
    setIsModalOpen(true);
  };

  async function handleSave() {
    setIsSaving(true);
    try {
      if (modalMode === 'edit' && selectedConfig) {
        const result = await adminService.updateAIConfig(selectedConfig.id, editForm);
        if (result) {
          alert('Configurações salvas com sucesso!');
          closeModal();
          loadData();
        } else {
          alert('Erro ao salvar configuração. Tente novamente.');
        }
      } else if (modalMode === 'create' && creatingChurchId) {
        await adminService.createAIConfig({
          church_id: creatingChurchId,
          ...editForm,
        });
        alert('Configuração criada com sucesso!');
        closeModal();
        loadData();
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert(`Erro ao salvar configuração: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsSaving(false);
    }
  }

  const churchesWithConfig = new Set(configs.map(config => config.church_id));
  const churchesWithoutConfig = churches.filter(church => !churchesWithConfig.has(church.id));

  const filteredConfigs = configs.filter(config => {
    const matchesSearch = config.agent_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      config.church?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesChurch = !filterChurch || config.church_id === filterChurch;
    return matchesSearch && matchesChurch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Configurações de IA</h1>
        <p className="text-gray-400 mt-1">Edite as configurações de IA de cada igreja</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar por nome do agente ou igreja..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
          />
        </div>
        <select
          value={filterChurch}
          onChange={(e) => setFilterChurch(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
        >
          <option value="">Todas as igrejas</option>
          {churches.map(church => (
            <option key={church.id} value={church.id}>{church.name}</option>
          ))}
        </select>
      </div>
      {churchesWithoutConfig.length > 0 && (
        <div className="flex flex-col md:flex-row gap-3 items-center text-sm text-gray-300">
          <span className="text-gray-400">Igrejas sem configuração</span>
          <select
            value={pendingChurchId}
            onChange={(e) => setPendingChurchId(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
          >
            <option value="">Selecione uma igreja</option>
            {churchesWithoutConfig.map(church => (
              <option key={church.id} value={church.id}>{church.name}</option>
            ))}
          </select>
          <button
            onClick={() => pendingChurchId && openCreateModal(pendingChurchId)}
            disabled={!pendingChurchId}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Criar configuração
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          </div>
        ) : filteredConfigs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Bot className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">Nenhuma configuração encontrada</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-900/50 border-b border-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Igreja</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Agente</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Tom</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Tamanho</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Emojis</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Agendamento</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredConfigs.map((config) => (
                <tr key={config.id} className="hover:bg-gray-700/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Church className="h-4 w-4 text-blue-400" />
                      <span className="text-white">{config.church?.name || '-'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Bot className="h-4 w-4 text-purple-400" />
                      <span className="text-white font-medium">{config.agent_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 text-xs font-medium bg-gray-700 text-gray-300 rounded">
                      {config.tone_of_voice}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 text-xs font-medium bg-gray-700 text-gray-300 rounded">
                      {config.text_size}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {config.use_emojis ? (
                      <Check className="h-4 w-4 text-green-400" />
                    ) : (
                      <X className="h-4 w-4 text-gray-500" />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {config.auto_scheduling ? (
                      <Check className="h-4 w-4 text-green-400" />
                    ) : (
                      <X className="h-4 w-4 text-gray-500" />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end">
                      <button
                        onClick={() => openEdit(config)}
                        className="p-2 rounded-lg hover:bg-gray-600 text-gray-400 hover:text-purple-400"
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit Modal */}
      {isModalOpen && (modalMode === 'edit' ? !!selectedConfig : true) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-gray-800 rounded-xl shadow-xl w-full max-w-6xl h-[90vh] border border-gray-700 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 shrink-0">
              <h2 className="text-lg font-bold text-white">
                {modalMode === 'edit'
                  ? 'Editar Configuração de IA'
                  : `Criar Configuração de IA${creatingChurchId ? ` - ${churches.find(c => c.id === creatingChurchId)?.name || ''}` : ''}`.trim()}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 rounded-lg hover:bg-gray-700 text-gray-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body with Sidebar */}
            <div className="flex flex-1 min-h-0">
              {/* Sidebar Navigation */}
              <div className="w-48 bg-gray-900/50 border-r border-gray-700 py-4 shrink-0">
                <nav className="space-y-1 px-2">
                  {[
                    { id: 'identity', label: 'Identidade', icon: Bot },
                    { id: 'general', label: 'Geral', icon: Settings },
                    { id: 'contacts', label: 'Contatos', icon: Phone },
                    { id: 'visitacao', label: 'Visitação', icon: ClipboardList },
                    { id: 'scheduling', label: 'Agendamento', icon: Calendar },
                    { id: 'messages', label: 'Mensagens', icon: MessageSquare },
                    { id: 'qualification', label: 'Qualificação', icon: FileText },
                    { id: 'hours', label: 'Horários', icon: Clock },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as typeof activeTab)}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        activeTab === tab.id
                          ? 'bg-purple-600 text-white'
                          : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                      }`}
                    >
                      <tab.icon className="h-4 w-4" />
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-y-auto p-6">
              {/* Tab: General */}
              {activeTab === 'general' && (
                <div className="space-y-6">
                  {/* Agent Info */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider">Informações do Agente</h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Menu Principal</label>
                      <p className="text-xs text-gray-500 mb-2">Digite o conteúdo do menu de opções que será exibido ao cliente no início da conversa</p>
                      <textarea
                        value={editForm.menu_principal}
                        onChange={(e) => setEditForm({ ...editForm, menu_principal: e.target.value })}
                        rows={4}
                        placeholder="Ex: Olá! Como posso ajudar? Digite: 1️⃣ Horários de missas 2️⃣ Casamentos 3️⃣ Batizados 4️⃣ Outros serviços 5️⃣ Falar com atendente"
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 resize-none text-sm"
                      />
                      <p className="text-xs text-gray-500 mt-1">Se preenchido, a IA exibirá este menu de opções para o cliente no início da conversa.</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Informações Adicionais para IA</label>
                      <p className="text-xs text-gray-500 mb-2">Contexto extra sobre a igreja que a IA deve saber (história, diferenciais, valores, missão)</p>
                      <textarea
                        value={editForm.informacoes_adicionais}
                        onChange={(e) => setEditForm({ ...editForm, informacoes_adicionais: e.target.value })}
                        rows={4}
                        placeholder="Ex: Somos uma paróquia centenária fundada em 1920, conhecida pela arquitetura neogótica e pelos vitrais históricos. Nossa missão é acolher a todos com amor e fé..."
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 resize-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Perguntas Frequentes</label>
                      <p className="text-xs text-gray-500 mb-2">Liste perguntas comuns e suas respostas para a IA responder com precisão</p>
                      <textarea
                        value={editForm.perguntas_frequentes}
                        onChange={(e) => setEditForm({ ...editForm, perguntas_frequentes: e.target.value })}
                        rows={4}
                        placeholder="Ex: P: Qual o horário das missas? R: Missas de segunda a sexta às 7h e 19h, sábados às 17h, domingos às 8h, 10h e 19h..."
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 resize-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Principais Eventos</label>
                      <p className="text-xs text-gray-500 mb-2">Descreva eventos principais (missas, cultos, retiros, festividades, celebrações especiais)</p>
                      <textarea
                        value={editForm.principais_eventos}
                        onChange={(e) => setEditForm({ ...editForm, principais_eventos: e.target.value })}
                        rows={4}
                        placeholder="Ex: Festa do Padroeiro em junho, Retiro de Carnaval, Via Sacra na Semana Santa, Missa de Natal às 22h..."
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 resize-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Documentação Necessária</label>
                      <p className="text-xs text-gray-500 mb-2">Liste documentos gerais necessários para cada tipo de serviço oferecido</p>
                      <textarea
                        value={editForm.documentacao_necessaria}
                        onChange={(e) => setEditForm({ ...editForm, documentacao_necessaria: e.target.value })}
                        rows={4}
                        placeholder="Ex: Para casamento: certidão de batismo, curso de noivos. Para batizado: certidão de nascimento, RG dos padrinhos..."
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 resize-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Localização da Igreja (Capelas e Santuários)</label>
                      <p className="text-xs text-gray-500 mb-2">Descreva a localização, capelas, santuários e pontos de referência para orientar visitantes</p>
                      <textarea
                        value={editForm.localizacao_igreja}
                        onChange={(e) => setEditForm({ ...editForm, localizacao_igreja: e.target.value })}
                        rows={4}
                        placeholder="Ex: Rua das Flores, 123 - Centro. Próximo à Praça da Matriz. Estacionamento próprio. Capela lateral dedicada a Nossa Senhora..."
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 resize-none text-sm"
                      />
                    </div>
                  </div>

                  {/* Text Config */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider">Configurações de Texto</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Tom de Voz</label>
                        <p className="text-xs text-gray-500 mb-2">Defina o estilo de comunicação da IA</p>
                        <select
                          value={editForm.tone_of_voice}
                          onChange={(e) => setEditForm({ ...editForm, tone_of_voice: e.target.value as any })}
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                        >
                          <option value="amigavel">Amigável - Acolhedor e próximo</option>
                          <option value="formal">Formal - Respeitoso e tradicional</option>
                          <option value="profissional">Profissional - Objetivo e claro</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Tamanho do Texto</label>
                        <p className="text-xs text-gray-500 mb-2">Configure a extensão das respostas</p>
                        <select
                          value={editForm.text_size}
                          onChange={(e) => setEditForm({ ...editForm, text_size: e.target.value as any })}
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                        >
                          <option value="curto">Curto - Respostas diretas</option>
                          <option value="medio">Médio - Respostas equilibradas</option>
                          <option value="longo">Longo - Respostas detalhadas</option>
                        </select>
                      </div>
                    </div>
                    <div className="p-3 bg-gray-700/50 rounded-lg">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editForm.use_emojis}
                          onChange={(e) => setEditForm({ ...editForm, use_emojis: e.target.checked })}
                          className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-purple-500 focus:ring-purple-500"
                        />
                        <div>
                          <span className="text-sm text-gray-300">Usar Emojis nas respostas</span>
                          <p className="text-xs text-gray-500">A IA incluirá emojis para tornar as mensagens mais expressivas e amigáveis</p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Scheduling & Documents */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider">Agendamento e Documentos</h3>
                    <div className="p-3 bg-gray-700/50 rounded-lg">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editForm.send_documents}
                          onChange={(e) => setEditForm({ ...editForm, send_documents: e.target.checked })}
                          className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-purple-500 focus:ring-purple-500"
                        />
                        <div>
                          <span className="text-sm text-gray-300">IA envia documentos?</span>
                          <p className="text-xs text-gray-500">Quando ativado, a IA pode enviar arquivos, imagens e PDFs cadastrados aos clientes</p>
                        </div>
                      </label>
                    </div>
                    <div className="p-3 bg-gray-700/50 rounded-lg">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editForm.auto_scheduling}
                          onChange={(e) => setEditForm({ ...editForm, auto_scheduling: e.target.checked })}
                          className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-purple-500 focus:ring-purple-500"
                        />
                        <div>
                          <span className="text-sm text-gray-300">Agendamento com IA?</span>
                          <p className="text-xs text-gray-500">Permite que a IA realize agendamentos automaticamente no calendário da igreja</p>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Identity */}
              {activeTab === 'identity' && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider">Identidade do Agente</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Nome do Agente</label>
                        <p className="text-xs text-gray-500 mb-2">Nome que a IA usará para se identificar</p>
                        <input
                          type="text"
                          value={editForm.agent_name}
                          onChange={(e) => setEditForm({ ...editForm, agent_name: e.target.value })}
                          placeholder="Ex: Iara, Maria, Assistente..."
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Gênero / Persona</label>
                        <p className="text-xs text-gray-500 mb-2">Define como a IA se refere a si mesma</p>
                        <select
                          value={editForm.agent_gender}
                          onChange={(e) => setEditForm({ ...editForm, agent_gender: e.target.value as any })}
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                        >
                          <option value="feminino">Feminino - "Eu sou a assistente..."</option>
                          <option value="masculino">Masculino - "Eu sou o assistente..."</option>
                          <option value="neutro">Neutro - "Sou assistente virtual..."</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Frase de Apresentação Inicial</label>
                      <p className="text-xs text-gray-500 mb-2">Mensagem de boas-vindas que a IA enviará no início da conversa</p>
                      <textarea
                        value={editForm.greeting_message}
                        onChange={(e) => setEditForm({ ...editForm, greeting_message: e.target.value })}
                        rows={3}
                        placeholder="Ex: Olá! Sou a Iara, assistente virtual da Paróquia. Como posso ajudá-lo hoje?"
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 resize-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Mensagem de Erro Padrão</label>
                      <p className="text-xs text-gray-500 mb-2">Mensagem exibida quando ocorre um erro ou a IA não consegue processar</p>
                      <textarea
                        value={editForm.error_message}
                        onChange={(e) => setEditForm({ ...editForm, error_message: e.target.value })}
                        rows={3}
                        placeholder="Ex: Desculpe, não consegui processar sua solicitação. Por favor, tente novamente ou entre em contato conosco."
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 resize-none text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Contacts */}
              {activeTab === 'contacts' && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider">Telefones</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Telefone Fixo</label>
                        <p className="text-xs text-gray-500 mb-2">Número do telefone fixo da igreja</p>
                        <input
                          type="tel"
                          value={editForm.phone_landline}
                          onChange={(e) => setEditForm({ ...editForm, phone_landline: e.target.value })}
                          placeholder="(11) 3333-4444"
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">WhatsApp</label>
                        <p className="text-xs text-gray-500 mb-2">Número de WhatsApp para contato</p>
                        <input
                          type="tel"
                          value={editForm.phone_whatsapp}
                          onChange={(e) => setEditForm({ ...editForm, phone_whatsapp: e.target.value })}
                          placeholder="(11) 99999-8888"
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider">E-mails</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">E-mail Principal</label>
                        <input
                          type="email"
                          value={editForm.email_main}
                          onChange={(e) => setEditForm({ ...editForm, email_main: e.target.value })}
                          placeholder="contato@paroquia.com.br"
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">E-mail da Secretaria</label>
                        <input
                          type="email"
                          value={editForm.email_secretary}
                          onChange={(e) => setEditForm({ ...editForm, email_secretary: e.target.value })}
                          placeholder="secretaria@paroquia.com.br"
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">E-mail para Documentos</label>
                        <input
                          type="email"
                          value={editForm.email_documents}
                          onChange={(e) => setEditForm({ ...editForm, email_documents: e.target.value })}
                          placeholder="documentos@paroquia.com.br"
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Contato para Dúvidas Gerais</label>
                      <p className="text-xs text-gray-500 mb-2">Informações adicionais de contato que a IA pode fornecer</p>
                      <textarea
                        value={editForm.contact_general}
                        onChange={(e) => setEditForm({ ...editForm, contact_general: e.target.value })}
                        rows={3}
                        placeholder="Ex: Para dúvidas sobre casamentos, ligue para (11) 3333-4444 ramal 2. Para batizados, envie e-mail para batizados@paroquia.com.br"
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 resize-none text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Scheduling */}
              {activeTab === 'scheduling' && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider">Regras de Agendamento</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-gray-700/50 rounded-lg">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editForm.allow_scheduling_lent}
                            onChange={(e) => setEditForm({ ...editForm, allow_scheduling_lent: e.target.checked })}
                            className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-purple-500 focus:ring-purple-500"
                          />
                          <div>
                            <span className="text-sm text-gray-300">Permite agendamento na Quaresma?</span>
                            <p className="text-xs text-gray-500">Habilita agendamentos durante o período quaresmal</p>
                          </div>
                        </label>
                      </div>
                      <div className="p-3 bg-gray-700/50 rounded-lg">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editForm.allow_scheduling_jubilee}
                            onChange={(e) => setEditForm({ ...editForm, allow_scheduling_jubilee: e.target.checked })}
                            className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-purple-500 focus:ring-purple-500"
                          />
                          <div>
                            <span className="text-sm text-gray-300">Permite agendamento em Jubileu?</span>
                            <p className="text-xs text-gray-500">Habilita agendamentos durante anos jubilares</p>
                          </div>
                        </label>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Limite de Eventos Simultâneos</label>
                      <p className="text-xs text-gray-500 mb-2">Máximo de eventos que podem ocorrer no mesmo horário</p>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={editForm.max_simultaneous_events}
                        onChange={(e) => setEditForm({ ...editForm, max_simultaneous_events: parseInt(e.target.value) || 1 })}
                        className="w-32 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider">Datas Bloqueadas</h3>
                    <p className="text-xs text-gray-500">Períodos em que não é permitido realizar agendamentos</p>
                    <div className="space-y-2">
                      {editForm.blocked_dates.map((period, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-gray-700/50 rounded-lg">
                          <input
                            type="date"
                            value={period.start}
                            onChange={(e) => {
                              const newDates = [...editForm.blocked_dates];
                              newDates[index] = { ...newDates[index], start: e.target.value };
                              setEditForm({ ...editForm, blocked_dates: newDates });
                            }}
                            className="bg-gray-600 border border-gray-500 rounded px-2 py-1 text-white text-sm"
                          />
                          <span className="text-gray-400">até</span>
                          <input
                            type="date"
                            value={period.end}
                            onChange={(e) => {
                              const newDates = [...editForm.blocked_dates];
                              newDates[index] = { ...newDates[index], end: e.target.value };
                              setEditForm({ ...editForm, blocked_dates: newDates });
                            }}
                            className="bg-gray-600 border border-gray-500 rounded px-2 py-1 text-white text-sm"
                          />
                          <input
                            type="text"
                            value={period.reason || ''}
                            onChange={(e) => {
                              const newDates = [...editForm.blocked_dates];
                              newDates[index] = { ...newDates[index], reason: e.target.value };
                              setEditForm({ ...editForm, blocked_dates: newDates });
                            }}
                            placeholder="Motivo (opcional)"
                            className="flex-1 bg-gray-600 border border-gray-500 rounded px-2 py-1 text-white text-sm"
                          />
                          <button
                            onClick={() => {
                              const newDates = editForm.blocked_dates.filter((_, i) => i !== index);
                              setEditForm({ ...editForm, blocked_dates: newDates });
                            }}
                            className="p-1 text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          setEditForm({
                            ...editForm,
                            blocked_dates: [...editForm.blocked_dates, { start: '', end: '', reason: '' }]
                          });
                        }}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-purple-400 hover:text-purple-300 border border-dashed border-gray-600 rounded-lg hover:border-purple-500"
                      >
                        <Plus className="h-4 w-4" />
                        Adicionar Período Bloqueado
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Messages */}
              {activeTab === 'messages' && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider">Mensagens Personalizadas</h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Texto de Doação</label>
                      <p className="text-xs text-gray-500 mb-2">Informações sobre como fazer doações para a igreja</p>
                      <textarea
                        value={editForm.donation_text}
                        onChange={(e) => setEditForm({ ...editForm, donation_text: e.target.value })}
                        rows={3}
                        placeholder="Ex: Para contribuir com nossa paróquia, você pode fazer um PIX para: paroquia@email.com ou depositar na conta..."
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 resize-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Texto de Oração (Modelos)</label>
                      <p className="text-xs text-gray-500 mb-2">Modelos de orações que a IA pode compartilhar</p>
                      <textarea
                        value={editForm.prayer_text}
                        onChange={(e) => setEditForm({ ...editForm, prayer_text: e.target.value })}
                        rows={4}
                        placeholder="Ex: Oração pela família: Senhor, abençoai nossa família... | Oração de agradecimento: Obrigado, Senhor, por todas as graças..."
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 resize-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Texto de Confirmação</label>
                      <p className="text-xs text-gray-500 mb-2">Mensagem enviada após agendamento bem-sucedido</p>
                      <textarea
                        value={editForm.confirmation_text}
                        onChange={(e) => setEditForm({ ...editForm, confirmation_text: e.target.value })}
                        rows={3}
                        placeholder="Ex: Seu agendamento foi confirmado com sucesso! Em breve você receberá mais informações por e-mail."
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 resize-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Texto de Indisponibilidade</label>
                      <p className="text-xs text-gray-500 mb-2">Mensagem quando não há horários disponíveis</p>
                      <textarea
                        value={editForm.unavailability_text}
                        onChange={(e) => setEditForm({ ...editForm, unavailability_text: e.target.value })}
                        rows={3}
                        placeholder="Ex: Infelizmente não temos horários disponíveis para a data solicitada. Por favor, escolha outra data."
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 resize-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Texto Pós-Agendamento</label>
                      <p className="text-xs text-gray-500 mb-2">Instruções enviadas após o agendamento ser realizado</p>
                      <textarea
                        value={editForm.post_scheduling_text}
                        onChange={(e) => setEditForm({ ...editForm, post_scheduling_text: e.target.value })}
                        rows={3}
                        placeholder="Ex: Lembre-se de trazer os documentos necessários no dia marcado. Chegue com 15 minutos de antecedência."
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 resize-none text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}


              {/* Tab: Visitação */}
              {activeTab === 'visitacao' && (
                <div className="space-y-6">
                  <div className="p-4 bg-purple-900/20 border border-purple-700/30 rounded-lg">
                    <p className="text-sm text-purple-300">
                      Configure as informações sobre visitação turística e guiada na igreja. A IA usará estas informações para orientar visitantes.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider">Agendamento de Visitação</h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Link para Formulário de Visitação</label>
                      <p className="text-xs text-gray-500 mb-2">Cole o link para sistema de agendamento de visitas (Calendly, Google Forms, etc)</p>
                      <input
                        type="url"
                        value={editForm.link_visitacao}
                        onChange={(e) => setEditForm({ ...editForm, link_visitacao: e.target.value })}
                        placeholder="https://calendly.com/sua-igreja ou https://forms.google.com/..."
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider">Informações de Visitação</h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Guia Turístico e Horários</label>
                      <p className="text-xs text-gray-500 mb-2">Forneça informações sobre visitação turística, horários, tipos de visita e disponibilidade de guias</p>
                      <textarea
                        value={editForm.guia_turistico}
                        onChange={(e) => setEditForm({ ...editForm, guia_turistico: e.target.value })}
                        rows={6}
                        placeholder="Ex: Visitas guiadas de terça a domingo das 9h às 17h. Última entrada às 16h30. Guias disponíveis em português, inglês e espanhol. Visita autoguiada com QR codes informativos. Duração média: 45 minutos. Grupos acima de 15 pessoas devem agendar com antecedência. Entrada gratuita, doações são bem-vindas..."
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 resize-none text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider">Pontos de Interesse</h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Informação Histórica e Pontos Turísticos</label>
                      <p className="text-xs text-gray-500 mb-2">Descreva a história da igreja e principais pontos de interesse para visitantes</p>
                      <textarea
                        value={editForm.informacao_historica}
                        onChange={(e) => setEditForm({ ...editForm, informacao_historica: e.target.value })}
                        rows={6}
                        placeholder="Ex: Fundada em 1850 por imigrantes italianos, nossa igreja foi tombada como patrimônio histórico em 1980. Principais pontos: Vitrais europeus do século XIX, Órgão de tubos alemão de 1920, Capela lateral com imagens sacras históricas, Cripta dos fundadores, Jardim das oliveiras centenárias..."
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 resize-none text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider">Localização</h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Link do Google Maps</label>
                      <p className="text-xs text-gray-500 mb-2">Cole o link do Google Maps para facilitar a localização</p>
                      <input
                        type="url"
                        value={editForm.google_maps_link}
                        onChange={(e) => setEditForm({ ...editForm, google_maps_link: e.target.value })}
                        placeholder="https://maps.google.com/..."
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Localização e Acesso</label>
                      <p className="text-xs text-gray-500 mb-2">Descreva a localização, pontos de referência e como chegar</p>
                      <textarea
                        value={editForm.localizacao_igreja}
                        onChange={(e) => setEditForm({ ...editForm, localizacao_igreja: e.target.value })}
                        rows={4}
                        placeholder="Ex: Rua das Flores, 123 - Centro Histórico. Próximo à Praça da Matriz e ao Museu Municipal. Estacionamento próprio com 50 vagas. Acesso por transporte público: linhas 10, 20 e 30 (ponto em frente). Acessibilidade para cadeirantes..."
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 resize-none text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Qualification */}
              {activeTab === 'qualification' && (
                <div className="space-y-6">
                  <div className="p-4 bg-purple-900/20 border border-purple-700/30 rounded-lg">
                    <p className="text-sm text-purple-300">
                      A qualificação de leads permite que a IA colete informações importantes dos visitantes antes de encaminhá-los para atendimento humano ou agendar serviços.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider mb-2">Campos Obrigatórios</h3>
                    <p className="text-xs text-gray-500 mb-4">Estes campos são sempre coletados pela IA durante a qualificação do lead. Não podem ser desativados.</p>
                    <div className="space-y-2">
                      {['nome', 'telefone', 'email'].map((field) => (
                        <div key={field} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                          <div>
                            <span className="text-sm text-gray-300">{QUALIFICATION_LABELS[field]}</span>
                            <p className="text-xs text-gray-500">
                              {field === 'nome' && 'Nome completo do visitante para identificação'}
                              {field === 'telefone' && 'Número de telefone para contato posterior'}
                              {field === 'email' && 'E-mail para envio de informações e confirmações'}
                            </p>
                          </div>
                          <span className="text-xs text-green-400 flex items-center gap-1">
                            <Check className="h-3 w-3" />
                            Obrigatório
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider mb-2">Campos Adicionais</h3>
                    <p className="text-xs text-gray-500 mb-4">Configure quais informações extras a IA deve coletar para qualificar melhor os leads. Ative ou desative conforme necessário.</p>
                    <div className="space-y-2">
                      {['interesse', 'motivacao', 'expectativa', 'tipo_evento'].map((field) => (
                        <label key={field} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-700">
                          <div>
                            <span className="text-sm text-gray-300">{QUALIFICATION_LABELS[field]}</span>
                            <p className="text-xs text-gray-500">
                              {field === 'interesse' && 'Qual serviço o visitante está interessado (casamento, batizado, etc.)'}
                              {field === 'motivacao' && 'Por que o visitante procurou a igreja (indicação, proximidade, etc.)'}
                              {field === 'expectativa' && 'O que o visitante espera do atendimento ou serviço'}
                              {field === 'tipo_evento' && 'Tipo específico de evento que deseja realizar'}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs ${editForm.qualification_fields[field as keyof typeof editForm.qualification_fields] ? 'text-green-400' : 'text-gray-500'}`}>
                              {editForm.qualification_fields[field as keyof typeof editForm.qualification_fields] ? 'Ativo' : 'Desativado'}
                            </span>
                            <input
                              type="checkbox"
                              checked={editForm.qualification_fields[field as keyof typeof editForm.qualification_fields]}
                              onChange={(e) => setEditForm({
                                ...editForm,
                                qualification_fields: {
                                  ...editForm.qualification_fields,
                                  [field]: e.target.checked,
                                },
                              })}
                              className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-purple-500 focus:ring-purple-500"
                            />
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Hours */}
              {activeTab === 'hours' && (
                <div className="space-y-6">
                  <div className="p-4 bg-purple-900/20 border border-purple-700/30 rounded-lg">
                    <p className="text-sm text-purple-300">
                      Configure os horários de funcionamento do atendimento via IA. Fora desses horários, a IA enviará a mensagem configurada abaixo.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider mb-2">Horários de Funcionamento</h3>
                    <p className="text-xs text-gray-500 mb-4">Marque os dias e defina os horários de início e fim do atendimento. A IA só responderá automaticamente dentro desses horários.</p>
                    <div className="space-y-3">
                      {(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const).map((day) => (
                        <div key={day} className="flex items-center gap-4 p-3 bg-gray-700/50 rounded-lg">
                          <label className="flex items-center gap-2 w-24">
                            <input
                              type="checkbox"
                              checked={editForm.business_hours[day].enabled}
                              onChange={(e) => setEditForm({
                                ...editForm,
                                business_hours: {
                                  ...editForm.business_hours,
                                  [day]: { ...editForm.business_hours[day], enabled: e.target.checked },
                                },
                              })}
                              className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-purple-500 focus:ring-purple-500"
                            />
                            <span className="text-sm text-gray-300">{DAY_LABELS[day]}</span>
                          </label>
                          <div className="flex items-center gap-2 flex-1">
                            <input
                              type="time"
                              value={editForm.business_hours[day].startTime}
                              onChange={(e) => setEditForm({
                                ...editForm,
                                business_hours: {
                                  ...editForm.business_hours,
                                  [day]: { ...editForm.business_hours[day], startTime: e.target.value },
                                },
                              })}
                              disabled={!editForm.business_hours[day].enabled}
                              className="bg-gray-600 border border-gray-500 rounded px-2 py-1 text-sm text-white disabled:opacity-50"
                            />
                            <span className="text-gray-500">às</span>
                            <input
                              type="time"
                              value={editForm.business_hours[day].endTime}
                              onChange={(e) => setEditForm({
                                ...editForm,
                                business_hours: {
                                  ...editForm.business_hours,
                                  [day]: { ...editForm.business_hours[day], endTime: e.target.value },
                                },
                              })}
                              disabled={!editForm.business_hours[day].enabled}
                              className="bg-gray-600 border border-gray-500 rounded px-2 py-1 text-sm text-white disabled:opacity-50"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider mb-2">Mensagem Fora do Horário</h3>
                    <p className="text-xs text-gray-500 mb-4">Mensagem automática enviada quando alguém entrar em contato fora do horário de funcionamento configurado acima.</p>
                    <textarea
                      value={editForm.outside_hours_message}
                      onChange={(e) => setEditForm({ ...editForm, outside_hours_message: e.target.value })}
                      rows={4}
                      placeholder="Ex: Olá! Obrigado por entrar em contato com a Paróquia São José. Nosso horário de atendimento é de segunda a sexta, das 9h às 18h. Deixe sua mensagem que retornaremos assim que possível. Deus abençoe!"
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 resize-none"
                    />
                    <p className="text-xs text-gray-500 mt-2">Dica: Inclua os horários de atendimento e uma mensagem acolhedora para que o visitante saiba quando será respondido.</p>
                  </div>
                </div>
              )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-700 shrink-0">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-semibold text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {isSaving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
