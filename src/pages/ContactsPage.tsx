import { useEffect, useMemo, useState, useCallback } from 'react';
import { Search, Plus, Pencil, Trash2, Eye, X, Phone, Mail, Tag, UserRound, Building2, LayoutGrid, List, Target, Heart, Sparkles, CalendarDays, Calendar } from 'lucide-react';
import { clientsService, calendarService } from '../services/supabase';
import type { Client as DbClient, ClientStatus, ClientCategory, CalendarEvent } from '../types/database';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, useDroppable } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type Client = DbClient;

function statusBadge(status: ClientStatus) {
  switch (status) {
    case 'ativo':
      return 'bg-emerald-50 text-emerald-700 ring-emerald-100';
    case 'lead':
      return 'bg-blue-50 text-blue-700 ring-blue-100';
    case 'inativo':
    default:
      return 'bg-gray-100 text-gray-700 ring-gray-200';
  }
}

function parseTags(value: string): string[] {
  return value
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
}

function formatPhone(value?: string) {
  if (!value) return '';
  return value;
}

const CATEGORIES: { id: ClientCategory; label: string; color: string }[] = [
  { id: 'lead', label: 'Lead', color: 'bg-blue-50 border-blue-200 text-blue-700' },
  { id: 'casamentos', label: 'Casamentos', color: 'bg-pink-50 border-pink-200 text-pink-700' },
  { id: 'batizados', label: 'Batizados', color: 'bg-cyan-50 border-cyan-200 text-cyan-700' },
  { id: 'ensaios-fotograficos', label: 'Ensaios Fotográficos', color: 'bg-purple-50 border-purple-200 text-purple-700' },
  { id: 'hospedagens', label: 'Hospedagens', color: 'bg-amber-50 border-amber-200 text-amber-700' },
  { id: 'turismo', label: 'Turismo', color: 'bg-green-50 border-green-200 text-green-700' },
];

function KanbanColumn({ 
  category, 
  clients, 
  children 
}: { 
  category: { id: ClientCategory; label: string; color: string }; 
  clients: Client[];
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: category.id });

  return (
    <div
      ref={setNodeRef}
      className={`rounded-lg border-2 p-3 transition-colors ${category.color} ${
        isOver ? 'border-solid border-blue-500 bg-blue-100' : 'border-dashed'
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold text-sm">{category.label}</h3>
        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold">
          {clients.length}
        </span>
      </div>
      <SortableContext items={clients.map(c => c.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2 min-h-[200px]">
          {children}
        </div>
      </SortableContext>
    </div>
  );
}

function KanbanCard({ client, onEdit, onDelete, onView }: { client: Client; onEdit: () => void; onDelete: () => void; onView: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: client.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="rounded-lg border bg-white p-3 shadow-sm hover:shadow-md transition-shadow cursor-move"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-600 flex-shrink-0">
            <UserRound className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-sm text-gray-900 truncate">{client.name}</h3>
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${statusBadge(client.status)}`}>
              {client.status === 'ativo' ? 'Ativo' : client.status === 'lead' ? 'Lead' : 'Inativo'}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-1 text-xs text-gray-600 mb-3">
        {client.phone && (
          <div className="flex items-center gap-1 truncate">
            <Phone className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{client.phone}</span>
          </div>
        )}
        {client.email && (
          <div className="flex items-center gap-1 truncate">
            <Mail className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{client.email}</span>
          </div>
        )}
      </div>

      {client.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {client.tags.slice(0, 2).map((t) => (
            <span key={`${client.id}_${t}`} className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
              {t}
            </span>
          ))}
          {client.tags.length > 2 && <span className="text-xs text-gray-500">+{client.tags.length - 2}</span>}
        </div>
      )}

      <div className="flex items-center gap-1 pt-2 border-t">
        <button
          onClick={(e) => { e.stopPropagation(); onView(); }}
          className="flex-1 text-xs px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 text-gray-700"
        >
          Ver
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          className="flex-1 text-xs px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 text-gray-700"
        >
          Editar
        </button>
      </div>
    </div>
  );
}

