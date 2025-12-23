import { useEffect, useState } from 'react';
import { 
  Settings, Search, Plus, Pencil, Trash2, X, Check,
  Heart, Droplets, ChurchIcon, Camera, Map, Sunrise, Users, BookOpen, GripVertical,
  FileText, DollarSign, Calendar, Bot, Image, MapPin, Car, CircleHelp, CircleAlert,
  Medal, HandHeart, Infinity
} from 'lucide-react';
import { ImageUploader } from '../../components/ui/ImageUploader';
import { churchServicesService } from '../../services/supabase/churchServices';
import { adminService } from '../../services/supabase/admin';
import type { ChurchService, ServiceEtapa, ServiceDocumento, Church as ChurchType } from '../../types/database';
import { useSearchParams } from 'react-router-dom';
import "react";

const makeEmojiIcon = (emoji: string) => (props: any) => (
  <span className={props.className || ''} aria-label="emoji" role="img">
    {emoji}
  </span>
);

const ICON_MAP: Record<string, any> = {
  heart: Heart,
  droplets: Droplets,
  church: ChurchIcon,
  camera: Camera,
  map: Map,
  sunrise: Sunrise,
  users: Users,
  'book-open': BookOpen,
  'map-pin': MapPin,
  car: Car,
  calendar: Calendar,
  'circle-help': CircleHelp,
  'circle-alert': CircleAlert,
  medal: Medal,
  'hand-heart': HandHeart,
  infinity: Infinity,
  sos: makeEmojiIcon('🆘'),
  handshake: makeEmojiIcon('🤝'),
  speak: makeEmojiIcon('🗣️'),
  bed: makeEmojiIcon('🛏️'),
  'hand-raised': makeEmojiIcon('🙋🏻‍♀️'),
  party: makeEmojiIcon('🥳'),
};

const TIPO_LABELS: Record<string, string> = {
  sacramento: 'Sacramento',
  cerimonia: 'Cerimônia',
  evento: 'Evento',
  servico: 'Serviço',
  outro: 'Outro',
};

const DIAS_SEMANA = [
  { value: 'monday', label: 'Segunda' },
  { value: 'tuesday', label: 'Terça' },
  { value: 'wednesday', label: 'Quarta' },
  { value: 'thursday', label: 'Quinta' },
  { value: 'friday', label: 'Sexta' },
  { value: 'saturday', label: 'Sábado' },
  { value: 'sunday', label: 'Domingo' },
];

