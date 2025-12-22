import { useEffect, useState } from 'react';
import { Home, Settings, Plus, Pencil, Trash2, X, Check, Bed, Users, Image, Calendar, DollarSign, FileText, Bot } from 'lucide-react';
import { ImageUploader } from '../../components/ui/ImageUploader';
import { hostingConfigService, accommodationsService } from '../../services/supabase/hostingService';
import { adminService } from '../../services/supabase/admin';
import type { HostingConfig, ChurchAccommodation, BlockedDatePeriod, Church } from '../../types/database';
import { useSearchParams } from 'react-router-dom';
import "react";

const TIPO_ACOMODACAO: Record<string, string> = { individual: 'Individual', duplo: 'Duplo', triplo: 'Triplo', quadruplo: 'Quádruplo', coletivo: 'Coletivo', dormitorio: 'Dormitório', suite: 'Suíte', apartamento: 'Apartamento' };
const PUBLICO_OPTIONS = ['romeiros', 'retiros', 'clero', 'turistas', 'eventos', 'grupos', 'familias'];
const DIAS_SEMANA = [{ v: 'monday', l: 'Seg' }, { v: 'tuesday', l: 'Ter' }, { v: 'wednesday', l: 'Qua' }, { v: 'thursday', l: 'Qui' }, { v: 'friday', l: 'Sex' }, { v: 'saturday', l: 'Sáb' }, { v: 'sunday', l: 'Dom' }];