export function ContactsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [query, setQuery] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [clientEvents, setClientEvents] = useState<CalendarEvent[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);

  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formStatus, setFormStatus] = useState<ClientStatus>('lead');
  const [formCategory, setFormCategory] = useState<ClientCategory>('lead');
  const [formTags, setFormTags] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formInterest, setFormInterest] = useState('');
  const [formMotivation, setFormMotivation] = useState('');
  const [formExpectation, setFormExpectation] = useState('');
  const [formEventType, setFormEventType] = useState('');

  // Carregar clientes do Supabase
  const loadClients = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await clientsService.getAll();
      setClients(data);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  // Carregar eventos do cliente selecionado
  useEffect(() => {
    async function loadClientEvents() {
      if (!selectedClientId) {
        setClientEvents([]);
        return;
      }
      setIsLoadingEvents(true);
      try {
        const events = await calendarService.getByClienteId(selectedClientId);
        setClientEvents(events);
      } catch (error) {
        console.error('Erro ao carregar eventos do cliente:', error);
        setClientEvents([]);
      } finally {
        setIsLoadingEvents(false);
      }
    }
    loadClientEvents();
  }, [selectedClientId]);

  const selectedClient = useMemo(() => {
    if (!selectedClientId) return null;
    return clients.find((c) => c.id === selectedClientId) ?? null;
  }, [clients, selectedClientId]);

  const filteredClients = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) => {
      const hay = [c.name, c.email ?? '', c.phone ?? '', c.status, ...c.tags].join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [clients, query]);

  function openCreate() {
    setEditingClientId(null);
    setFormName('');
    setFormPhone('');
    setFormEmail('');
    setFormStatus('lead');
    setFormCategory('lead');
    setFormTags('');
    setFormNotes('');
    setFormInterest('');
    setFormMotivation('');
    setFormExpectation('');
    setFormEventType('');
    setIsFormOpen(true);
  }

  function openEdit(client: Client) {
    setEditingClientId(client.id);
    setFormName(client.name);
    setFormPhone(client.phone ?? '');
    setFormEmail(client.email ?? '');
    setFormStatus(client.status);
    setFormCategory(client.category);
    setFormTags(client.tags.join(', '));
    setFormNotes(client.notes ?? '');
    setFormInterest(client.interest ?? '');
    setFormMotivation(client.motivation ?? '');
    setFormExpectation(client.expectation ?? '');
    setFormEventType(client.event_type ?? '');
    setIsFormOpen(true);
  }

  async function submitForm() {
    const name = formName.trim();
    if (!name) return;

    setIsSaving(true);
    try {
      const clientData = {
        name,
        phone: formPhone.trim() || undefined,
        email: formEmail.trim() || undefined,
        status: formStatus,
        category: formCategory,
        tags: parseTags(formTags),
        notes: formNotes.trim() || undefined,
        interest: formInterest.trim() || undefined,
        motivation: formMotivation.trim() || undefined,
        expectation: formExpectation.trim() || undefined,
        event_type: formEventType.trim() || undefined,
      };

      if (!editingClientId) {
        // Criar novo cliente
        const created = await clientsService.create(clientData);
        setClients((prev) => [created, ...prev]);
        setIsFormOpen(false);
        setSelectedClientId(created.id);
      } else {
        // Atualizar cliente existente
        const updated = await clientsService.update(editingClientId, clientData);
        setClients((prev) =>
          prev.map((c) => (c.id === editingClientId ? updated : c))
        );
        setIsFormOpen(false);
      }
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      alert('Erro ao salvar cliente. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  }

  async function removeClient(id: string) {
    const current = clients.find((c) => c.id === id);
    const ok = window.confirm(`Apagar o cliente "${current?.name ?? 'selecionado'}"?`);
    if (!ok) return;
    
    try {
      await clientsService.delete(id);
      setClients((prev) => prev.filter((c) => c.id !== id));
      setSelectedClientId((prev) => (prev === id ? null : prev));
    } catch (error) {
      console.error('Erro ao remover cliente:', error);
      alert('Erro ao remover cliente. Tente novamente.');
    }
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const draggedId = active.id as string;
    const overId = over.id as string;

    // Se foi solto em uma coluna (categoria)
    const targetCategory = CATEGORIES.find(cat => cat.id === overId);
    if (targetCategory) {
      try {
        const updated = await clientsService.updateCategory(draggedId, targetCategory.id);
        setClients(prev => prev.map(client => 
          client.id === draggedId ? updated : client
        ));
      } catch (error) {
        console.error('Erro ao atualizar categoria:', error);
      }
    }
  }

  const clientsByCategory = useMemo(() => {
    const grouped: Record<ClientCategory, Client[]> = {
      'lead': [],
      'casamentos': [],
      'batizados': [],
      'ensaios-fotograficos': [],
      'hospedagens': [],
      'turismo': [],
    };

    filteredClients.forEach(client => {
      // Se a categoria não existir ou for inválida, usar 'lead'
      const category = client.category && grouped[client.category] ? client.category : 'lead';
      grouped[category].push(client);
    });

    return grouped;
  }, [filteredClients]);

  const activeClient = activeId ? clients.find(c => c.id === activeId) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes / CRM</h1>
          <p className="text-sm text-gray-500">Crie, gerencie e acompanhe seus clientes e contatos.</p>
        </div>

        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Novo cliente
        </button>
      </div>

      <div className="rounded-xl border bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nome, telefone, email ou tag..."
              className="w-full rounded-md border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white p-1">
              <button
                onClick={() => setViewMode('table')}
                className={`inline-flex items-center gap-2 rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                  viewMode === 'table'
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <List className="h-4 w-4" />
                Tabela
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`inline-flex items-center gap-2 rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                  viewMode === 'kanban'
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
                Kanban
              </button>
            </div>
            <span className="rounded-md bg-gray-50 px-2 py-1 text-sm text-gray-500 ring-1 ring-gray-100">
              Total: <span className="font-semibold text-gray-900">{filteredClients.length}</span>
            </span>
          </div>
        </div>

        {viewMode === 'kanban' ? (
          <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="p-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {CATEGORIES.map((category) => (
                  <KanbanColumn
                    key={category.id}
                    category={category}
                    clients={clientsByCategory[category.id]}
                  >
                    {clientsByCategory[category.id].map((client) => (
                      <KanbanCard
                        key={client.id}
                        client={client}
                        onEdit={() => openEdit(client)}
                        onDelete={() => removeClient(client.id)}
                        onView={() => setSelectedClientId(client.id)}
                      />
                    ))}
                  </KanbanColumn>
                ))}
              </div>
            </div>
            <DragOverlay>
              {activeClient ? (
                <div className="rounded-lg border bg-white p-3 shadow-lg opacity-90">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                      <UserRound className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-gray-900">{activeClient.name}</h3>
                    </div>
                  </div>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Contato</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Tags</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-500">
                    Nenhum cliente encontrado.
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                          <UserRound className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{client.name}</div>
                          <div className="text-xs text-gray-500">Criado em {new Date(client.created_at).toLocaleDateString('pt-BR')}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-1 text-sm text-gray-700">
                        {client.phone ? (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <span>{formatPhone(client.phone)}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-gray-400">
                            <Phone className="h-4 w-4" />
                            <span>Sem telefone</span>
                          </div>
                        )}
                        {client.email ? (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span className="truncate">{client.email}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-gray-400">
                            <Mail className="h-4 w-4" />
                            <span>Sem email</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ring-1 ${statusBadge(client.status)}`}>
                        {client.status === 'ativo' ? 'Ativo' : client.status === 'lead' ? 'Lead' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {client.tags.length === 0 ? (
                        <span className="text-sm text-gray-400">—</span>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {client.tags.slice(0, 3).map((t) => (
                            <span
                              key={`${client.id}_${t}`}
                              className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700"
                            >
                              <Tag className="h-3 w-3 text-gray-400" />
                              {t}
                            </span>
                          ))}
                          {client.tags.length > 3 ? (
                            <span className="text-xs text-gray-500">+{client.tags.length - 3}</span>
                          ) : null}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedClientId(client.id)}
                          className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          <Eye className="h-4 w-4" />
                          Ver
                        </button>
                        <button
                          onClick={() => openEdit(client)}
                          className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          <Pencil className="h-4 w-4" />
                          Editar
                        </button>
                        <button
                          onClick={() => removeClient(client.id)}
                          className="inline-flex items-center gap-2 rounded-md border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          Apagar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            </table>
          </div>
        )}
      </div>

      {isFormOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                  <Building2 className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">{editingClientId ? 'Editar cliente' : 'Novo cliente'}</h2>
                  <p className="text-sm text-gray-500">Dados básicos e tags para segmentação.</p>
                </div>
              </div>

              <button
                onClick={() => setIsFormOpen(false)}
                className="rounded-md p-2 text-gray-500 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="text-sm font-semibold text-gray-700">Nome</label>
                  <input
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ex: Igreja Batista Central"
                    className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700">Telefone</label>
                  <input
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="Ex: +55 11 99999-9999"
                    className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700">Email</label>
                  <input
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="Ex: contato@igreja.com"
                    className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700">Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as ClientStatus)}
                    className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="lead">Lead</option>
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700">Categoria</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as ClientCategory)}
                    className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="sem-categoria">Sem Categoria</option>
                    <option value="eventos">Eventos</option>
                    <option value="casamentos">Casamentos</option>
                    <option value="festas">Festas</option>
                    <option value="compromissos">Compromissos</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700">Tags (separadas por vírgula)</label>
                  <input
                    value={formTags}
                    onChange={(e) => setFormTags(e.target.value)}
                    placeholder="Ex: lead, evento, pastoral"
                    className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-sm font-semibold text-gray-700">Observações</label>
                  <textarea
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Notas internas para a equipe..."
                    rows={3}
                    className="mt-1 w-full resize-none rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {/* Campos de Qualificação */}
                <div className="sm:col-span-2 pt-4 border-t">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Qualificação do Lead</h3>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700">Produto de Interesse</label>
                  <input
                    value={formInterest}
                    onChange={(e) => setFormInterest(e.target.value)}
                    placeholder="Ex: Casamento, Batizado..."
                    className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700">Tipo de Evento</label>
                  <input
                    value={formEventType}
                    onChange={(e) => setFormEventType(e.target.value)}
                    placeholder="Ex: Cerimônia religiosa..."
                    className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700">Motivação</label>
                  <input
                    value={formMotivation}
                    onChange={(e) => setFormMotivation(e.target.value)}
                    placeholder="O que motivou o contato..."
                    className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700">Expectativa</label>
                  <input
                    value={formExpectation}
                    onChange={(e) => setFormExpectation(e.target.value)}
                    placeholder="O que espera do serviço..."
                    className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t bg-gray-50 px-5 py-4">
              <button
                onClick={() => setIsFormOpen(false)}
                className="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                disabled={!formName.trim()}
                onClick={submitForm}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
              >
                {editingClientId ? 'Salvar alterações' : 'Criar cliente'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {selectedClient ? (
        <div className="fixed inset-0 z-40 flex justify-end bg-black/20">
          <button
            aria-label="Fechar detalhes"
            onClick={() => setSelectedClientId(null)}
            className="absolute inset-0 cursor-pointer"
          />
          <div className="relative h-full w-full max-w-xl overflow-y-auto bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-700">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{selectedClient.name}</h2>
                  <p className="text-sm text-gray-500">Detalhes do cliente</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedClientId(null)}
                className="rounded-md p-2 text-gray-500 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 p-5">
              {/* Info básica */}
              <div className="rounded-xl border bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ring-1 ${statusBadge(selectedClient.status)}`}>
                    {selectedClient.status === 'ativo' ? 'Ativo' : selectedClient.status === 'lead' ? 'Lead' : 'Inativo'}
                  </span>
                  <span className="text-xs text-gray-500">Criado em {new Date(selectedClient.created_at).toLocaleString('pt-BR')}</span>
                </div>

                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span>{selectedClient.phone ? formatPhone(selectedClient.phone) : 'Sem telefone cadastrado'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span>{selectedClient.email ? selectedClient.email : 'Sem email cadastrado'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Tag className="h-4 w-4 text-gray-400" />
                    <span>
                      {selectedClient.tags.length > 0 ? selectedClient.tags.join(', ') : 'Sem tags'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Interesse e Qualificação */}
              {(selectedClient.interest || selectedClient.motivation || selectedClient.expectation || selectedClient.event_type) && (
                <div className="rounded-xl border bg-white p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Qualificação do Cliente</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {selectedClient.interest && (
                      <div className="rounded-lg bg-blue-50 p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Target className="h-4 w-4 text-blue-600" />
                          <p className="text-xs font-semibold text-blue-700">Produto de Interesse</p>
                        </div>
                        <p className="text-sm text-gray-900">{selectedClient.interest}</p>
                      </div>
                    )}
                    {selectedClient.motivation && (
                      <div className="rounded-lg bg-pink-50 p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Heart className="h-4 w-4 text-pink-600" />
                          <p className="text-xs font-semibold text-pink-700">Motivação</p>
                        </div>
                        <p className="text-sm text-gray-900">{selectedClient.motivation}</p>
                      </div>
                    )}
                    {selectedClient.expectation && (
                      <div className="rounded-lg bg-purple-50 p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Sparkles className="h-4 w-4 text-purple-600" />
                          <p className="text-xs font-semibold text-purple-700">Expectativa</p>
                        </div>
                        <p className="text-sm text-gray-900">{selectedClient.expectation}</p>
                      </div>
                    )}
                    {selectedClient.event_type && (
                      <div className="rounded-lg bg-orange-50 p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <CalendarDays className="h-4 w-4 text-orange-600" />
                          <p className="text-xs font-semibold text-orange-700">Tipo de Evento</p>
                        </div>
                        <p className="text-sm text-gray-900">{selectedClient.event_type}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Observações */}
              <div className="rounded-xl border bg-white p-4">
                <h3 className="text-sm font-semibold text-gray-900">Observações</h3>
                <p className="mt-2 whitespace-pre-wrap text-sm text-gray-600">
                  {selectedClient.notes ? selectedClient.notes : 'Nenhuma observação cadastrada.'}
                </p>
              </div>

              {/* Informações adicionais */}
              <div className="rounded-xl border bg-white p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Informações Adicionais</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs font-semibold text-gray-600">Último contato</p>
                    <p className="mt-1 text-sm font-bold text-gray-900">
                      {selectedClient.last_contact_at 
                        ? new Date(selectedClient.last_contact_at).toLocaleDateString('pt-BR')
                        : '—'}
                    </p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs font-semibold text-gray-600">Origem</p>
                    <p className="mt-1 text-sm font-bold text-gray-900">{selectedClient.source || 'WhatsApp'}</p>
                  </div>
                  {selectedClient.church_name && (
                    <div className="rounded-lg bg-gray-50 p-3">
                      <p className="text-xs font-semibold text-gray-600">Nome da Igreja</p>
                      <p className="mt-1 text-sm font-bold text-gray-900">{selectedClient.church_name}</p>
                    </div>
                  )}
                  {selectedClient.segment && (
                    <div className="rounded-lg bg-gray-50 p-3">
                      <p className="text-xs font-semibold text-gray-600">Segmento</p>
                      <p className="mt-1 text-sm font-bold text-gray-900">{selectedClient.segment}</p>
                    </div>
                  )}
                  {selectedClient.monthly_volume && (
                    <div className="rounded-lg bg-gray-50 p-3">
                      <p className="text-xs font-semibold text-gray-600">Volume Mensal</p>
                      <p className="mt-1 text-sm font-bold text-gray-900">{selectedClient.monthly_volume}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Eventos/Agendamentos do Cliente */}
              <div className="rounded-xl border bg-white p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    Eventos/Agendamentos
                  </h3>
                  {clientEvents.length > 0 && (
                    <span className="text-xs text-gray-500">{clientEvents.length} evento(s)</span>
                  )}
                </div>
                {isLoadingEvents ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  </div>
                ) : clientEvents.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">Nenhum evento vinculado a este cliente.</p>
                ) : (
                  <div className="space-y-2">
                    {clientEvents.slice(0, 5).map((event) => (
                      <div
                        key={event.id}
                        className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <div
                          className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                          style={{ backgroundColor: event.color || '#3b82f6' }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{event.title}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(event.start_at).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                          {event.event_type && (
                            <span className="inline-flex items-center mt-1 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                              {event.event_type}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    {clientEvents.length > 5 && (
                      <p className="text-xs text-center text-gray-500 pt-2">
                        +{clientEvents.length - 5} evento(s) adicional(is)
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="sticky bottom-0 border-t bg-white p-4">
              <div className="flex flex-wrap items-center justify-end gap-2">
                <button
                  onClick={() => openEdit(selectedClient)}
                  className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  <Pencil className="h-4 w-4" />
                  Editar
                </button>
                <button
                  onClick={() => removeClient(selectedClient.id)}
                  className="inline-flex items-center gap-2 rounded-md border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Apagar
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