export function AdminServicos() {
  const [searchParams] = useSearchParams();
  const churchIdParam = searchParams.get('church');

  const [services, setServices] = useState<ChurchService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [churchId, setChurchId] = useState<string | null>(null);
  const [churches, setChurches] = useState<ChurchType[]>([]);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<ChurchService | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'geral' | 'disponibilidade' | 'documentos' | 'valores' | 'automacao' | 'imagens'>('geral');

  // Form state
  const [form, setForm] = useState({
    nome: '',
    slug: '',
    tipo: 'servico' as ChurchService['tipo'],
    ativo: true,
    descricao_curta: '',
    descricao_completa: '',
    icone: 'church',
    etapas: [] as ServiceEtapa[],
    dias_permitidos: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    horarios_permitidos: [] as { inicio: string; fim: string }[],
    documentos_exigidos: [] as ServiceDocumento[],
    valor: undefined as number | undefined,
    valor_variavel: false,
    valor_minimo: undefined as number | undefined,
    valor_maximo: undefined as number | undefined,
    forma_pagamento: ['pix', 'dinheiro', 'transferencia'],
    exige_sinal: false,
    valor_sinal: undefined as number | undefined,
    percentual_sinal: undefined as number | undefined,
    prazo_pagamento_sinal: undefined as number | undefined,
    regras: '',
    restricoes: '',
    prazo_minimo_agendamento: 30,
    prazo_maximo_agendamento: 365,
    duracao_media_minutos: undefined as number | undefined,
    capacidade_maxima: undefined as number | undefined,
    usa_agendamento: false,
    usa_tool_verificar_agendamento: false,
    usa_tool_realizar_agendamento: false,
    precisa_confirmacao_humana: true,
    mensagem_confirmacao: '',
    mensagem_indisponibilidade: '',
    mensagem_pos_agendamento: '',
    imagens: [] as { url: string; descricao: string }[],
  });

  useEffect(() => {
    loadChurchesAndServices();
  }, [churchIdParam]);

  async function loadChurchesAndServices() {
    setIsLoading(true);
    try {
      // Carregar lista de igrejas
      const churchesData = await adminService.listChurches();
      setChurches(churchesData);

      let cId = churchIdParam;
      
      if (!cId && churchesData.length > 0) {
        // Se não tiver parâmetro, usa a primeira igreja
        cId = churchesData[0].id;
      }

      if (cId) {
        setChurchId(cId);
        const data = await churchServicesService.listByChurch(cId);
        setServices(data);
      }
    } catch (error) {
      console.error('Erro ao carregar serviços:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function openNewService() {
    setSelectedService(null);
    setActiveTab('geral');
    setForm({
      nome: '',
      slug: '',
      tipo: 'servico',
      ativo: true,
      descricao_curta: '',
      descricao_completa: '',
      icone: 'church',
      etapas: [],
      dias_permitidos: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      horarios_permitidos: [],
      documentos_exigidos: [],
      valor: undefined,
      valor_variavel: false,
      valor_minimo: undefined,
      valor_maximo: undefined,
      forma_pagamento: ['pix', 'dinheiro', 'transferencia'],
      exige_sinal: false,
      valor_sinal: undefined,
      percentual_sinal: undefined,
      prazo_pagamento_sinal: undefined,
      regras: '',
      restricoes: '',
      prazo_minimo_agendamento: 30,
      prazo_maximo_agendamento: 365,
      duracao_media_minutos: undefined,
      capacidade_maxima: undefined,
      usa_agendamento: false,
      usa_tool_verificar_agendamento: false,
      usa_tool_realizar_agendamento: false,
      precisa_confirmacao_humana: true,
      mensagem_confirmacao: '',
      mensagem_indisponibilidade: '',
      mensagem_pos_agendamento: '',
      imagens: [],
    });
    setIsModalOpen(true);
  }

  function openEditService(service: ChurchService) {
    setSelectedService(service);
    setActiveTab('geral');
    setForm({
      nome: service.nome,
      slug: service.slug,
      tipo: service.tipo,
      ativo: service.ativo,
      descricao_curta: service.descricao_curta || '',
      descricao_completa: service.descricao_completa || '',
      icone: service.icone || 'church',
      etapas: service.etapas || [],
      dias_permitidos: service.dias_permitidos || [],
      horarios_permitidos: service.horarios_permitidos || [],
      documentos_exigidos: service.documentos_exigidos || [],
      valor: service.valor,
      valor_variavel: service.valor_variavel,
      valor_minimo: service.valor_minimo,
      valor_maximo: service.valor_maximo,
      forma_pagamento: service.forma_pagamento || [],
      exige_sinal: service.exige_sinal,
      valor_sinal: service.valor_sinal,
      percentual_sinal: service.percentual_sinal,
      prazo_pagamento_sinal: service.prazo_pagamento_sinal,
      regras: service.regras || '',
      restricoes: service.restricoes || '',
      prazo_minimo_agendamento: service.prazo_minimo_agendamento,
      prazo_maximo_agendamento: service.prazo_maximo_agendamento,
      duracao_media_minutos: service.duracao_media_minutos,
      capacidade_maxima: service.capacidade_maxima,
      usa_agendamento: service.usa_agendamento,
      usa_tool_verificar_agendamento: service.usa_tool_verificar_agendamento,
      usa_tool_realizar_agendamento: service.usa_tool_realizar_agendamento,
      precisa_confirmacao_humana: service.precisa_confirmacao_humana,
      mensagem_confirmacao: service.mensagem_confirmacao || '',
      mensagem_indisponibilidade: service.mensagem_indisponibilidade || '',
      mensagem_pos_agendamento: service.mensagem_pos_agendamento || '',
      imagens: (service as any).imagens || [],
    });
    setIsModalOpen(true);
  }

  async function handleSave() {
    if (!churchId || !form.nome || !form.slug) return;

    setIsSaving(true);
    try {
      if (selectedService) {
        await churchServicesService.update(selectedService.id, form as any);
      } else {
        await churchServicesService.create({
          church_id: churchId,
          ...form,
        } as any);
      }
      await loadChurchesAndServices();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Erro ao salvar serviço:', error);
      alert('Erro ao salvar serviço');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir este serviço?')) return;

    try {
      await churchServicesService.delete(id);
      await loadChurchesAndServices();
    } catch (error) {
      console.error('Erro ao excluir serviço:', error);
      alert('Erro ao excluir serviço');
    }
  }

  async function handleToggleActive(service: ChurchService) {
    try {
      await churchServicesService.toggleActive(service.id, !service.ativo);
      await loadChurchesAndServices();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
    }
  }

  function generateSlug(nome: string) {
    return nome
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  const filteredServices = services.filter(s =>
    s.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Serviços da Igreja</h1>
          <p className="text-gray-400 text-sm">Gerencie casamentos, batismos, fotos e outros serviços</p>
        </div>
        <button
          onClick={openNewService}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4" />
          Novo Serviço
        </button>
      </div>

      {/* Church Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">Selecione a Igreja</label>
        <select
          value={churchId || ''}
          onChange={(e) => {
            const newChurchId = e.target.value;
            setChurchId(newChurchId);
            if (newChurchId) {
              churchServicesService.listByChurch(newChurchId).then(setServices);
            } else {
              setServices([]);
            }
          }}
          className="w-full md:w-64 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
        >
          <option value="">Selecione uma igreja...</option>
          {churches.map((church) => (
            <option key={church.id} value={church.id}>
              {church.name}
            </option>
          ))}
        </select>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar serviços..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
        />
      </div>

      {/* Services Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="text-center py-12 bg-gray-800 rounded-lg border border-gray-700">
          <ChurchIcon className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">Nenhum serviço cadastrado</p>
          <button
            onClick={openNewService}
            className="mt-4 text-purple-400 hover:text-purple-300"
          >
            Criar primeiro serviço
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredServices.map((service) => {
            const ServiceIcon = ICON_MAP[service.icone || 'church'] || ChurchIcon;
            return (
              <div
                key={service.id}
                className={`bg-gray-800 rounded-lg border ${service.ativo ? 'border-gray-700' : 'border-gray-700/50 opacity-60'} p-4 hover:border-purple-500/50 transition-colors`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${service.ativo ? 'bg-purple-500/20' : 'bg-gray-700'}`}>
                      <ServiceIcon className={`h-5 w-5 ${service.ativo ? 'text-purple-400' : 'text-gray-500'}`} />
                    </div>
                    <div>
                      <h3 className="font-medium text-white">{service.nome}</h3>
                      <span className="text-xs text-gray-500">{TIPO_LABELS[service.tipo]}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggleActive(service)}
                      className={`p-1.5 rounded ${service.ativo ? 'text-green-400 hover:bg-green-500/20' : 'text-gray-500 hover:bg-gray-700'}`}
                      title={service.ativo ? 'Desativar' : 'Ativar'}
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => openEditService(service)}
                      className="p-1.5 rounded text-gray-400 hover:text-purple-400 hover:bg-purple-500/20"
                      title="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(service.id)}
                      className="p-1.5 rounded text-gray-400 hover:text-red-400 hover:bg-red-500/20"
                      title="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {service.descricao_curta && (
                  <p className="text-sm text-gray-400 mb-3 line-clamp-2">{service.descricao_curta}</p>
                )}

                <div className="flex flex-wrap gap-2 text-xs">
                  {service.valor && (
                    <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded">
                      R$ {service.valor.toFixed(2)}
                    </span>
                  )}
                  {service.duracao_media_minutos && (
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded">
                      {service.duracao_media_minutos} min
                    </span>
                  )}
                  {service.usa_agendamento && (
                    <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded">
                      Agendamento IA
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-gray-800 rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden m-4 border border-gray-700 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h2 className="text-lg font-bold text-white">
                {selectedService ? 'Editar Serviço' : 'Novo Serviço'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-700 text-gray-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-700 overflow-x-auto">
              {[
                { id: 'geral', label: 'Geral', icon: Settings },
                { id: 'disponibilidade', label: 'Disponibilidade', icon: Calendar },
                { id: 'documentos', label: 'Documentos', icon: FileText },
                { id: 'valores', label: 'Valores', icon: DollarSign },
                { id: 'automacao', label: 'Automação IA', icon: Bot },
                { id: 'imagens', label: 'Imagens', icon: Image },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-400'
                      : 'border-transparent text-gray-400 hover:text-white'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {/* Tab: Geral */}
              {activeTab === 'geral' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Nome do Serviço *</label>
                      <input
                        type="text"
                        value={form.nome}
                        onChange={(e) => {
                          setForm({ 
                            ...form, 
                            nome: e.target.value,
                            slug: selectedService ? form.slug : generateSlug(e.target.value)
                          });
                        }}
                        placeholder="Ex: Casamento, Batismo..."
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Slug (URL) *</label>
                      <input
                        type="text"
                        value={form.slug}
                        onChange={(e) => setForm({ ...form, slug: e.target.value })}
                        placeholder="casamento"
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Tipo</label>
                      <select
                        value={form.tipo}
                        onChange={(e) => setForm({ ...form, tipo: e.target.value as any })}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                      >
                        <option value="sacramento">Sacramento</option>
                        <option value="cerimonia">Cerimônia</option>
                        <option value="evento">Evento</option>
                        <option value="servico">Serviço</option>
                        <option value="outro">Outro</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Ícone</label>
                      <select
                        value={form.icone}
                        onChange={(e) => setForm({ ...form, icone: e.target.value })}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                      >
                        <option value="heart">❤️ Coração (Casamento)</option>
                        <option value="droplets">💧 Gotas (Batismo)</option>
                        <option value="church">⛪ Igreja</option>
                        <option value="camera">📷 Câmera (Fotos)</option>
                        <option value="map">🗺️ Mapa (Visitação)</option>
                        <option value="sunrise">🌅 Nascer do Sol (Retiro)</option>
                        <option value="users">👥 Pessoas (Curso)</option>
                        <option value="book-open">📖 Livro (Catequese)</option>
                        <option value="map-pin">📌 Pin (Localização)</option>
                        <option value="car">🚗 Carro (Transporte)</option>
                        <option value="calendar">🗓️ Calendário (Agendas)</option>
                        <option value="circle-help">❓ Ajuda (Dúvidas)</option>
                        <option value="circle-alert">⚠️ Alerta (Avisos)</option>
                        <option value="medal">🏅 Medalha (Reconhecimento)</option>
                        <option value="hand-heart">🤝 Mãos (Solidariedade)</option>
                        <option value="infinity">♾️ Infinito (Outros)</option>
                        <option value="sos">🆘 SOS (Emergência)</option>
                        <option value="handshake">🤝 Aperto de Mãos</option>
                        <option value="speak">🗣️ Boneco Falando</option>
                        <option value="bed">🛏️ Cama</option>
                        <option value="hand-raised">🙋🏻‍♀️ Mão Levantada</option>
                        <option value="party">🥳 Festa</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Descrição Curta</label>
                    <input
                      type="text"
                      value={form.descricao_curta}
                      onChange={(e) => setForm({ ...form, descricao_curta: e.target.value })}
                      placeholder="Breve descrição para listagens"
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Descrição Completa</label>
                    <textarea
                      value={form.descricao_completa}
                      onChange={(e) => setForm({ ...form, descricao_completa: e.target.value })}
                      rows={4}
                      placeholder="Descrição detalhada do serviço..."
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Duração Média (minutos)</label>
                      <input
                        type="number"
                        value={form.duracao_media_minutos || ''}
                        onChange={(e) => setForm({ ...form, duracao_media_minutos: e.target.value ? parseInt(e.target.value) : undefined })}
                        placeholder="60"
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Capacidade Máxima</label>
                      <input
                        type="number"
                        value={form.capacidade_maxima || ''}
                        onChange={(e) => setForm({ ...form, capacidade_maxima: e.target.value ? parseInt(e.target.value) : undefined })}
                        placeholder="100"
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Regras Específicas</label>
                    <textarea
                      value={form.regras}
                      onChange={(e) => setForm({ ...form, regras: e.target.value })}
                      rows={3}
                      placeholder="Regras e requisitos do serviço..."
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Restrições</label>
                    <textarea
                      value={form.restricoes}
                      onChange={(e) => setForm({ ...form, restricoes: e.target.value })}
                      rows={2}
                      placeholder="Ex: Não realizamos durante a Quaresma..."
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 resize-none"
                    />
                  </div>

                  <div className="p-3 bg-gray-700/50 rounded-lg">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.ativo}
                        onChange={(e) => setForm({ ...form, ativo: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-purple-500 focus:ring-purple-500"
                      />
                      <div>
                        <span className="text-sm text-gray-300">Serviço Ativo</span>
                        <p className="text-xs text-gray-500">Serviços inativos não aparecem para a IA</p>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* Tab: Disponibilidade */}
              {activeTab === 'disponibilidade' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider mb-3">Dias Permitidos</h3>
                    <div className="grid grid-cols-4 gap-2">
                      {DIAS_SEMANA.map((dia) => (
                        <label key={dia.value} className="flex items-center gap-2 p-2 bg-gray-700/50 rounded-lg cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.dias_permitidos.includes(dia.value)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setForm({ ...form, dias_permitidos: [...form.dias_permitidos, dia.value] });
                              } else {
                                setForm({ ...form, dias_permitidos: form.dias_permitidos.filter(d => d !== dia.value) });
                              }
                            }}
                            className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-purple-500"
                          />
                          <span className="text-sm text-gray-300">{dia.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider mb-3">Prazos de Agendamento</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Antecedência Mínima (dias)</label>
                        <input
                          type="number"
                          value={form.prazo_minimo_agendamento}
                          onChange={(e) => setForm({ ...form, prazo_minimo_agendamento: parseInt(e.target.value) || 0 })}
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Antecedência Máxima (dias)</label>
                        <input
                          type="number"
                          value={form.prazo_maximo_agendamento}
                          onChange={(e) => setForm({ ...form, prazo_maximo_agendamento: parseInt(e.target.value) || 365 })}
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider mb-3">Etapas do Processo</h3>
                    <div className="space-y-2">
                      {form.etapas.map((etapa, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-gray-700/50 rounded-lg">
                          <GripVertical className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-400 w-6">{index + 1}.</span>
                          <input
                            type="text"
                            value={etapa.titulo}
                            onChange={(e) => {
                              const newEtapas = [...form.etapas];
                              newEtapas[index] = { ...newEtapas[index], titulo: e.target.value };
                              setForm({ ...form, etapas: newEtapas });
                            }}
                            placeholder="Título da etapa"
                            className="flex-1 bg-gray-600 border border-gray-500 rounded px-2 py-1 text-white text-sm"
                          />
                          <button
                            onClick={() => {
                              setForm({ ...form, etapas: form.etapas.filter((_, i) => i !== index) });
                            }}
                            className="p-1 text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          setForm({
                            ...form,
                            etapas: [...form.etapas, { ordem: form.etapas.length + 1, titulo: '' }]
                          });
                        }}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-purple-400 hover:text-purple-300 border border-dashed border-gray-600 rounded-lg hover:border-purple-500 w-full justify-center"
                      >
                        <Plus className="h-4 w-4" />
                        Adicionar Etapa
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Documentos */}
              {activeTab === 'documentos' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider">Documentos Exigidos</h3>
                  <div className="space-y-2">
                    {form.documentos_exigidos.map((doc, index) => (
                      <div key={index} className="flex items-center gap-2 p-3 bg-gray-700/50 rounded-lg">
                        <input
                          type="text"
                          value={doc.nome}
                          onChange={(e) => {
                            const newDocs = [...form.documentos_exigidos];
                            newDocs[index] = { ...newDocs[index], nome: e.target.value };
                            setForm({ ...form, documentos_exigidos: newDocs });
                          }}
                          placeholder="Nome do documento"
                          className="flex-1 bg-gray-600 border border-gray-500 rounded px-2 py-1 text-white text-sm"
                        />
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={doc.obrigatorio}
                            onChange={(e) => {
                              const newDocs = [...form.documentos_exigidos];
                              newDocs[index] = { ...newDocs[index], obrigatorio: e.target.checked };
                              setForm({ ...form, documentos_exigidos: newDocs });
                            }}
                            className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-purple-500"
                          />
                          <span className="text-xs text-gray-400">Obrigatório</span>
                        </label>
                        <button
                          onClick={() => {
                            setForm({ ...form, documentos_exigidos: form.documentos_exigidos.filter((_, i) => i !== index) });
                          }}
                          className="p-1 text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        setForm({
                          ...form,
                          documentos_exigidos: [...form.documentos_exigidos, { nome: '', obrigatorio: true }]
                        });
                      }}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-purple-400 hover:text-purple-300 border border-dashed border-gray-600 rounded-lg hover:border-purple-500 w-full justify-center"
                    >
                      <Plus className="h-4 w-4" />
                      Adicionar Documento
                    </button>
                  </div>
                </div>
              )}

              {/* Tab: Valores */}
              {activeTab === 'valores' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider mb-3">Valor do Serviço</h3>
                    <div className="p-3 bg-gray-700/50 rounded-lg mb-4">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.valor_variavel}
                          onChange={(e) => setForm({ ...form, valor_variavel: e.target.checked })}
                          className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-purple-500"
                        />
                        <div>
                          <span className="text-sm text-gray-300">Valor Variável</span>
                          <p className="text-xs text-gray-500">O valor pode variar conforme o caso</p>
                        </div>
                      </label>
                    </div>

                    {form.valor_variavel ? (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">Valor Mínimo (R$)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={form.valor_minimo || ''}
                            onChange={(e) => setForm({ ...form, valor_minimo: e.target.value ? parseFloat(e.target.value) : undefined })}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">Valor Máximo (R$)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={form.valor_maximo || ''}
                            onChange={(e) => setForm({ ...form, valor_maximo: e.target.value ? parseFloat(e.target.value) : undefined })}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                          />
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Valor (R$)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={form.valor || ''}
                          onChange={(e) => setForm({ ...form, valor: e.target.value ? parseFloat(e.target.value) : undefined })}
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider mb-3">Sinal / Entrada</h3>
                    <div className="p-3 bg-gray-700/50 rounded-lg mb-4">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.exige_sinal}
                          onChange={(e) => setForm({ ...form, exige_sinal: e.target.checked })}
                          className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-purple-500"
                        />
                        <div>
                          <span className="text-sm text-gray-300">Exige Sinal</span>
                          <p className="text-xs text-gray-500">Requer pagamento antecipado para confirmar</p>
                        </div>
                      </label>
                    </div>

                    {form.exige_sinal && (
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">Valor do Sinal (R$)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={form.valor_sinal || ''}
                            onChange={(e) => setForm({ ...form, valor_sinal: e.target.value ? parseFloat(e.target.value) : undefined })}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">Ou Percentual (%)</label>
                          <input
                            type="number"
                            value={form.percentual_sinal || ''}
                            onChange={(e) => setForm({ ...form, percentual_sinal: e.target.value ? parseInt(e.target.value) : undefined })}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">Prazo (dias antes)</label>
                          <input
                            type="number"
                            value={form.prazo_pagamento_sinal || ''}
                            onChange={(e) => setForm({ ...form, prazo_pagamento_sinal: e.target.value ? parseInt(e.target.value) : undefined })}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider mb-3">Formas de Pagamento</h3>
                    <div className="flex flex-wrap gap-2">
                      {['pix', 'dinheiro', 'transferencia', 'cartao', 'boleto'].map((forma) => (
                        <label key={forma} className="flex items-center gap-2 px-3 py-2 bg-gray-700/50 rounded-lg cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.forma_pagamento.includes(forma)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setForm({ ...form, forma_pagamento: [...form.forma_pagamento, forma] });
                              } else {
                                setForm({ ...form, forma_pagamento: form.forma_pagamento.filter(f => f !== forma) });
                              }
                            }}
                            className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-purple-500"
                          />
                          <span className="text-sm text-gray-300 capitalize">{forma}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Automação IA */}
              {activeTab === 'automacao' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider mb-3">Configurações de Automação</h3>
                    <div className="space-y-3">
                      <div className="p-3 bg-gray-700/50 rounded-lg">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.usa_agendamento}
                            onChange={(e) => setForm({ ...form, usa_agendamento: e.target.checked })}
                            className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-purple-500"
                          />
                          <div>
                            <span className="text-sm text-gray-300">Usa Agendamento</span>
                            <p className="text-xs text-gray-500">Este serviço pode ser agendado</p>
                          </div>
                        </label>
                      </div>

                      <div className="p-3 bg-gray-700/50 rounded-lg">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.usa_tool_verificar_agendamento}
                            onChange={(e) => setForm({ ...form, usa_tool_verificar_agendamento: e.target.checked })}
                            className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-purple-500"
                          />
                          <div>
                            <span className="text-sm text-gray-300">IA pode Verificar Disponibilidade</span>
                            <p className="text-xs text-gray-500">A IA pode usar a tool verificarAgendamento</p>
                          </div>
                        </label>
                      </div>

                      <div className="p-3 bg-gray-700/50 rounded-lg">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.usa_tool_realizar_agendamento}
                            onChange={(e) => setForm({ ...form, usa_tool_realizar_agendamento: e.target.checked })}
                            className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-purple-500"
                          />
                          <div>
                            <span className="text-sm text-gray-300">IA pode Realizar Agendamento</span>
                            <p className="text-xs text-gray-500">A IA pode usar a tool realizarAgendamento</p>
                          </div>
                        </label>
                      </div>

                      <div className="p-3 bg-gray-700/50 rounded-lg">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.precisa_confirmacao_humana}
                            onChange={(e) => setForm({ ...form, precisa_confirmacao_humana: e.target.checked })}
                            className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-purple-500"
                          />
                          <div>
                            <span className="text-sm text-gray-300">Precisa Confirmação Humana</span>
                            <p className="text-xs text-gray-500">Agendamentos precisam ser aprovados manualmente</p>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider mb-3">Mensagens da IA</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Mensagem de Confirmação</label>
                        <textarea
                          value={form.mensagem_confirmacao}
                          onChange={(e) => setForm({ ...form, mensagem_confirmacao: e.target.value })}
                          rows={2}
                          placeholder="Mensagem enviada quando o agendamento é confirmado..."
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 resize-none text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Mensagem de Indisponibilidade</label>
                        <textarea
                          value={form.mensagem_indisponibilidade}
                          onChange={(e) => setForm({ ...form, mensagem_indisponibilidade: e.target.value })}
                          rows={2}
                          placeholder="Mensagem quando não há horários disponíveis..."
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 resize-none text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Mensagem Pós-Agendamento</label>
                        <textarea
                          value={form.mensagem_pos_agendamento}
                          onChange={(e) => setForm({ ...form, mensagem_pos_agendamento: e.target.value })}
                          rows={2}
                          placeholder="Instruções enviadas após o agendamento..."
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 resize-none text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Imagens */}
              {activeTab === 'imagens' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider">Imagens do Serviço</h3>
                  <p className="text-xs text-gray-500 mb-4">Adicione imagens que a IA pode enviar aos clientes (fotos de cerimônias, locais, etc.)</p>
                  
                  {churchId && (
                    <ImageUploader
                      images={form.imagens}
                      onChange={(imgs) => setForm({ ...form, imagens: imgs })}
                      churchId={churchId}
                      category="servicos"
                      maxImages={20}
                      label="Fotos do Serviço"
                    />
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-700">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || !form.nome || !form.slug}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                {isSaving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
