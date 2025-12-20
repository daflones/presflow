import { useEffect, useState } from 'react';
import { Bot, Search, Pencil, X, Check, Church, Clock, FileText, Settings } from 'lucide-react';
import { adminService } from '../../services/supabase/admin';
import type { AIConfig, Church as ChurchType } from '../../types/database';
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
  nome_igreja: true,
  segmento: true,
  volume_mensal: true,
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
  interesse: 'Produto de Interesse',
  motivacao: 'Motivação',
  expectativa: 'Expectativa',
  tipo_evento: 'Tipo de Evento',
  nome_igreja: 'Nome da Igreja',
  segmento: 'Segmento',
  volume_mensal: 'Volume Mensal',
};

export function AdminConfigIA() {
  const [searchParams] = useSearchParams();
  const churchIdParam = searchParams.get('church');
  
  const [configs, setConfigs] = useState<(AIConfig & { church?: ChurchType })[]>([]);
  const [churches, setChurches] = useState<ChurchType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterChurch, setFilterChurch] = useState(churchIdParam || '');
  
  // Edit modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<AIConfig | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'qualification' | 'hours'>('general');
  
  const [editForm, setEditForm] = useState({
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
    qualification_fields: DEFAULT_QUALIFICATION_FIELDS,
    business_hours: DEFAULT_BUSINESS_HOURS,
  });

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
    setActiveTab('general');
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
      qualification_fields: config.qualification_fields || DEFAULT_QUALIFICATION_FIELDS,
      business_hours: config.business_hours || DEFAULT_BUSINESS_HOURS,
    });
    setIsEditModalOpen(true);
  }

  async function handleSave() {
    if (!selectedConfig) return;
    
    setIsSaving(true);
    try {
      await adminService.updateAIConfig(selectedConfig.id, editForm);
      setIsEditModalOpen(false);
      loadData();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar configuração');
    } finally {
      setIsSaving(false);
    }
  }

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
      {isEditModalOpen && selectedConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-gray-800 rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden m-4 border border-gray-700 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h2 className="text-lg font-bold text-white">Editar Configuração de IA</h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-700 text-gray-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-700">
              <button
                onClick={() => setActiveTab('general')}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'general'
                    ? 'border-purple-500 text-purple-400'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <Settings className="h-4 w-4" />
                Geral
              </button>
              <button
                onClick={() => setActiveTab('qualification')}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'qualification'
                    ? 'border-purple-500 text-purple-400'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <FileText className="h-4 w-4" />
                Qualificação
              </button>
              <button
                onClick={() => setActiveTab('hours')}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'hours'
                    ? 'border-purple-500 text-purple-400'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <Clock className="h-4 w-4" />
                Horários
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {/* Tab: General */}
              {activeTab === 'general' && (
                <div className="space-y-6">
                  {/* Agent Info */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider">Informações do Agente</h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Nome do Agente</label>
                      <input
                        type="text"
                        value={editForm.agent_name}
                        onChange={(e) => setEditForm({ ...editForm, agent_name: e.target.value })}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Informações Adicionais para IA</label>
                      <textarea
                        value={editForm.informacoes_adicionais}
                        onChange={(e) => setEditForm({ ...editForm, informacoes_adicionais: e.target.value })}
                        rows={4}
                        placeholder="Informações extras que a IA deve saber sobre a igreja..."
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 resize-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Perguntas Frequentes</label>
                      <textarea
                        value={editForm.perguntas_frequentes}
                        onChange={(e) => setEditForm({ ...editForm, perguntas_frequentes: e.target.value })}
                        rows={4}
                        placeholder="Liste as perguntas mais comuns e suas respostas..."
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 resize-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Principais Eventos</label>
                      <textarea
                        value={editForm.principais_eventos}
                        onChange={(e) => setEditForm({ ...editForm, principais_eventos: e.target.value })}
                        rows={4}
                        placeholder="Descreva os principais eventos da igreja (missas, cultos, retiros, etc.)..."
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 resize-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Documentação Necessária</label>
                      <textarea
                        value={editForm.documentacao_necessaria}
                        onChange={(e) => setEditForm({ ...editForm, documentacao_necessaria: e.target.value })}
                        rows={4}
                        placeholder="Liste os documentos necessários para cada tipo de serviço..."
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 resize-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Menu Principal</label>
                      <textarea
                        value={editForm.menu_principal}
                        onChange={(e) => setEditForm({ ...editForm, menu_principal: e.target.value })}
                        rows={4}
                        placeholder="Digite o conteúdo do menu que será exibido para o cliente..."
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 resize-none text-sm"
                      />
                      <p className="text-xs text-gray-500 mt-1">Se preenchido, a IA exibirá este menu de opções para o cliente.</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Localização da Igreja (Capelas e Santuários)</label>
                      <textarea
                        value={editForm.localizacao_igreja}
                        onChange={(e) => setEditForm({ ...editForm, localizacao_igreja: e.target.value })}
                        rows={4}
                        placeholder="Descreva a localização, capelas, santuários e pontos de referência..."
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 resize-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Informação Histórica</label>
                      <textarea
                        value={editForm.informacao_historica}
                        onChange={(e) => setEditForm({ ...editForm, informacao_historica: e.target.value })}
                        rows={4}
                        placeholder="Conte a história da igreja, fundação, eventos importantes..."
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
                        <select
                          value={editForm.tone_of_voice}
                          onChange={(e) => setEditForm({ ...editForm, tone_of_voice: e.target.value as any })}
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                        >
                          <option value="amigavel">Amigável</option>
                          <option value="formal">Formal</option>
                          <option value="profissional">Profissional</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Tamanho do Texto</label>
                        <select
                          value={editForm.text_size}
                          onChange={(e) => setEditForm({ ...editForm, text_size: e.target.value as any })}
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                        >
                          <option value="curto">Curto</option>
                          <option value="medio">Médio</option>
                          <option value="longo">Longo</option>
                        </select>
                      </div>
                    </div>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editForm.use_emojis}
                        onChange={(e) => setEditForm({ ...editForm, use_emojis: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-purple-500 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-300">Usar Emojis nas respostas</span>
                    </label>
                  </div>

                  {/* Scheduling & Documents */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider">Agendamento e Documentos</h3>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editForm.send_documents}
                        onChange={(e) => setEditForm({ ...editForm, send_documents: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-purple-500 focus:ring-purple-500"
                      />
                      <div>
                        <span className="text-sm text-gray-300">IA envia documentos?</span>
                        <p className="text-xs text-gray-500">Quando ativado, a IA pode enviar arquivos e imagens aos clientes.</p>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editForm.auto_scheduling}
                        onChange={(e) => setEditForm({ ...editForm, auto_scheduling: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-purple-500 focus:ring-purple-500"
                      />
                      <div>
                        <span className="text-sm text-gray-300">Agendamento com IA?</span>
                        <p className="text-xs text-gray-500">Permite que a IA realize agendamentos automaticamente.</p>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* Tab: Qualification */}
              {activeTab === 'qualification' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider mb-2">Campos Obrigatórios</h3>
                    <p className="text-xs text-gray-500 mb-4">Estes campos são sempre obrigatórios na qualificação do lead.</p>
                    <div className="space-y-2">
                      {['nome', 'telefone', 'email'].map((field) => (
                        <div key={field} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                          <span className="text-sm text-gray-300">{QUALIFICATION_LABELS[field]}</span>
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
                    <p className="text-xs text-gray-500 mb-4">Configure quais informações a IA deve coletar para qualificar os leads.</p>
                    <div className="space-y-2">
                      {['interesse', 'motivacao', 'expectativa', 'tipo_evento', 'nome_igreja', 'segmento', 'volume_mensal'].map((field) => (
                        <label key={field} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-700">
                          <span className="text-sm text-gray-300">{QUALIFICATION_LABELS[field]}</span>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs ${editForm.qualification_fields[field as keyof typeof editForm.qualification_fields] ? 'text-green-400' : 'text-gray-500'}`}>
                              {editForm.qualification_fields[field as keyof typeof editForm.qualification_fields] ? 'Obrigatório' : 'Desativado'}
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
                  <div>
                    <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider mb-2">Horários de Funcionamento</h3>
                    <p className="text-xs text-gray-500 mb-4">Configure os horários em que a IA estará ativa para atendimento.</p>
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
                    <p className="text-xs text-gray-500 mb-4">Mensagem exibida quando o atendimento estiver indisponível fora do horário de funcionamento.</p>
                    <textarea
                      value={editForm.outside_hours_message}
                      onChange={(e) => setEditForm({ ...editForm, outside_hours_message: e.target.value })}
                      rows={3}
                      placeholder="Desculpe, estamos fora do horário de atendimento. Retornaremos em breve!"
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 resize-none"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-700">
              <button
                onClick={() => setIsEditModalOpen(false)}
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
