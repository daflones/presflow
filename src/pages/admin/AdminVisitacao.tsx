import { useState, useEffect } from 'react';
import { 
  FileText, 
  Save, 
  Eye, 
  Copy, 
  Check, 
  Settings, 
  Loader2,
  Plus,
  Trash2,
  GripVertical,
  ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { visitationConfigService } from '../../services/supabase';
import { adminService } from '../../services/supabase/admin';
import type { VisitationFormConfig, VisitationFieldsConfig, CustomField, Church } from '../../types/database';

const defaultFieldsConfig: VisitationFieldsConfig = {
  nome: { ativo: true, obrigatorio: true, label: 'Nome completo' },
  email: { ativo: true, obrigatorio: false, label: 'E-mail' },
  telefone: { ativo: true, obrigatorio: true, label: 'Telefone/WhatsApp' },
  data_nascimento: { ativo: false, obrigatorio: false, label: 'Data de nascimento' },
  endereco: { ativo: false, obrigatorio: false, label: 'Endereço' },
  bairro: { ativo: false, obrigatorio: false, label: 'Bairro' },
  cidade: { ativo: false, obrigatorio: false, label: 'Cidade' },
  estado: { ativo: false, obrigatorio: false, label: 'Estado' },
  cep: { ativo: false, obrigatorio: false, label: 'CEP' },
  como_conheceu: { ativo: true, obrigatorio: false, label: 'Como conheceu nossa igreja?' },
  motivo_visita: { ativo: true, obrigatorio: false, label: 'Motivo da visita' },
  pedido_oracao: { ativo: true, obrigatorio: false, label: 'Pedido de oração' },
  ja_frequenta_igreja: { ativo: false, obrigatorio: false, label: 'Já frequenta alguma igreja?' },
  qual_igreja: { ativo: false, obrigatorio: false, label: 'Qual igreja?' },
  deseja_receber_visita: { ativo: true, obrigatorio: false, label: 'Deseja receber visita?' },
  melhor_horario_contato: { ativo: false, obrigatorio: false, label: 'Melhor horário para contato' },
  observacoes: { ativo: false, obrigatorio: false, label: 'Observações' },
};

export function AdminVisitacao() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [churches, setChurches] = useState<Church[]>([]);
  const [selectedChurchId, setSelectedChurchId] = useState<string | null>(null);
  const [config, setConfig] = useState<Partial<VisitationFormConfig>>({
    titulo: 'Formulário de Visitação',
    descricao: '',
    ativo: true,
    cor_primaria: '#8B5CF6',
    mensagem_boas_vindas: 'Seja bem-vindo! Preencha o formulário abaixo para que possamos conhecê-lo melhor.',
    mensagem_agradecimento: 'Obrigado por preencher o formulário! Em breve entraremos em contato.',
    campos_config: defaultFieldsConfig,
    campos_personalizados: [],
    opcoes_como_conheceu: ['Indicação de amigo/familiar', 'Redes sociais', 'Passou em frente', 'Evento', 'Busca na internet', 'Outro'],
    opcoes_motivo_visita: ['Primeira visita', 'Conhecer a igreja', 'Buscar orientação espiritual', 'Participar de evento', 'Acompanhar familiar/amigo', 'Outro'],
    slug: '',
  });

  useEffect(() => {
    loadChurchesAndConfig();
  }, []);

  async function loadChurchConfig(churchId: string) {
    try {
      const existingConfig = await visitationConfigService.getByChurch(churchId);
      
      if (existingConfig) {
        setConfig(existingConfig);
      } else {
        // Gerar slug baseado no nome da igreja
        const church = churches.find(c => c.id === churchId);
        const slug = generateSlug(church?.name || '');
        setConfig(prev => ({ ...prev, slug }));
      }
    } catch (error) {
      console.error('Erro ao carregar configuração da igreja:', error);
    }
  }

  const loadChurchesAndConfig = async () => {
    try {
      setIsLoading(true);
      
      // Carregar lista de igrejas
      const churchesData = await adminService.listChurches();
      setChurches(churchesData);
      
      // Se não tiver igreja selecionada, usa a primeira
      if (!selectedChurchId && churchesData.length > 0) {
        setSelectedChurchId(churchesData[0].id);
      }
      
      // Carregar configuração da igreja selecionada
      if (selectedChurchId || churchesData.length > 0) {
        const churchId = selectedChurchId || churchesData[0].id;
        await loadChurchConfig(churchId);
      }
    } catch (error) {
      console.error('Erro ao carregar configuração:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleSave = async () => {
    if (!selectedChurchId) return;

    try {
      setIsSaving(true);
      await visitationConfigService.upsert(selectedChurchId, config as VisitationFormConfig);
      await loadChurchesAndConfig();
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFieldToggle = (fieldKey: keyof VisitationFieldsConfig, property: 'ativo' | 'obrigatorio') => {
    setConfig(prev => ({
      ...prev,
      campos_config: {
        ...prev.campos_config!,
        [fieldKey]: {
          ...prev.campos_config![fieldKey],
          [property]: !prev.campos_config![fieldKey][property],
        },
      },
    }));
  };

  const handleFieldLabelChange = (fieldKey: keyof VisitationFieldsConfig, label: string) => {
    setConfig(prev => ({
      ...prev,
      campos_config: {
        ...prev.campos_config!,
        [fieldKey]: {
          ...prev.campos_config![fieldKey],
          label,
        },
      },
    }));
  };

  const addCustomField = () => {
    const newField: CustomField = {
      id: crypto.randomUUID(),
      tipo: 'text',
      label: 'Novo campo',
      obrigatorio: false,
    };
    setConfig(prev => ({
      ...prev,
      campos_personalizados: [...(prev.campos_personalizados || []), newField],
    }));
  };

  const updateCustomField = (id: string, updates: Partial<CustomField>) => {
    setConfig(prev => ({
      ...prev,
      campos_personalizados: prev.campos_personalizados?.map(field =>
        field.id === id ? { ...field, ...updates } : field
      ),
    }));
  };

  const removeCustomField = (id: string) => {
    setConfig(prev => ({
      ...prev,
      campos_personalizados: prev.campos_personalizados?.filter(field => field.id !== id),
    }));
  };

  const copyFormLink = () => {
    const link = `${window.location.origin}/form/${config.slug}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formLink = `${window.location.origin}/form/${config.slug}`;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Formulário de Visitação</h1>
          <p className="text-sm text-gray-400">Configure o formulário de visitação da sua igreja</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => window.open(formLink, '_blank')}>
            <Eye className="w-4 h-4 mr-2" />
            Visualizar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Salvar
          </Button>
        </div>
      </div>

      {/* Church Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Selecione a Igreja</label>
        <select
          value={selectedChurchId || ''}
          onChange={(e) => {
            const newChurchId = e.target.value;
            setSelectedChurchId(newChurchId);
            if (newChurchId) {
              loadChurchConfig(newChurchId);
            } else {
              // Reset config para valores padrão
              setConfig({
                titulo: 'Formulário de Visitação',
                descricao: '',
                ativo: true,
                cor_primaria: '#8B5CF6',
                mensagem_boas_vindas: 'Seja bem-vindo! Preencha o formulário abaixo para que possamos conhecê-lo melhor.',
                mensagem_agradecimento: 'Obrigado por preencher o formulário! Em breve entraremos em contato.',
                campos_config: defaultFieldsConfig,
                campos_personalizados: [],
                opcoes_como_conheceu: ['Indicação de amigo/familiar', 'Redes sociais', 'Passou em frente', 'Evento', 'Busca na internet', 'Outro'],
                opcoes_motivo_visita: ['Primeira visita', 'Conhecer a igreja', 'Buscar orientação espiritual', 'Participar de evento', 'Acompanhar familiar/amigo', 'Outro'],
                slug: '',
              });
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

      {/* Link do Formulário */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label className="text-gray-400 text-xs">Link do Formulário</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  value={formLink}
                  readOnly
                  className="bg-gray-700/30"
                />
                <Button variant="outline" onClick={copyFormLink}>
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
                <Button variant="outline" onClick={() => window.open(formLink, '_blank')}>
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-gray-400">Ativo</Label>
              <button
                onClick={() => setConfig(prev => ({ ...prev, ativo: !prev.ativo }))}
                className={`w-12 h-6 rounded-full transition-colors ${config.ativo ? 'bg-green-500' : 'bg-gray-600'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${config.ativo ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configurações Gerais */}
        <Card>
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Configurações Gerais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Título do Formulário</Label>
              <Input
                value={config.titulo}
                onChange={(e) => setConfig(prev => ({ ...prev, titulo: e.target.value }))}
                placeholder="Formulário de Visitação"
              />
            </div>

            <div>
              <Label>Slug (URL)</Label>
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-sm">/form/</span>
                <Input
                  value={config.slug}
                  onChange={(e) => setConfig(prev => ({ ...prev, slug: generateSlug(e.target.value) }))}
                  placeholder="nome-da-igreja"
                />
              </div>
            </div>

            <div>
              <Label>Cor Principal</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={config.cor_primaria}
                  onChange={(e) => setConfig(prev => ({ ...prev, cor_primaria: e.target.value }))}
                  className="w-10 h-10 rounded-lg cursor-pointer"
                />
                <Input
                  value={config.cor_primaria}
                  onChange={(e) => setConfig(prev => ({ ...prev, cor_primaria: e.target.value }))}
                  className="flex-1"
                />
              </div>
            </div>

            <div>
              <Label>Mensagem de Boas-vindas</Label>
              <textarea
                value={config.mensagem_boas_vindas}
                onChange={(e) => setConfig(prev => ({ ...prev, mensagem_boas_vindas: e.target.value }))}
                rows={3}
                className="w-full px-4 py-2 rounded-xl border border-gray-600 bg-gray-700/50 text-white text-sm resize-none"
              />
            </div>

            <div>
              <Label>Mensagem de Agradecimento</Label>
              <textarea
                value={config.mensagem_agradecimento}
                onChange={(e) => setConfig(prev => ({ ...prev, mensagem_agradecimento: e.target.value }))}
                rows={3}
                className="w-full px-4 py-2 rounded-xl border border-gray-600 bg-gray-700/50 text-white text-sm resize-none"
              />
            </div>
          </CardContent>
        </Card>

        {/* Campos do Formulário */}
        <Card>
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Campos do Formulário
            </CardTitle>
            <CardDescription>Ative/desative os campos que deseja exibir</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[500px] overflow-y-auto">
            {Object.entries(config.campos_config || {}).map(([key, field]) => (
              <div key={key} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-xl">
                <div className="flex-1">
                  <Input
                    value={field.label}
                    onChange={(e) => handleFieldLabelChange(key as keyof VisitationFieldsConfig, e.target.value)}
                    className="bg-transparent border-none p-0 h-auto text-white font-medium"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm text-gray-400">
                    <input
                      type="checkbox"
                      checked={field.ativo}
                      onChange={() => handleFieldToggle(key as keyof VisitationFieldsConfig, 'ativo')}
                      className="w-4 h-4 rounded"
                    />
                    Ativo
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-400">
                    <input
                      type="checkbox"
                      checked={field.obrigatorio}
                      onChange={() => handleFieldToggle(key as keyof VisitationFieldsConfig, 'obrigatorio')}
                      disabled={!field.ativo}
                      className="w-4 h-4 rounded"
                    />
                    Obrigatório
                  </label>
                </div>
              </div>
            ))}

            {/* Campos Personalizados */}
            {config.campos_personalizados?.map((field) => (
              <div key={field.id} className="flex items-center gap-2 p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl">
                <GripVertical className="w-4 h-4 text-gray-500 cursor-move" />
                <Input
                  value={field.label}
                  onChange={(e) => updateCustomField(field.id, { label: e.target.value })}
                  className="flex-1"
                  placeholder="Nome do campo"
                />
                <select
                  value={field.tipo}
                  onChange={(e) => updateCustomField(field.id, { tipo: e.target.value as CustomField['tipo'] })}
                  className="px-3 py-2 rounded-lg border border-gray-600 bg-gray-700/50 text-white text-sm"
                >
                  <option value="text">Texto</option>
                  <option value="textarea">Texto longo</option>
                  <option value="number">Número</option>
                  <option value="date">Data</option>
                  <option value="select">Seleção</option>
                  <option value="checkbox">Checkbox</option>
                </select>
                <label className="flex items-center gap-1 text-sm text-gray-400">
                  <input
                    type="checkbox"
                    checked={field.obrigatorio}
                    onChange={(e) => updateCustomField(field.id, { obrigatorio: e.target.checked })}
                    className="w-4 h-4 rounded"
                  />
                  Obrig.
                </label>
                <Button variant="ghost" size="sm" onClick={() => removeCustomField(field.id)}>
                  <Trash2 className="w-4 h-4 text-red-400" />
                </Button>
              </div>
            ))}

            <Button variant="outline" className="w-full" onClick={addCustomField}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Campo Personalizado
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Opções de Seleção */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-white text-lg">Opções: Como conheceu?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {config.opcoes_como_conheceu?.map((opcao, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={opcao}
                    onChange={(e) => {
                      const newOpcoes = [...(config.opcoes_como_conheceu || [])];
                      newOpcoes[index] = e.target.value;
                      setConfig(prev => ({ ...prev, opcoes_como_conheceu: newOpcoes }));
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const newOpcoes = config.opcoes_como_conheceu?.filter((_, i) => i !== index);
                      setConfig(prev => ({ ...prev, opcoes_como_conheceu: newOpcoes }));
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setConfig(prev => ({
                    ...prev,
                    opcoes_como_conheceu: [...(prev.opcoes_como_conheceu || []), 'Nova opção'],
                  }));
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-white text-lg">Opções: Motivo da visita</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {config.opcoes_motivo_visita?.map((opcao, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={opcao}
                    onChange={(e) => {
                      const newOpcoes = [...(config.opcoes_motivo_visita || [])];
                      newOpcoes[index] = e.target.value;
                      setConfig(prev => ({ ...prev, opcoes_motivo_visita: newOpcoes }));
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const newOpcoes = config.opcoes_motivo_visita?.filter((_, i) => i !== index);
                      setConfig(prev => ({ ...prev, opcoes_motivo_visita: newOpcoes }));
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setConfig(prev => ({
                    ...prev,
                    opcoes_motivo_visita: [...(prev.opcoes_motivo_visita || []), 'Nova opção'],
                  }));
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