export function AdminHospedagem() {
  const [searchParams] = useSearchParams();
  const [churchId, setChurchId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [churches, setChurches] = useState<Church[]>([]);
  const [activeTab, setActiveTab] = useState<'config' | 'acomodacoes'>('config');
  const [, setConfig] = useState<HostingConfig | null>(null);
  const [accommodations, setAccommodations] = useState<ChurchAccommodation[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAcc, setSelectedAcc] = useState<ChurchAccommodation | null>(null);
  const [configTab, setConfigTab] = useState<'geral' | 'regras' | 'valores' | 'dados' | 'ia' | 'textos' | 'imagens'>('geral');

  const [form, setForm] = useState({
    hospedagem_ativa: false, descricao: '', publico_permitido: ['romeiros', 'retiros'], idade_minima: 0,
    permite_criancas: true, permite_animais: false, acessibilidade: '',
    dias_funcionamento: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    horario_checkin: '14:00', horario_checkout: '12:00', estadia_minima: 1, estadia_maxima: 30,
    permite_estender_estadia: true, datas_bloqueadas: [] as BlockedDatePeriod[], bloqueio_por_evento: true,
    valor_por_noite: undefined as number | undefined, valor_por_pessoa: false, taxa_limpeza: undefined as number | undefined,
    exige_sinal: false, valor_sinal: undefined as number | undefined, percentual_sinal: undefined as number | undefined,
    prazo_pagamento_sinal: undefined as number | undefined, politica_cancelamento: '',
    formas_pagamento: ['pix', 'dinheiro', 'transferencia'], dados_obrigatorios: ['nome', 'cpf', 'telefone', 'email'],
    exige_documento: true, tipos_documento: ['rg', 'cnh'], ficha_hospede_link: '', envio_documentos_por: ['upload', 'email'],
    ia_nivel_automacao: 'informar' as HostingConfig['ia_nivel_automacao'], usa_agendamento_ia: false,
    precisa_confirmacao_humana: true, mensagem_confirmacao_reserva: '', mensagem_indisponibilidade: '',
    regras_hospedagem: '', termos_responsabilidade: '', orientacoes_hospede: '', politica_silencio: '', informacoes_gerais: '',
    imagens: [] as { url: string; descricao: string }[],
  });

  const [accForm, setAccForm] = useState({
    nome: '', codigo: '', tipo: 'individual' as ChurchAccommodation['tipo'], capacidade_maxima: 1, quantidade_disponivel: 1,
    descricao: '', possui_banheiro: false, possui_banheiro_privativo: false, possui_roupa_cama: true, possui_toalhas: false,
    possui_ar_condicionado: false, possui_ventilador: false, possui_tv: false, possui_wifi: true, possui_frigobar: false,
    comodidades_extras: [] as string[], valor_noite_override: undefined as number | undefined,
    fotos: [] as { url: string; descricao: string }[], ativo: true, em_manutencao: false,
  });

  useEffect(() => { loadData(); }, [searchParams.get('church')]);

  async function loadChurchData(churchId: string) {
    try {
      const cfg = await hostingConfigService.getByChurch(churchId);
      if (cfg) { 
        setConfig(cfg); 
        setForm({ ...form, ...cfg, imagens: (cfg as any).imagens || [] }); 
      } else {
        // Reset form para valores padrão
        setForm({
          hospedagem_ativa: false, descricao: '', publico_permitido: ['romeiros', 'retiros'], idade_minima: 0,
          permite_criancas: true, permite_animais: false, acessibilidade: '',
          dias_funcionamento: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
          horario_checkin: '14:00', horario_checkout: '12:00', estadia_minima: 1, estadia_maxima: 30,
          permite_estender_estadia: true, datas_bloqueadas: [], bloqueio_por_evento: true,
          valor_por_noite: undefined, valor_por_pessoa: false, taxa_limpeza: undefined,
          exige_sinal: false, valor_sinal: undefined, percentual_sinal: undefined,
          prazo_pagamento_sinal: undefined, politica_cancelamento: '',
          formas_pagamento: ['pix', 'dinheiro', 'transferencia'], dados_obrigatorios: ['nome', 'cpf', 'telefone', 'email'],
          exige_documento: true, tipos_documento: ['rg', 'cnh'], ficha_hospede_link: '', envio_documentos_por: ['upload', 'email'],
          ia_nivel_automacao: 'informar', usa_agendamento_ia: false,
          precisa_confirmacao_humana: true, mensagem_confirmacao_reserva: '', mensagem_indisponibilidade: '',
          regras_hospedagem: '', termos_responsabilidade: '', orientacoes_hospede: '', politica_silencio: '', informacoes_gerais: '',
          imagens: [],
        });
        setConfig(null);
      }
      setAccommodations(await accommodationsService.listByChurch(churchId));
    } catch (e) { 
      console.error('Erro ao carregar dados da igreja:', e); 
    }
  }

  async function loadData() {
    setIsLoading(true);
    try {
      // Carregar lista de igrejas
      const churchesData = await adminService.listChurches();
      setChurches(churchesData);

      let cId = searchParams.get('church');
      if (!cId && churchesData.length > 0) {
        cId = churchesData[0].id;
      }
      
      if (cId) {
        setChurchId(cId);
        await loadChurchData(cId);
      }
    } catch (e) { console.error(e); }
    setIsLoading(false);
  }

  async function handleSaveConfig() {
    if (!churchId) return;
    setIsSaving(true);
    try { await hostingConfigService.upsert(churchId, form as any); await loadData(); alert('Salvo!'); }
    catch (e) { console.error(e); alert('Erro'); }
    setIsSaving(false);
  }

  function openNewAcc() { setSelectedAcc(null); setAccForm({ nome: '', codigo: '', tipo: 'individual', capacidade_maxima: 1, quantidade_disponivel: 1, descricao: '', possui_banheiro: false, possui_banheiro_privativo: false, possui_roupa_cama: true, possui_toalhas: false, possui_ar_condicionado: false, possui_ventilador: false, possui_tv: false, possui_wifi: true, possui_frigobar: false, comodidades_extras: [], valor_noite_override: undefined, fotos: [], ativo: true, em_manutencao: false }); setIsModalOpen(true); }

  function openEditAcc(a: ChurchAccommodation) { setSelectedAcc(a); setAccForm({ nome: a.nome, codigo: a.codigo || '', tipo: a.tipo, capacidade_maxima: a.capacidade_maxima, quantidade_disponivel: a.quantidade_disponivel, descricao: a.descricao || '', possui_banheiro: a.possui_banheiro, possui_banheiro_privativo: a.possui_banheiro_privativo, possui_roupa_cama: a.possui_roupa_cama, possui_toalhas: a.possui_toalhas, possui_ar_condicionado: a.possui_ar_condicionado, possui_ventilador: a.possui_ventilador, possui_tv: a.possui_tv, possui_wifi: a.possui_wifi, possui_frigobar: a.possui_frigobar, comodidades_extras: a.comodidades_extras || [], valor_noite_override: a.valor_noite_override, fotos: (a.fotos || []).map(f => ({ url: f.url, descricao: f.descricao || '' })), ativo: a.ativo, em_manutencao: a.em_manutencao }); setIsModalOpen(true); }

  async function handleSaveAcc() {
    if (!churchId || !accForm.nome) return;
    setIsSaving(true);
    try {
      if (selectedAcc) await accommodationsService.update(selectedAcc.id, accForm as any);
      else await accommodationsService.create({ church_id: churchId, ...accForm } as any);
      await loadData(); setIsModalOpen(false);
    } catch (e) { console.error(e); alert('Erro'); }
    setIsSaving(false);
  }

  async function handleDeleteAcc(id: string) { if (confirm('Excluir?')) { await accommodationsService.delete(id); loadData(); } }

  if (isLoading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div></div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-white">Hospedagem</h1><p className="text-gray-400 text-sm">Configure hospedagem e acomodações</p></div>
        <span className={`px-3 py-1 rounded-full text-sm ${form.hospedagem_ativa ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'}`}>{form.hospedagem_ativa ? 'Ativa' : 'Inativa'}</span>
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
              // Carregar dados da nova igreja selecionada
              loadChurchData(newChurchId);
            } else {
              setConfig(null);
              setAccommodations([]);
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

      <div className="flex gap-2 mb-6">
        <button onClick={() => setActiveTab('config')} className={`flex items-center gap-2 px-4 py-2 rounded-lg ${activeTab === 'config' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}><Settings className="h-4 w-4" />Configurações</button>
        <button onClick={() => setActiveTab('acomodacoes')} className={`flex items-center gap-2 px-4 py-2 rounded-lg ${activeTab === 'acomodacoes' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}><Bed className="h-4 w-4" />Acomodações ({accommodations.length})</button>
      </div>

      {activeTab === 'config' && (
        <div className="bg-gray-800 rounded-lg border border-gray-700">
          <div className="flex border-b border-gray-700 overflow-x-auto">
            {[{ id: 'geral', l: 'Geral', i: Home }, { id: 'regras', l: 'Regras', i: Calendar }, { id: 'valores', l: 'Valores', i: DollarSign }, { id: 'dados', l: 'Dados', i: FileText }, { id: 'ia', l: 'IA', i: Bot }, { id: 'textos', l: 'Textos', i: FileText }, { id: 'imagens', l: 'Imagens', i: Image }].map(t => (
              <button key={t.id} onClick={() => setConfigTab(t.id as any)} className={`flex items-center gap-2 px-4 py-3 text-sm border-b-2 whitespace-nowrap ${configTab === t.id ? 'border-purple-500 text-purple-400' : 'border-transparent text-gray-400 hover:text-white'}`}><t.i className="h-4 w-4" />{t.l}</button>
            ))}
          </div>
          <div className="p-4 space-y-4">
            {configTab === 'geral' && (<>
              <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={form.hospedagem_ativa} onChange={e => setForm({ ...form, hospedagem_ativa: e.target.checked })} className="w-5 h-5 rounded" /><div><span className="text-lg font-medium text-white">Hospedagem Ativa</span><p className="text-sm text-gray-400">Ative para disponibilizar hospedagem</p></div></label>
              </div>
              <div><label className="block text-sm text-gray-300 mb-1">Descrição</label><textarea value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} rows={3} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white" /></div>
              <div><label className="block text-sm text-gray-300 mb-2">Público Permitido</label><div className="flex flex-wrap gap-2">{PUBLICO_OPTIONS.map(p => (<label key={p} className="flex items-center gap-2 px-3 py-2 bg-gray-700/50 rounded-lg cursor-pointer"><input type="checkbox" checked={form.publico_permitido.includes(p)} onChange={e => setForm({ ...form, publico_permitido: e.target.checked ? [...form.publico_permitido, p] : form.publico_permitido.filter(x => x !== p) })} className="w-4 h-4 rounded" /><span className="text-sm text-gray-300 capitalize">{p}</span></label>))}</div></div>
              <div className="grid grid-cols-3 gap-4">
                <div><label className="block text-sm text-gray-300 mb-1">Idade Mínima</label><input type="number" value={form.idade_minima} onChange={e => setForm({ ...form, idade_minima: parseInt(e.target.value) || 0 })} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white" /></div>
                <label className="flex items-center gap-2"><input type="checkbox" checked={form.permite_criancas} onChange={e => setForm({ ...form, permite_criancas: e.target.checked })} className="w-4 h-4 rounded" /><span className="text-sm text-gray-300">Permite Crianças</span></label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={form.permite_animais} onChange={e => setForm({ ...form, permite_animais: e.target.checked })} className="w-4 h-4 rounded" /><span className="text-sm text-gray-300">Permite Animais</span></label>
              </div>
              <div><label className="block text-sm text-gray-300 mb-1">Acessibilidade</label><textarea value={form.acessibilidade} onChange={e => setForm({ ...form, acessibilidade: e.target.value })} rows={2} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white" /></div>
            </>)}
            {configTab === 'regras' && (<>
              <div><label className="block text-sm text-gray-300 mb-2">Dias de Funcionamento</label><div className="flex flex-wrap gap-2">{DIAS_SEMANA.map(d => (<label key={d.v} className="flex items-center gap-2 px-3 py-2 bg-gray-700/50 rounded-lg cursor-pointer"><input type="checkbox" checked={form.dias_funcionamento.includes(d.v)} onChange={e => setForm({ ...form, dias_funcionamento: e.target.checked ? [...form.dias_funcionamento, d.v] : form.dias_funcionamento.filter(x => x !== d.v) })} className="w-4 h-4 rounded" /><span className="text-sm text-gray-300">{d.l}</span></label>))}</div></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm text-gray-300 mb-1">Check-in</label><input type="time" value={form.horario_checkin} onChange={e => setForm({ ...form, horario_checkin: e.target.value })} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white" /></div>
                <div><label className="block text-sm text-gray-300 mb-1">Check-out</label><input type="time" value={form.horario_checkout} onChange={e => setForm({ ...form, horario_checkout: e.target.value })} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white" /></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><label className="block text-sm text-gray-300 mb-1">Estadia Mín (noites)</label><input type="number" value={form.estadia_minima} onChange={e => setForm({ ...form, estadia_minima: parseInt(e.target.value) || 1 })} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white" /></div>
                <div><label className="block text-sm text-gray-300 mb-1">Estadia Máx (noites)</label><input type="number" value={form.estadia_maxima} onChange={e => setForm({ ...form, estadia_maxima: parseInt(e.target.value) || 30 })} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white" /></div>
                <label className="flex items-center gap-2"><input type="checkbox" checked={form.permite_estender_estadia} onChange={e => setForm({ ...form, permite_estender_estadia: e.target.checked })} className="w-4 h-4 rounded" /><span className="text-sm text-gray-300">Permite Estender</span></label>
              </div>
            </>)}
            {configTab === 'valores' && (<>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm text-gray-300 mb-1">Valor/Noite (R$)</label><input type="number" step="0.01" value={form.valor_por_noite || ''} onChange={e => setForm({ ...form, valor_por_noite: e.target.value ? parseFloat(e.target.value) : undefined })} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white" /></div>
                <div><label className="block text-sm text-gray-300 mb-1">Taxa Limpeza (R$)</label><input type="number" step="0.01" value={form.taxa_limpeza || ''} onChange={e => setForm({ ...form, taxa_limpeza: e.target.value ? parseFloat(e.target.value) : undefined })} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white" /></div>
              </div>
              <label className="flex items-center gap-2 p-3 bg-gray-700/50 rounded-lg"><input type="checkbox" checked={form.valor_por_pessoa} onChange={e => setForm({ ...form, valor_por_pessoa: e.target.checked })} className="w-4 h-4 rounded" /><span className="text-sm text-gray-300">Valor por Pessoa (senão por quarto)</span></label>
              <label className="flex items-center gap-2 p-3 bg-gray-700/50 rounded-lg"><input type="checkbox" checked={form.exige_sinal} onChange={e => setForm({ ...form, exige_sinal: e.target.checked })} className="w-4 h-4 rounded" /><span className="text-sm text-gray-300">Exige Sinal</span></label>
              {form.exige_sinal && <div className="grid grid-cols-3 gap-4"><div><label className="block text-sm text-gray-300 mb-1">Valor Sinal</label><input type="number" step="0.01" value={form.valor_sinal || ''} onChange={e => setForm({ ...form, valor_sinal: e.target.value ? parseFloat(e.target.value) : undefined })} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white" /></div><div><label className="block text-sm text-gray-300 mb-1">Ou %</label><input type="number" value={form.percentual_sinal || ''} onChange={e => setForm({ ...form, percentual_sinal: e.target.value ? parseInt(e.target.value) : undefined })} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white" /></div><div><label className="block text-sm text-gray-300 mb-1">Prazo (dias)</label><input type="number" value={form.prazo_pagamento_sinal || ''} onChange={e => setForm({ ...form, prazo_pagamento_sinal: e.target.value ? parseInt(e.target.value) : undefined })} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white" /></div></div>}
              <div><label className="block text-sm text-gray-300 mb-2">Formas de Pagamento</label><div className="flex flex-wrap gap-2">{['pix', 'dinheiro', 'transferencia', 'cartao'].map(f => (<label key={f} className="flex items-center gap-2 px-3 py-2 bg-gray-700/50 rounded-lg cursor-pointer"><input type="checkbox" checked={form.formas_pagamento.includes(f)} onChange={e => setForm({ ...form, formas_pagamento: e.target.checked ? [...form.formas_pagamento, f] : form.formas_pagamento.filter(x => x !== f) })} className="w-4 h-4 rounded" /><span className="text-sm text-gray-300 capitalize">{f}</span></label>))}</div></div>
            </>)}
            {configTab === 'dados' && (<>
              <div><label className="block text-sm text-gray-300 mb-2">Dados Obrigatórios</label><div className="flex flex-wrap gap-2">{['nome', 'cpf', 'rg', 'telefone', 'email', 'endereco'].map(d => (<label key={d} className="flex items-center gap-2 px-3 py-2 bg-gray-700/50 rounded-lg cursor-pointer"><input type="checkbox" checked={form.dados_obrigatorios.includes(d)} onChange={e => setForm({ ...form, dados_obrigatorios: e.target.checked ? [...form.dados_obrigatorios, d] : form.dados_obrigatorios.filter(x => x !== d) })} className="w-4 h-4 rounded" /><span className="text-sm text-gray-300 capitalize">{d}</span></label>))}</div></div>
              <label className="flex items-center gap-2 p-3 bg-gray-700/50 rounded-lg"><input type="checkbox" checked={form.exige_documento} onChange={e => setForm({ ...form, exige_documento: e.target.checked })} className="w-4 h-4 rounded" /><span className="text-sm text-gray-300">Exige Documento com Foto</span></label>
              {form.exige_documento && <div><label className="block text-sm text-gray-300 mb-2">Documentos Aceitos</label><div className="flex flex-wrap gap-2">{['rg', 'cnh', 'passaporte'].map(d => (<label key={d} className="flex items-center gap-2 px-3 py-2 bg-gray-700/50 rounded-lg cursor-pointer"><input type="checkbox" checked={form.tipos_documento.includes(d)} onChange={e => setForm({ ...form, tipos_documento: e.target.checked ? [...form.tipos_documento, d] : form.tipos_documento.filter(x => x !== d) })} className="w-4 h-4 rounded" /><span className="text-sm text-gray-300 uppercase">{d}</span></label>))}</div></div>}
            </>)}
            {configTab === 'ia' && (<>
              <div><label className="block text-sm text-gray-300 mb-1">Nível de Automação</label><select value={form.ia_nivel_automacao} onChange={e => setForm({ ...form, ia_nivel_automacao: e.target.value as any })} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"><option value="informar">Apenas Informar</option><option value="coletar_dados">Coletar Dados</option><option value="pre_reservar">Pré-Reservar</option><option value="confirmar_reserva">Confirmar Reserva</option></select></div>
              <label className="flex items-center gap-2 p-3 bg-gray-700/50 rounded-lg"><input type="checkbox" checked={form.usa_agendamento_ia} onChange={e => setForm({ ...form, usa_agendamento_ia: e.target.checked })} className="w-4 h-4 rounded" /><span className="text-sm text-gray-300">Usa Agendamento via IA</span></label>
              <label className="flex items-center gap-2 p-3 bg-gray-700/50 rounded-lg"><input type="checkbox" checked={form.precisa_confirmacao_humana} onChange={e => setForm({ ...form, precisa_confirmacao_humana: e.target.checked })} className="w-4 h-4 rounded" /><span className="text-sm text-gray-300">Precisa Confirmação Humana</span></label>
              <div><label className="block text-sm text-gray-300 mb-1">Msg Confirmação</label><textarea value={form.mensagem_confirmacao_reserva} onChange={e => setForm({ ...form, mensagem_confirmacao_reserva: e.target.value })} rows={2} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm" /></div>
              <div><label className="block text-sm text-gray-300 mb-1">Msg Indisponibilidade</label><textarea value={form.mensagem_indisponibilidade} onChange={e => setForm({ ...form, mensagem_indisponibilidade: e.target.value })} rows={2} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm" /></div>
            </>)}
            {configTab === 'textos' && (<>
              <div><label className="block text-sm text-gray-300 mb-1">Regras da Hospedagem</label><textarea value={form.regras_hospedagem} onChange={e => setForm({ ...form, regras_hospedagem: e.target.value })} rows={4} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm" /></div>
              <div><label className="block text-sm text-gray-300 mb-1">Orientações ao Hóspede</label><textarea value={form.orientacoes_hospede} onChange={e => setForm({ ...form, orientacoes_hospede: e.target.value })} rows={3} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm" /></div>
              <div><label className="block text-sm text-gray-300 mb-1">Política de Silêncio</label><textarea value={form.politica_silencio} onChange={e => setForm({ ...form, politica_silencio: e.target.value })} rows={2} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm" /></div>
              <div><label className="block text-sm text-gray-300 mb-1">Informações Gerais</label><textarea value={form.informacoes_gerais} onChange={e => setForm({ ...form, informacoes_gerais: e.target.value })} rows={3} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm" /></div>
            </>)}
            {configTab === 'imagens' && (<>
              <p className="text-xs text-gray-500 mb-4">Imagens dos espaços que a IA pode enviar aos usuários</p>
              {churchId && (
                <ImageUploader
                  images={form.imagens}
                  onChange={(imgs) => setForm({ ...form, imagens: imgs })}
                  churchId={churchId}
                  category="hospedagem"
                  maxImages={20}
                  label="Fotos da Hospedagem"
                />
              )}
            </>)}
          </div>
          <div className="flex justify-end p-4 border-t border-gray-700"><button onClick={handleSaveConfig} disabled={isSaving} className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-lg">{isSaving ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <Check className="h-4 w-4" />}Salvar</button></div>
        </div>
      )}

      {activeTab === 'acomodacoes' && (<div>
        <div className="flex justify-end mb-4"><button onClick={openNewAcc} className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"><Plus className="h-4 w-4" />Nova Acomodação</button></div>
        {accommodations.length === 0 ? (<div className="text-center py-12 bg-gray-800 rounded-lg border border-gray-700"><Bed className="h-12 w-12 text-gray-600 mx-auto mb-4" /><p className="text-gray-400">Nenhuma acomodação</p></div>) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accommodations.map(a => (<div key={a.id} className={`bg-gray-800 rounded-lg border ${a.ativo ? 'border-gray-700' : 'border-gray-700/50 opacity-60'} p-4`}>
              <div className="flex items-start justify-between mb-2"><div><h3 className="font-medium text-white">{a.nome}</h3><span className="text-xs text-gray-500">{TIPO_ACOMODACAO[a.tipo]} • {a.codigo}</span></div><div className="flex gap-1"><button onClick={() => openEditAcc(a)} className="p-1 text-gray-400 hover:text-purple-400"><Pencil className="h-4 w-4" /></button><button onClick={() => handleDeleteAcc(a.id)} className="p-1 text-gray-400 hover:text-red-400"><Trash2 className="h-4 w-4" /></button></div></div>
              <div className="flex gap-4 text-sm text-gray-400"><span className="flex items-center gap-1"><Users className="h-4 w-4" />{a.capacidade_maxima}</span><span className="flex items-center gap-1"><Bed className="h-4 w-4" />{a.quantidade_disponivel} un.</span></div>
              {a.valor_noite_override && <span className="text-xs text-green-400 mt-2 block">R$ {a.valor_noite_override}/noite</span>}
            </div>))}
          </div>
        )}
      </div>)}

      {isModalOpen && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"><div className="bg-gray-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-auto m-4 border border-gray-700">
        <div className="flex items-center justify-between p-4 border-b border-gray-700"><h2 className="text-lg font-bold text-white">{selectedAcc ? 'Editar' : 'Nova'} Acomodação</h2><button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400"><X className="h-5 w-5" /></button></div>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm text-gray-300 mb-1">Nome *</label><input type="text" value={accForm.nome} onChange={e => setAccForm({ ...accForm, nome: e.target.value })} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white" /></div><div><label className="block text-sm text-gray-300 mb-1">Código</label><input type="text" value={accForm.codigo} onChange={e => setAccForm({ ...accForm, codigo: e.target.value })} placeholder="Q01" className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white" /></div></div>
          <div className="grid grid-cols-3 gap-4"><div><label className="block text-sm text-gray-300 mb-1">Tipo</label><select value={accForm.tipo} onChange={e => setAccForm({ ...accForm, tipo: e.target.value as any })} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white">{Object.entries(TIPO_ACOMODACAO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div><div><label className="block text-sm text-gray-300 mb-1">Capacidade</label><input type="number" value={accForm.capacidade_maxima} onChange={e => setAccForm({ ...accForm, capacidade_maxima: parseInt(e.target.value) || 1 })} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white" /></div><div><label className="block text-sm text-gray-300 mb-1">Quantidade</label><input type="number" value={accForm.quantidade_disponivel} onChange={e => setAccForm({ ...accForm, quantidade_disponivel: parseInt(e.target.value) || 1 })} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white" /></div></div>
          <div><label className="block text-sm text-gray-300 mb-1">Descrição</label><textarea value={accForm.descricao} onChange={e => setAccForm({ ...accForm, descricao: e.target.value })} rows={2} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white" /></div>
          <div><label className="block text-sm text-gray-300 mb-2">Comodidades</label><div className="grid grid-cols-3 gap-2">{[{ k: 'possui_banheiro', l: 'Banheiro' }, { k: 'possui_banheiro_privativo', l: 'Banheiro Privativo' }, { k: 'possui_roupa_cama', l: 'Roupa de Cama' }, { k: 'possui_toalhas', l: 'Toalhas' }, { k: 'possui_ar_condicionado', l: 'Ar Condicionado' }, { k: 'possui_ventilador', l: 'Ventilador' }, { k: 'possui_tv', l: 'TV' }, { k: 'possui_wifi', l: 'Wi-Fi' }, { k: 'possui_frigobar', l: 'Frigobar' }].map(c => (<label key={c.k} className="flex items-center gap-2 p-2 bg-gray-700/50 rounded cursor-pointer"><input type="checkbox" checked={(accForm as any)[c.k]} onChange={e => setAccForm({ ...accForm, [c.k]: e.target.checked })} className="w-4 h-4 rounded" /><span className="text-sm text-gray-300">{c.l}</span></label>))}</div></div>
          <div><label className="block text-sm text-gray-300 mb-1">Valor/Noite Override (R$)</label><input type="number" step="0.01" value={accForm.valor_noite_override || ''} onChange={e => setAccForm({ ...accForm, valor_noite_override: e.target.value ? parseFloat(e.target.value) : undefined })} placeholder="Deixe vazio para usar valor padrão" className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white" /></div>
          <div className="flex gap-4"><label className="flex items-center gap-2"><input type="checkbox" checked={accForm.ativo} onChange={e => setAccForm({ ...accForm, ativo: e.target.checked })} className="w-4 h-4 rounded" /><span className="text-sm text-gray-300">Ativo</span></label><label className="flex items-center gap-2"><input type="checkbox" checked={accForm.em_manutencao} onChange={e => setAccForm({ ...accForm, em_manutencao: e.target.checked })} className="w-4 h-4 rounded" /><span className="text-sm text-gray-300">Em Manutenção</span></label></div>
          {churchId && (
            <ImageUploader
              images={accForm.fotos}
              onChange={(imgs) => setAccForm({ ...accForm, fotos: imgs })}
              churchId={churchId}
              category="acomodacoes"
              maxImages={10}
              label="Fotos da Acomodação"
            />
          )}
        </div>
        <div className="flex justify-end gap-3 p-4 border-t border-gray-700"><button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-400">Cancelar</button><button onClick={handleSaveAcc} disabled={isSaving || !accForm.nome} className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-lg">{isSaving ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <Check className="h-4 w-4" />}Salvar</button></div>
      </div></div>)}
    </div>
  );
}
