import { useState, useEffect, useCallback } from 'react';
import { 
  Bell, 
  Plus, 
  Search, 
  Phone, 
  Mail, 
  MessageSquare,
  User,
  Calendar,
  Pencil,
  X,
  Send,
  Loader2,
  RefreshCw,
  Trash2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAuth } from '../contexts/AuthContext';
import { supportTicketsService, ticketMessagesService } from '../services/supabase';
import type { SupportTicket, SupportTicketMessage, TicketStatus, TicketPrioridade } from '../types/database';

const statusConfig: Record<TicketStatus, { label: string; color: string; bgColor: string }> = {
  pendente: { label: 'Pendente', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20 border-yellow-500/30' },
  em_andamento: { label: 'Em Andamento', color: 'text-blue-400', bgColor: 'bg-blue-500/20 border-blue-500/30' },
  aguardando_resposta: { label: 'Aguardando', color: 'text-purple-400', bgColor: 'bg-purple-500/20 border-purple-500/30' },
  resolvido: { label: 'Resolvido', color: 'text-green-400', bgColor: 'bg-green-500/20 border-green-500/30' },
  cancelado: { label: 'Cancelado', color: 'text-gray-400', bgColor: 'bg-gray-500/20 border-gray-500/30' },
};

const prioridadeConfig: Record<TicketPrioridade, { label: string; color: string; bgColor: string }> = {
  baixa: { label: 'Baixa', color: 'text-gray-400', bgColor: 'bg-gray-500/20' },
  normal: { label: 'Normal', color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  alta: { label: 'Alta', color: 'text-orange-400', bgColor: 'bg-orange-500/20' },
  urgente: { label: 'Urgente', color: 'text-red-400', bgColor: 'bg-red-500/20' },
};

const MASS_INTENTION_CATEGORY = 'intencao_missa';
const NOTICE_CATEGORY = 'aviso';

const massIntentionOptions: Array<{ value: string; label: string; codigo?: string }> = [
  { value: 'a', codigo: 'a', label: 'Missa em Intenção de Aniversário: Nascimento' },
  { value: 'b', codigo: 'b', label: 'Missa em Intenção de Aniversário: Relacionamento' },
  { value: 'c', codigo: 'c', label: 'Missa em Intenção de Aniversário: Casamento' },
  { value: 'd', codigo: 'd', label: 'Missa em Intenção de Aniversário: Ordenação' },
  { value: 'e', codigo: 'e', label: 'Missa em Intenção de Saúde: Recuperação' },
  { value: 'f', codigo: 'f', label: 'Missa em Intenção de Saúde: Cirurgia' },
  { value: 'g', codigo: 'g', label: 'Missa em Intenção de Falecimento: Sétimo dia' },
  { value: 'h', codigo: 'h', label: 'Missa em Intenção de Falecimento: 30 dias' },
  { value: 'i', codigo: 'i', label: 'Missa em Intenção de Falecimento: Acima de 30 dias' },
  { value: 'custom', label: 'Outro (digitar)' },
];

export function NoticesPage() {
  const { church, isReadOnly } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [intencoesSearchTerm, setIntencoesSearchTerm] = useState('');
  const [avisosSearchTerm, setAvisosSearchTerm] = useState('');
  const [intencoesStatusFilter, setIntencoesStatusFilter] = useState<TicketStatus | ''>('');
  const [avisosStatusFilter, setAvisosStatusFilter] = useState<TicketStatus | ''>('');
  const [showCreateIntencaoModal, setShowCreateIntencaoModal] = useState(false);
  const [showCreateAvisoModal, setShowCreateAvisoModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [ticketMessages, setTicketMessages] = useState<SupportTicketMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    email: '',
    motivo: '',
    assunto: '',
    observacao: '',
    prioridade: 'normal' as TicketPrioridade,
  });

  const [avisoFormData, setAvisoFormData] = useState({
    nome: '',
    telefone: '',
    email: '',
    assunto: '',
    observacao: '',
    prioridade: 'normal' as TicketPrioridade,
  });

  const [customIntention, setCustomIntention] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [editingTicket, setEditingTicket] = useState<SupportTicket | null>(null);
  const [editFormData, setEditFormData] = useState({
    nome: '',
    telefone: '',
    email: '',
    motivo: '',
    assunto: '',
    observacao: '',
    prioridade: 'normal' as TicketPrioridade,
  });
  const [editAvisoFormData, setEditAvisoFormData] = useState({
    nome: '',
    telefone: '',
    email: '',
    assunto: '',
    observacao: '',
    prioridade: 'normal' as TicketPrioridade,
  });
  const [editCustomIntention, setEditCustomIntention] = useState('');

  const loadTickets = useCallback(async () => {
    if (!church?.id) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const ticketsData = await supportTicketsService.list(church.id);
      setTickets(ticketsData);
    } catch (err: any) {
      console.error('Erro ao carregar tickets:', err);
      if (err?.code === '42P01' || err?.message?.includes('does not exist')) {
        setError('As tabelas de tickets ainda não foram criadas. Execute o SQL sql_support_tickets.sql no Supabase.');
      } else {
        setError('Erro ao carregar tickets. Verifique o console para mais detalhes.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [church?.id]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const loadTicketMessages = async (ticketId: string) => {
    try {
      const messages = await ticketMessagesService.listByTicket(ticketId);
      setTicketMessages(messages);
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    }
  };

  const handleCreateIntencao = async () => {
    if (isReadOnly) return;
    if (!church?.id || !formData.nome || !formData.telefone || !formData.motivo) return;

    const selectedIntention = massIntentionOptions.find((o) => o.value === formData.motivo);
    const motivoText =
      formData.motivo === 'custom'
        ? customIntention.trim()
        : `${selectedIntention?.codigo || formData.motivo} - ${selectedIntention?.label || formData.motivo}`;

    if (formData.motivo === 'custom' && !motivoText) return;

    try {
      setIsSaving(true);
      await supportTicketsService.create({
        church_id: church.id,
        nome: formData.nome,
        telefone: formData.telefone,
        email: formData.email || undefined,
        motivo: motivoText,
        assunto: formData.assunto || undefined,
        observacao: formData.observacao || undefined,
        prioridade: formData.prioridade,
        status: 'pendente',
        origem: 'manual',
        categoria: MASS_INTENTION_CATEGORY,
      });
      
      setFormData({ nome: '', telefone: '', email: '', motivo: '', assunto: '', observacao: '', prioridade: 'normal' });
      setCustomIntention('');
      setShowCreateIntencaoModal(false);
      loadTickets();
    } catch (error) {
      console.error('Erro ao criar ticket:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateAviso = async () => {
    if (isReadOnly) return;
    if (!church?.id || !avisoFormData.nome || !avisoFormData.telefone || !avisoFormData.assunto) return;

    try {
      setIsSaving(true);
      await supportTicketsService.create({
        church_id: church.id,
        nome: avisoFormData.nome,
        telefone: avisoFormData.telefone,
        email: avisoFormData.email || undefined,
        motivo: 'Aviso ao Padre',
        assunto: avisoFormData.assunto,
        observacao: avisoFormData.observacao || undefined,
        prioridade: avisoFormData.prioridade,
        status: 'pendente',
        origem: 'manual',
        categoria: NOTICE_CATEGORY,
      });

      setAvisoFormData({ nome: '', telefone: '', email: '', assunto: '', observacao: '', prioridade: 'normal' });
      setShowCreateAvisoModal(false);
      loadTickets();
    } catch (error) {
      console.error('Erro ao criar aviso:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const parseMotivoToEdit = (motivo: string) => {
    const m = String(motivo || '').trim();
    const match = m.match(/^([a-iA-I])\s*-\s*(.+)$/);
    if (match) {
      const code = match[1].toLowerCase();
      return { motivoSelect: code, custom: '' };
    }
    return { motivoSelect: 'custom', custom: m };
  };

  const openEditTicket = (ticket: SupportTicket) => {
    setEditingTicket(ticket);

    if (categoryOf(ticket) === MASS_INTENTION_CATEGORY) {
      const parsed = parseMotivoToEdit(ticket.motivo);
      setEditFormData({
        nome: ticket.nome || '',
        telefone: ticket.telefone || '',
        email: ticket.email || '',
        motivo: parsed.motivoSelect,
        assunto: ticket.assunto || '',
        observacao: ticket.observacao || '',
        prioridade: ticket.prioridade,
      });
      setEditCustomIntention(parsed.custom);
    } else {
      setEditAvisoFormData({
        nome: ticket.nome || '',
        telefone: ticket.telefone || '',
        email: ticket.email || '',
        assunto: ticket.assunto || '',
        observacao: ticket.observacao || '',
        prioridade: ticket.prioridade,
      });
      setEditCustomIntention('');
    }
  };

  const closeEdit = () => {
    setEditingTicket(null);
    setEditCustomIntention('');
  };

  const handleUpdateTicket = async () => {
    if (isReadOnly) return;
    if (!editingTicket) return;

    try {
      setIsSaving(true);

      if (categoryOf(editingTicket) === MASS_INTENTION_CATEGORY) {
        if (!editFormData.nome || !editFormData.telefone || !editFormData.motivo) return;
        const selectedIntention = massIntentionOptions.find((o) => o.value === editFormData.motivo);
        const motivoText =
          editFormData.motivo === 'custom'
            ? editCustomIntention.trim()
            : `${selectedIntention?.codigo || editFormData.motivo} - ${selectedIntention?.label || editFormData.motivo}`;

        if (editFormData.motivo === 'custom' && !motivoText) return;

        await supportTicketsService.update(editingTicket.id, {
          nome: editFormData.nome,
          telefone: editFormData.telefone,
          email: editFormData.email || undefined,
          motivo: motivoText,
          assunto: editFormData.assunto || undefined,
          observacao: editFormData.observacao || undefined,
          prioridade: editFormData.prioridade,
        });
      } else {
        if (!editAvisoFormData.nome || !editAvisoFormData.telefone || !editAvisoFormData.assunto) return;
        await supportTicketsService.update(editingTicket.id, {
          nome: editAvisoFormData.nome,
          telefone: editAvisoFormData.telefone,
          email: editAvisoFormData.email || undefined,
          assunto: editAvisoFormData.assunto,
          observacao: editAvisoFormData.observacao || undefined,
          prioridade: editAvisoFormData.prioridade,
        });
      }

      closeEdit();
      loadTickets();
    } catch (error) {
      console.error('Erro ao editar:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendMessage = async () => {
    if (isReadOnly) return;
    if (!selectedTicket || !newMessage.trim() || !church?.id) return;

    try {
      setIsSending(true);
      await ticketMessagesService.create({
        ticket_id: selectedTicket.id,
        church_id: church.id,
        tipo: 'mensagem',
        conteudo: newMessage,
        autor_tipo: 'atendente',
      });
      
      setNewMessage('');
      loadTicketMessages(selectedTicket.id);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleUpdateStatus = async (ticketId: string, status: TicketStatus) => {
    if (isReadOnly) return;
    try {
      await supportTicketsService.updateStatus(ticketId, status);
      loadTickets();
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status });
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  const handleDeleteTicket = async (ticketId: string) => {
    if (isReadOnly) return;
    if (!confirm('Tem certeza que deseja excluir este ticket?')) return;
    
    try {
      await supportTicketsService.delete(ticketId);
      loadTickets();
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket(null);
      }
    } catch (error) {
      console.error('Erro ao excluir ticket:', error);
    }
  };

  const openTicketDetails = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    loadTicketMessages(ticket.id);
  };

  const categoryOf = (ticket: SupportTicket) => {
    const c = String(ticket.categoria || '').trim().toLowerCase();
    if (c === MASS_INTENTION_CATEGORY) return MASS_INTENTION_CATEGORY;
    if (c === NOTICE_CATEGORY) return NOTICE_CATEGORY;
    return NOTICE_CATEGORY;
  };

  const displayTitle = (ticket: SupportTicket) => {
    return ticket.assunto ? ticket.assunto : ticket.motivo;
  };

  const computeStats = (items: SupportTicket[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const s = { total: items.length, pendentes: 0, emAndamento: 0, resolvidos: 0, urgentes: 0, hoje: 0 };
    items.forEach((t) => {
      const createdAt = new Date(t.created_at);
      if (t.status === 'pendente') s.pendentes++;
      if (t.status === 'em_andamento' || t.status === 'aguardando_resposta') s.emAndamento++;
      if (t.status === 'resolvido') s.resolvidos++;
      if (t.prioridade === 'urgente' && t.status !== 'resolvido') s.urgentes++;
      if (createdAt >= today) s.hoje++;
    });
    return s;
  };

  const filteredIntencoes = tickets
    .filter((t) => categoryOf(t) === MASS_INTENTION_CATEGORY)
    .filter((t) => (intencoesStatusFilter ? t.status === intencoesStatusFilter : true))
    .filter((t) => {
      const q = intencoesSearchTerm.trim().toLowerCase();
      if (!q) return true;
      return (
        String(t.nome || '').toLowerCase().includes(q) ||
        String(t.telefone || '').toLowerCase().includes(q) ||
        String(t.motivo || '').toLowerCase().includes(q) ||
        String(t.assunto || '').toLowerCase().includes(q)
      );
    });

  const filteredAvisos = tickets
    .filter((t) => categoryOf(t) === NOTICE_CATEGORY)
    .filter((t) => (avisosStatusFilter ? t.status === avisosStatusFilter : true))
    .filter((t) => {
      const q = avisosSearchTerm.trim().toLowerCase();
      if (!q) return true;
      return (
        String(t.nome || '').toLowerCase().includes(q) ||
        String(t.telefone || '').toLowerCase().includes(q) ||
        String(t.motivo || '').toLowerCase().includes(q) ||
        String(t.assunto || '').toLowerCase().includes(q)
      );
    });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Intenções de Missas / Avisos</h1>
          <p className="text-sm text-gray-400">Organize intenções de missas e avisos para visualização do padre</p>
        </div>
        {!isReadOnly ? (
          <div className="flex gap-3">
            <Button variant="outline" onClick={loadTickets}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
            <Button onClick={() => setShowCreateIntencaoModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Intenção
            </Button>
            <Button onClick={() => setShowCreateAvisoModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Aviso
            </Button>
          </div>
        ) : null}
      </div>

      {/* Error Message */}
      {error && (
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Bell className="w-6 h-6 text-red-400" />
              <div>
                <p className="text-red-400 font-medium">Erro ao carregar tickets</p>
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lists */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {isLoading ? (
          <div className="xl:col-span-2 flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
          </div>
        ) : error ? (
          <div className="xl:col-span-2 text-center py-12">
            <Bell className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-400">Execute o SQL para criar as tabelas de tickets</p>
            <p className="text-gray-500 text-sm mt-2">Arquivo: sql_support_tickets.sql</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-white">Intenções de Missas</h2>
                  <p className="text-xs text-gray-400">Para visualização do padre</p>
                </div>
                {!isReadOnly ? (
                  <Button size="sm" onClick={() => setShowCreateIntencaoModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Intenção
                  </Button>
                ) : null}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {(() => {
                  const s = computeStats(tickets.filter((t) => categoryOf(t) === MASS_INTENTION_CATEGORY));
                  return (
                    <>
                      <Card className="bg-gray-800/50 border-gray-700/50">
                        <CardContent className="p-4 text-center">
                          <p className="text-2xl font-bold text-white">{s.total}</p>
                          <p className="text-xs text-gray-400">Total</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-yellow-500/10 border-yellow-500/30">
                        <CardContent className="p-4 text-center">
                          <p className="text-2xl font-bold text-yellow-400">{s.pendentes}</p>
                          <p className="text-xs text-yellow-400">Pendentes</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-blue-500/10 border-blue-500/30">
                        <CardContent className="p-4 text-center">
                          <p className="text-2xl font-bold text-blue-400">{s.emAndamento}</p>
                          <p className="text-xs text-blue-400">Em Andamento</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-green-500/10 border-green-500/30">
                        <CardContent className="p-4 text-center">
                          <p className="text-2xl font-bold text-green-400">{s.resolvidos}</p>
                          <p className="text-xs text-green-400">Resolvidos</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-red-500/10 border-red-500/30">
                        <CardContent className="p-4 text-center">
                          <p className="text-2xl font-bold text-red-400">{s.urgentes}</p>
                          <p className="text-xs text-red-400">Urgentes</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-purple-500/10 border-purple-500/30">
                        <CardContent className="p-4 text-center">
                          <p className="text-2xl font-bold text-purple-400">{s.hoje}</p>
                          <p className="text-xs text-purple-400">Hoje</p>
                        </CardContent>
                      </Card>
                    </>
                  );
                })()}
              </div>

              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Buscar por nome, telefone ou intenção..."
                      value={intencoesSearchTerm}
                      onChange={(e) => setIntencoesSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <select
                  value={intencoesStatusFilter}
                  onChange={(e) => setIntencoesStatusFilter(e.target.value as TicketStatus | '')}
                  className="px-4 py-2 rounded-xl border border-gray-600 bg-gray-700/50 text-white text-sm"
                >
                  <option value="">Todos os status</option>
                  <option value="pendente">Pendente</option>
                  <option value="em_andamento">Em Andamento</option>
                  <option value="aguardando_resposta">Aguardando Resposta</option>
                  <option value="resolvido">Resolvido</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>

              {filteredIntencoes.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">Nenhuma intenção encontrada</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredIntencoes.map((ticket) => (
                    <Card
                      key={ticket.id}
                      className="hover:border-purple-500/50 transition-all cursor-pointer"
                      onClick={() => openTicketDetails(ticket)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-500/20 rounded-lg">
                              <User className="w-5 h-5 text-purple-400" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-white">{ticket.nome}</h3>
                              <p className="text-sm text-gray-400">{formatPhone(ticket.telefone)}</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${statusConfig[ticket.status].bgColor} ${statusConfig[ticket.status].color}`}>
                              {statusConfig[ticket.status].label}
                            </span>
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${prioridadeConfig[ticket.prioridade].bgColor} ${prioridadeConfig[ticket.prioridade].color}`}>
                              {prioridadeConfig[ticket.prioridade].label}
                            </span>
                          </div>
                        </div>

                        <div className="mb-3">
                          <p className="text-sm font-medium text-gray-300">{displayTitle(ticket)}</p>
                          {ticket.observacao && (
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{ticket.observacao}</p>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(ticket.created_at)}
                          </div>
                          {!isReadOnly ? (
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(`https://wa.me/${ticket.telefone.replace(/\D/g, '')}`, '_blank');
                                }}
                              >
                                <MessageSquare className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditTicket(ticket);
                                }}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteTicket(ticket.id);
                                }}
                              >
                                <Trash2 className="w-4 h-4 text-red-400" />
                              </Button>
                            </div>
                          ) : null}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-4 xl:border-l xl:border-gray-700/50 xl:pl-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-white">Avisos</h2>
                  <p className="text-xs text-gray-400">Para visualização do padre</p>
                </div>
                {!isReadOnly ? (
                  <Button size="sm" onClick={() => setShowCreateAvisoModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Aviso
                  </Button>
                ) : null}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {(() => {
                  const s = computeStats(tickets.filter((t) => categoryOf(t) === NOTICE_CATEGORY));
                  return (
                    <>
                      <Card className="bg-gray-800/50 border-gray-700/50">
                        <CardContent className="p-4 text-center">
                          <p className="text-2xl font-bold text-white">{s.total}</p>
                          <p className="text-xs text-gray-400">Total</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-yellow-500/10 border-yellow-500/30">
                        <CardContent className="p-4 text-center">
                          <p className="text-2xl font-bold text-yellow-400">{s.pendentes}</p>
                          <p className="text-xs text-yellow-400">Pendentes</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-blue-500/10 border-blue-500/30">
                        <CardContent className="p-4 text-center">
                          <p className="text-2xl font-bold text-blue-400">{s.emAndamento}</p>
                          <p className="text-xs text-blue-400">Em Andamento</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-green-500/10 border-green-500/30">
                        <CardContent className="p-4 text-center">
                          <p className="text-2xl font-bold text-green-400">{s.resolvidos}</p>
                          <p className="text-xs text-green-400">Resolvidos</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-red-500/10 border-red-500/30">
                        <CardContent className="p-4 text-center">
                          <p className="text-2xl font-bold text-red-400">{s.urgentes}</p>
                          <p className="text-xs text-red-400">Urgentes</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-purple-500/10 border-purple-500/30">
                        <CardContent className="p-4 text-center">
                          <p className="text-2xl font-bold text-purple-400">{s.hoje}</p>
                          <p className="text-xs text-purple-400">Hoje</p>
                        </CardContent>
                      </Card>
                    </>
                  );
                })()}
              </div>

              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Buscar por nome, telefone ou assunto..."
                      value={avisosSearchTerm}
                      onChange={(e) => setAvisosSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <select
                  value={avisosStatusFilter}
                  onChange={(e) => setAvisosStatusFilter(e.target.value as TicketStatus | '')}
                  className="px-4 py-2 rounded-xl border border-gray-600 bg-gray-700/50 text-white text-sm"
                >
                  <option value="">Todos os status</option>
                  <option value="pendente">Pendente</option>
                  <option value="em_andamento">Em Andamento</option>
                  <option value="aguardando_resposta">Aguardando Resposta</option>
                  <option value="resolvido">Resolvido</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>

              {filteredAvisos.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">Nenhum aviso encontrado</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredAvisos.map((ticket) => (
                    <Card
                      key={ticket.id}
                      className="hover:border-purple-500/50 transition-all cursor-pointer"
                      onClick={() => openTicketDetails(ticket)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-500/20 rounded-lg">
                              <User className="w-5 h-5 text-purple-400" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-white">{ticket.nome}</h3>
                              <p className="text-sm text-gray-400">{formatPhone(ticket.telefone)}</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${statusConfig[ticket.status].bgColor} ${statusConfig[ticket.status].color}`}>
                              {statusConfig[ticket.status].label}
                            </span>
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${prioridadeConfig[ticket.prioridade].bgColor} ${prioridadeConfig[ticket.prioridade].color}`}>
                              {prioridadeConfig[ticket.prioridade].label}
                            </span>
                          </div>
                        </div>

                        <div className="mb-3">
                          <p className="text-sm font-medium text-gray-300">{displayTitle(ticket)}</p>
                          {ticket.observacao && (
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{ticket.observacao}</p>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(ticket.created_at)}
                          </div>
                          {!isReadOnly ? (
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(`https://wa.me/${ticket.telefone.replace(/\D/g, '')}`, '_blank');
                                }}
                              >
                                <MessageSquare className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditTicket(ticket);
                                }}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteTicket(ticket.id);
                                }}
                              >
                                <Trash2 className="w-4 h-4 text-red-400" />
                              </Button>
                            </div>
                          ) : null}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Create Intencao Modal */}
      {!isReadOnly && showCreateIntencaoModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white">Nova Intenção de Missa</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => { setShowCreateIntencaoModal(false); setCustomIntention(''); }}>
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nome *</Label>
                  <Input
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Nome completo"
                  />
                </div>
                <div>
                  <Label>Telefone *</Label>
                  <Input
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>
              
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@exemplo.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Intenção *</Label>
                  <select
                    value={formData.motivo}
                    onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-gray-600 bg-gray-700/50 text-white text-sm"
                  >
                    <option value="">Selecione...</option>
                    {massIntentionOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Prioridade</Label>
                  <select
                    value={formData.prioridade}
                    onChange={(e) => setFormData({ ...formData, prioridade: e.target.value as TicketPrioridade })}
                    className="w-full px-4 py-2 rounded-xl border border-gray-600 bg-gray-700/50 text-white text-sm"
                  >
                    <option value="baixa">Baixa</option>
                    <option value="normal">Normal</option>
                    <option value="alta">Alta</option>
                    <option value="urgente">Urgente</option>
                  </select>
                </div>
              </div>

              {formData.motivo === 'custom' ? (
                <div>
                  <Label>Qual intenção?</Label>
                  <Input
                    value={customIntention}
                    onChange={(e) => setCustomIntention(e.target.value)}
                    placeholder="Digite o tipo de intenção..."
                  />
                </div>
              ) : null}

              <div>
                <Label>Assunto</Label>
                <Input
                  value={formData.assunto}
                  onChange={(e) => setFormData({ ...formData, assunto: e.target.value })}
                  placeholder="Ex: Intenção para a missa de domingo"
                />
              </div>

              <div>
                <Label>Observação</Label>
                <textarea
                  value={formData.observacao}
                  onChange={(e) => setFormData({ ...formData, observacao: e.target.value })}
                  placeholder="Detalhes adicionais..."
                  rows={3}
                  className="w-full px-4 py-2 rounded-xl border border-gray-600 bg-gray-700/50 text-white text-sm resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => { setShowCreateIntencaoModal(false); setCustomIntention(''); }}>
                  Cancelar
                </Button>
                <Button 
                  className="flex-1" 
                  onClick={handleCreateIntencao}
                  disabled={
                    isSaving ||
                    !formData.nome ||
                    !formData.telefone ||
                    !formData.motivo ||
                    (formData.motivo === 'custom' && !customIntention.trim())
                  }
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                  Criar Intenção
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create Aviso Modal */}
      {!isReadOnly && showCreateAvisoModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white">Novo Aviso</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowCreateAvisoModal(false)}>
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nome *</Label>
                  <Input
                    value={avisoFormData.nome}
                    onChange={(e) => setAvisoFormData({ ...avisoFormData, nome: e.target.value })}
                    placeholder="Nome completo"
                  />
                </div>
                <div>
                  <Label>Telefone *</Label>
                  <Input
                    value={avisoFormData.telefone}
                    onChange={(e) => setAvisoFormData({ ...avisoFormData, telefone: e.target.value })}
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>

              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={avisoFormData.email}
                  onChange={(e) => setAvisoFormData({ ...avisoFormData, email: e.target.value })}
                  placeholder="email@exemplo.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Assunto *</Label>
                  <Input
                    value={avisoFormData.assunto}
                    onChange={(e) => setAvisoFormData({ ...avisoFormData, assunto: e.target.value })}
                    placeholder="Ex: Aviso para o padre"
                  />
                </div>
                <div>
                  <Label>Prioridade</Label>
                  <select
                    value={avisoFormData.prioridade}
                    onChange={(e) => setAvisoFormData({ ...avisoFormData, prioridade: e.target.value as TicketPrioridade })}
                    className="w-full px-4 py-2 rounded-xl border border-gray-600 bg-gray-700/50 text-white text-sm"
                  >
                    <option value="baixa">Baixa</option>
                    <option value="normal">Normal</option>
                    <option value="alta">Alta</option>
                    <option value="urgente">Urgente</option>
                  </select>
                </div>
              </div>

              <div>
                <Label>Observação</Label>
                <textarea
                  value={avisoFormData.observacao}
                  onChange={(e) => setAvisoFormData({ ...avisoFormData, observacao: e.target.value })}
                  placeholder="Detalhes adicionais..."
                  rows={3}
                  className="w-full px-4 py-2 rounded-xl border border-gray-600 bg-gray-700/50 text-white text-sm resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setShowCreateAvisoModal(false)}>
                  Cancelar
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleCreateAviso}
                  disabled={isSaving || !avisoFormData.nome || !avisoFormData.telefone || !avisoFormData.assunto}
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                  Criar Aviso
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Modal */}
      {!isReadOnly && editingTicket && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white">Editar</CardTitle>
              <Button variant="ghost" size="sm" onClick={closeEdit}>
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>

            <CardContent className="space-y-4">
              {categoryOf(editingTicket) === MASS_INTENTION_CATEGORY ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Nome *</Label>
                      <Input
                        value={editFormData.nome}
                        onChange={(e) => setEditFormData({ ...editFormData, nome: e.target.value })}
                        placeholder="Nome completo"
                      />
                    </div>
                    <div>
                      <Label>Telefone *</Label>
                      <Input
                        value={editFormData.telefone}
                        onChange={(e) => setEditFormData({ ...editFormData, telefone: e.target.value })}
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={editFormData.email}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                      placeholder="email@exemplo.com"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Intenção *</Label>
                      <select
                        value={editFormData.motivo}
                        onChange={(e) => setEditFormData({ ...editFormData, motivo: e.target.value })}
                        className="w-full px-4 py-2 rounded-xl border border-gray-600 bg-gray-700/50 text-white text-sm"
                      >
                        <option value="">Selecione...</option>
                        {massIntentionOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label>Prioridade</Label>
                      <select
                        value={editFormData.prioridade}
                        onChange={(e) => setEditFormData({ ...editFormData, prioridade: e.target.value as TicketPrioridade })}
                        className="w-full px-4 py-2 rounded-xl border border-gray-600 bg-gray-700/50 text-white text-sm"
                      >
                        <option value="baixa">Baixa</option>
                        <option value="normal">Normal</option>
                        <option value="alta">Alta</option>
                        <option value="urgente">Urgente</option>
                      </select>
                    </div>
                  </div>

                  {editFormData.motivo === 'custom' ? (
                    <div>
                      <Label>Qual intenção?</Label>
                      <Input
                        value={editCustomIntention}
                        onChange={(e) => setEditCustomIntention(e.target.value)}
                        placeholder="Digite o tipo de intenção..."
                      />
                    </div>
                  ) : null}

                  <div>
                    <Label>Assunto</Label>
                    <Input
                      value={editFormData.assunto}
                      onChange={(e) => setEditFormData({ ...editFormData, assunto: e.target.value })}
                      placeholder="Ex: Intenção para a missa de domingo"
                    />
                  </div>

                  <div>
                    <Label>Observação</Label>
                    <textarea
                      value={editFormData.observacao}
                      onChange={(e) => setEditFormData({ ...editFormData, observacao: e.target.value })}
                      placeholder="Detalhes adicionais..."
                      rows={3}
                      className="w-full px-4 py-2 rounded-xl border border-gray-600 bg-gray-700/50 text-white text-sm resize-none"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button variant="outline" className="flex-1" onClick={closeEdit}>
                      Cancelar
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={handleUpdateTicket}
                      disabled={
                        isSaving ||
                        !editFormData.nome ||
                        !editFormData.telefone ||
                        !editFormData.motivo ||
                        (editFormData.motivo === 'custom' && !editCustomIntention.trim())
                      }
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Pencil className="w-4 h-4 mr-2" />}
                      Salvar
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Nome *</Label>
                      <Input
                        value={editAvisoFormData.nome}
                        onChange={(e) => setEditAvisoFormData({ ...editAvisoFormData, nome: e.target.value })}
                        placeholder="Nome completo"
                      />
                    </div>
                    <div>
                      <Label>Telefone *</Label>
                      <Input
                        value={editAvisoFormData.telefone}
                        onChange={(e) => setEditAvisoFormData({ ...editAvisoFormData, telefone: e.target.value })}
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={editAvisoFormData.email}
                      onChange={(e) => setEditAvisoFormData({ ...editAvisoFormData, email: e.target.value })}
                      placeholder="email@exemplo.com"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Assunto *</Label>
                      <Input
                        value={editAvisoFormData.assunto}
                        onChange={(e) => setEditAvisoFormData({ ...editAvisoFormData, assunto: e.target.value })}
                        placeholder="Ex: Aviso para o padre"
                      />
                    </div>
                    <div>
                      <Label>Prioridade</Label>
                      <select
                        value={editAvisoFormData.prioridade}
                        onChange={(e) => setEditAvisoFormData({ ...editAvisoFormData, prioridade: e.target.value as TicketPrioridade })}
                        className="w-full px-4 py-2 rounded-xl border border-gray-600 bg-gray-700/50 text-white text-sm"
                      >
                        <option value="baixa">Baixa</option>
                        <option value="normal">Normal</option>
                        <option value="alta">Alta</option>
                        <option value="urgente">Urgente</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <Label>Observação</Label>
                    <textarea
                      value={editAvisoFormData.observacao}
                      onChange={(e) => setEditAvisoFormData({ ...editAvisoFormData, observacao: e.target.value })}
                      placeholder="Detalhes adicionais..."
                      rows={3}
                      className="w-full px-4 py-2 rounded-xl border border-gray-600 bg-gray-700/50 text-white text-sm resize-none"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button variant="outline" className="flex-1" onClick={closeEdit}>
                      Cancelar
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={handleUpdateTicket}
                      disabled={isSaving || !editAvisoFormData.nome || !editAvisoFormData.telefone || !editAvisoFormData.assunto}
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Pencil className="w-4 h-4 mr-2" />}
                      Salvar
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Ticket Details Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between border-b border-gray-700/50">
              <div>
                <CardTitle className="text-white">{selectedTicket.nome}</CardTitle>
                <p className="text-sm text-gray-400">{formatPhone(selectedTicket.telefone)}</p>
              </div>
              <div className="flex items-center gap-2">
                {!isReadOnly ? (
                  <select
                    value={selectedTicket.status}
                    onChange={(e) => handleUpdateStatus(selectedTicket.id, e.target.value as TicketStatus)}
                    className="px-3 py-1 rounded-lg border border-gray-600 bg-gray-700/50 text-white text-sm"
                  >
                    <option value="pendente">Pendente</option>
                    <option value="em_andamento">Em Andamento</option>
                    <option value="aguardando_resposta">Aguardando Resposta</option>
                    <option value="resolvido">Resolvido</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                ) : null}
                <Button variant="ghost" size="sm" onClick={() => setSelectedTicket(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Ticket Info */}
              <div className="bg-gray-700/30 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Motivo:</span>
                  <span className="text-white font-medium">{selectedTicket.motivo}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Prioridade:</span>
                  <span className={prioridadeConfig[selectedTicket.prioridade].color}>
                    {prioridadeConfig[selectedTicket.prioridade].label}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Criado em:</span>
                  <span className="text-white">{formatDate(selectedTicket.created_at)}</span>
                </div>
                {selectedTicket.observacao && (
                  <div className="pt-2 border-t border-gray-600">
                    <span className="text-gray-400 text-sm">Observação:</span>
                    <p className="text-white mt-1">{selectedTicket.observacao}</p>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              {!isReadOnly ? (
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => window.open(`https://wa.me/${selectedTicket.telefone.replace(/\D/g, '')}`, '_blank')}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    WhatsApp
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => window.open(`tel:${selectedTicket.telefone}`, '_blank')}
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Ligar
                  </Button>
                  {selectedTicket.email && (
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => window.open(`mailto:${selectedTicket.email}`, '_blank')}
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Email
                    </Button>
                  )}
                </div>
              ) : null}

              {/* Messages */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-400">Histórico de Mensagens</h4>
                {ticketMessages.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">Nenhuma mensagem ainda</p>
                ) : (
                  ticketMessages.map((msg) => (
                    <div 
                      key={msg.id} 
                      className={`p-3 rounded-xl ${
                        msg.autor_tipo === 'atendente' 
                          ? 'bg-purple-500/20 ml-8' 
                          : 'bg-gray-700/50 mr-8'
                      }`}
                    >
                      <p className="text-white text-sm">{msg.conteudo}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {msg.autor_nome || msg.autor_tipo} • {formatDate(msg.created_at)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>

            {/* Message Input */}
            {!isReadOnly ? (
              <div className="p-4 border-t border-gray-700/50">
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Digite uma nota ou mensagem..."
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <Button onClick={handleSendMessage} disabled={isSending || !newMessage.trim()}>
                    {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            ) : null}
          </Card>
        </div>
      )}
    </div>
  );
}
