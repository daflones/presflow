import { useEffect, useMemo, useState, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import { calendarService, clientsService } from '../services/supabase';
import type { CalendarEvent as DbCalendarEvent, Client } from '../types/database';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import type { DateSelectArg, EventClickArg, EventInput, EventDropArg } from '@fullcalendar/core';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';
import { CalendarPlus, Pencil, Trash2, X, UserRound, Search } from 'lucide-react';

type CalendarEvent = {
  id: string;
  title: string;
  start: string;
  end?: string;
  allDay?: boolean;
  location?: string;
  notes?: string;
  color?: string;
  cliente_id?: string;
};

// Converter do formato do banco para o formato local
function dbEventToLocal(e: DbCalendarEvent): CalendarEvent {
  return {
    id: e.id,
    title: e.title,
    start: e.start_at,
    end: e.end_at || undefined,
    allDay: e.all_day,
    location: e.location || undefined,
    notes: e.notes || undefined,
    color: e.color,
    cliente_id: e.cliente_id || undefined,
  };
}

const EVENT_COLORS = [
  { value: '#3b82f6', label: 'Azul' },
  { value: '#8b5cf6', label: 'Roxo' },
  { value: '#ec4899', label: 'Rosa' },
  { value: '#f59e0b', label: 'Laranja' },
  { value: '#10b981', label: 'Verde' },
  { value: '#ef4444', label: 'Vermelho' },
  { value: '#6366f1', label: 'Índigo' },
  { value: '#14b8a6', label: 'Turquesa' },
];

function toLocalInputValue(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const min = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

export function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [_isLoading, setIsLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  const [formTitle, setFormTitle] = useState('');
  const [formStart, setFormStart] = useState('');
  const [formEnd, setFormEnd] = useState('');
  const [formAllDay, setFormAllDay] = useState(false);
  const [formLocation, setFormLocation] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formColor, setFormColor] = useState('#3b82f6');
  const [formClienteId, setFormClienteId] = useState<string>('');
  const [clientSearch, setClientSearch] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);

  // Carregar eventos e clientes do Supabase
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [eventsData, clientsData] = await Promise.all([
        calendarService.getAll(),
        clientsService.getAll(),
      ]);
      setEvents(eventsData.map(dbEventToLocal));
      setClients(clientsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtrar clientes pela busca
  const filteredClients = useMemo(() => {
    if (!clientSearch.trim()) return clients.slice(0, 10);
    const search = clientSearch.toLowerCase();
    return clients.filter(c => 
      c.name.toLowerCase().includes(search) ||
      c.phone?.toLowerCase().includes(search) ||
      c.email?.toLowerCase().includes(search)
    ).slice(0, 10);
  }, [clients, clientSearch]);

  // Obter cliente selecionado
  const selectedClient = useMemo(() => {
    if (!formClienteId) return null;
    return clients.find(c => c.id === formClienteId) || null;
  }, [clients, formClienteId]);

  const fcEvents: EventInput[] = useMemo(() => {
    return events.map((e) => ({
      id: e.id,
      title: e.title,
      start: e.start,
      end: e.end,
      allDay: e.allDay,
      backgroundColor: e.color || '#3b82f6',
      borderColor: e.color || '#3b82f6',
      extendedProps: {
        location: e.location,
        notes: e.notes,
      },
    }));
  }, [events]);

  function openCreateFromSelect(arg: DateSelectArg) {
    setEditingEventId(null);
    setFormTitle('');
    setFormAllDay(arg.allDay);

    if (arg.allDay) {
      const start = new Date(arg.start);
      start.setHours(9, 0, 0, 0);
      const end = new Date(arg.start);
      end.setHours(10, 0, 0, 0);
      setFormStart(toLocalInputValue(start.toISOString()));
      setFormEnd(toLocalInputValue(end.toISOString()));
    } else {
      setFormStart(toLocalInputValue(arg.start.toISOString()));
      setFormEnd(arg.end ? toLocalInputValue(arg.end.toISOString()) : '');
    }

    setFormLocation('');
    setFormNotes('');
    setFormColor('#3b82f6');
    setFormClienteId('');
    setClientSearch('');
    setShowClientDropdown(false);
    setIsModalOpen(true);
  }

  function openEditFromClick(arg: EventClickArg) {
    const found = events.find((e) => e.id === arg.event.id);
    if (!found) return;
    setEditingEventId(found.id);
    setFormTitle(found.title);
    setFormAllDay(Boolean(found.allDay));
    setFormStart(toLocalInputValue(found.start));
    setFormEnd(found.end ? toLocalInputValue(found.end) : '');
    setFormLocation(found.location ?? '');
    setFormNotes(found.notes ?? '');
    setFormColor(found.color || '#3b82f6');
    setFormClienteId(found.cliente_id ?? '');
    setClientSearch('');
    setShowClientDropdown(false);
    setIsModalOpen(true);
  }

  function resetModal() {
    setIsModalOpen(false);
    setEditingEventId(null);
  }

  async function submitEvent() {
    const title = formTitle.trim();
    if (!title) return;
    if (!formStart) return;

    const startIso = new Date(formStart).toISOString();
    const endIso = formEnd ? new Date(formEnd).toISOString() : undefined;

    try {
      if (!editingEventId) {
        // Criar novo evento
        const created = await calendarService.create({
          title,
          start_at: startIso,
          end_at: endIso,
          all_day: formAllDay,
          location: formLocation.trim() || undefined,
          notes: formNotes.trim() || undefined,
          color: formColor,
          cliente_id: formClienteId || undefined,
        });
        setEvents((prev) => [dbEventToLocal(created), ...prev]);
      } else {
        // Atualizar evento existente
        const updated = await calendarService.update(editingEventId, {
          title,
          start_at: startIso,
          end_at: endIso,
          all_day: formAllDay,
          location: formLocation.trim() || undefined,
          notes: formNotes.trim() || undefined,
          color: formColor,
          cliente_id: formClienteId || undefined,
        });
        setEvents((prev) =>
          prev.map((e) => (e.id === editingEventId ? dbEventToLocal(updated) : e))
        );
      }
      resetModal();
    } catch (error) {
      console.error('Erro ao salvar evento:', error);
      alert('Erro ao salvar evento. Tente novamente.');
    }
  }

  async function removeEvent(id: string) {
    const current = events.find((e) => e.id === id);
    const ok = window.confirm(`Apagar o evento "${current?.title ?? 'selecionado'}"?`);
    if (!ok) return;
    
    try {
      await calendarService.delete(id);
      setEvents((prev) => prev.filter((e) => e.id !== id));
      resetModal();
    } catch (error) {
      console.error('Erro ao remover evento:', error);
      alert('Erro ao remover evento. Tente novamente.');
    }
  }

  async function handleEventDrop(arg: EventDropArg) {
    const eventId = arg.event.id;
    const newStart = arg.event.start?.toISOString();
    const newEnd = arg.event.end?.toISOString();

    if (!newStart) return;

    try {
      const updated = await calendarService.update(eventId, {
        start_at: newStart,
        end_at: newEnd,
        all_day: arg.event.allDay,
      });
      setEvents((prev) =>
        prev.map((e) => (e.id === eventId ? dbEventToLocal(updated) : e))
      );
    } catch (error) {
      console.error('Erro ao mover evento:', error);
      // Reverter a mudança visual
      arg.revert();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendário</h1>
          <p className="text-sm text-gray-500">Visualize, crie e gerencie seus eventos.</p>
        </div>

        <button
          onClick={() => {
            const now = new Date();
            const end = new Date(now.getTime() + 60 * 60 * 1000);
            openCreateFromSelect({
              start: now,
              end,
              startStr: now.toISOString(),
              endStr: end.toISOString(),
              allDay: false,
              jsEvent: null as unknown as MouseEvent,
              view: null as unknown as any,
            });
          }}
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
        >
          <CalendarPlus className="h-4 w-4" />
          Novo evento
        </button>
      </div>

      <div className="rounded-xl border border-gray-200/50 bg-white/80 backdrop-blur-xl p-6 shadow-xl">
        <style>{`
          .fc {
            font-family: inherit;
          }
          .fc .fc-toolbar-title {
            font-size: 1.5rem;
            font-weight: 700;
            color: #111827;
          }
          .fc .fc-button {
            background: white;
            border: 1px solid #e5e7eb;
            color: #374151;
            font-weight: 500;
            text-transform: capitalize;
            padding: 0.5rem 1rem;
            border-radius: 0.5rem;
            transition: all 0.2s;
          }
          .fc .fc-button:hover {
            background: #f3f4f6;
            border-color: #d1d5db;
          }
          .fc .fc-button-primary:not(:disabled):active,
          .fc .fc-button-primary:not(:disabled).fc-button-active {
            background: #2563eb;
            border-color: #2563eb;
            color: white;
          }
          .fc .fc-button:disabled {
            opacity: 0.4;
          }
          .fc-theme-standard td,
          .fc-theme-standard th {
            border-color: #f3f4f6;
          }
          .fc-theme-standard .fc-scrollgrid {
            border-color: #e5e7eb;
          }
          .fc .fc-daygrid-day-number {
            color: #374151;
            font-weight: 500;
            padding: 0.5rem;
          }
          .fc .fc-col-header-cell-cushion {
            color: #6b7280;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 0.75rem;
            letter-spacing: 0.05em;
            padding: 0.75rem 0;
          }
          .fc .fc-daygrid-day.fc-day-today {
            background: #eff6ff !important;
          }
          .fc .fc-event {
            border-radius: 0.375rem;
            padding: 0.25rem 0.5rem;
            font-weight: 500;
            font-size: 0.875rem;
            border: none;
            cursor: pointer;
            transition: all 0.2s;
          }
          .fc .fc-event:hover {
            opacity: 0.9;
            transform: translateY(-1px);
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }
          .fc .fc-daygrid-event-dot {
            display: none;
          }
          .fc .fc-h-event {
            border: none;
          }
        `}</style>
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,listWeek',
          }}
          buttonText={{
            today: 'Hoje',
            month: 'Mês',
            week: 'Semana',
            day: 'Dia',
            list: 'Lista',
          }}
          height="auto"
          locale={ptBrLocale}
          selectable
          selectMirror
          dayMaxEvents={3}
          nowIndicator
          editable
          droppable
          eventDrop={handleEventDrop}
          events={fcEvents}
          select={openCreateFromSelect}
          eventClick={openEditFromClick}
          eventTimeFormat={{
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          }}
          slotLabelFormat={{
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          }}
        />
      </div>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                  {editingEventId ? <Pencil className="h-4 w-4" /> : <CalendarPlus className="h-4 w-4" />}
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">{editingEventId ? 'Editar evento' : 'Novo evento'}</h2>
                  <p className="text-sm text-gray-500">Clique em um dia para criar, clique no evento para editar.</p>
                </div>
              </div>

              <button onClick={resetModal} className="rounded-md p-2 text-gray-500 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div>
                <label className="text-sm font-semibold text-gray-700">Título</label>
                <input
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Ex: Reunião de liderança"
                  className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold text-gray-700">Início</label>
                  <input
                    type="datetime-local"
                    value={formStart}
                    onChange={(e) => setFormStart(e.target.value)}
                    className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">Fim</label>
                  <input
                    type="datetime-local"
                    value={formEnd}
                    onChange={(e) => setFormEnd(e.target.value)}
                    className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  />
                  <p className="mt-1 text-xs text-gray-500">Opcional</p>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border bg-gray-50 px-3 py-2">
                <div>
                  <p className="text-sm font-semibold text-gray-800">Dia inteiro</p>
                  <p className="text-xs text-gray-500">Use para aniversários, retiros, campanhas etc.</p>
                </div>
                <input
                  type="checkbox"
                  checked={formAllDay}
                  onChange={(e) => setFormAllDay(e.target.checked)}
                  className="h-5 w-5 rounded border-gray-300"
                />
              </div>

              {/* Seleção de Cliente */}
              <div className="relative">
                <label className="text-sm font-semibold text-gray-700">Cliente (opcional)</label>
                {selectedClient ? (
                  <div className="mt-1 flex items-center justify-between rounded-md border border-blue-200 bg-blue-50 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <UserRound className="h-4 w-4 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{selectedClient.name}</p>
                        {selectedClient.phone && (
                          <p className="text-xs text-gray-500">{selectedClient.phone}</p>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setFormClienteId('');
                        setClientSearch('');
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="relative mt-1">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <input
                      value={clientSearch}
                      onChange={(e) => {
                        setClientSearch(e.target.value);
                        setShowClientDropdown(true);
                      }}
                      onFocus={() => setShowClientDropdown(true)}
                      placeholder="Buscar cliente por nome, telefone..."
                      className="w-full rounded-md border border-gray-200 pl-9 pr-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                    />
                    {showClientDropdown && filteredClients.length > 0 && (
                      <div className="absolute z-10 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg max-h-48 overflow-y-auto">
                        {filteredClients.map((client) => (
                          <button
                            key={client.id}
                            type="button"
                            onClick={() => {
                              setFormClienteId(client.id);
                              setClientSearch('');
                              setShowClientDropdown(false);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50"
                          >
                            <UserRound className="h-4 w-4 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{client.name}</p>
                              <p className="text-xs text-gray-500">
                                {client.phone || client.email || 'Sem contato'}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700">Local</label>
                <input
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  placeholder="Ex: Templo principal"
                  className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700">Notas</label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  rows={3}
                  placeholder="Informações internas..."
                  className="mt-1 w-full resize-none rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Cor do Evento</label>
                <div className="flex flex-wrap gap-2">
                  {EVENT_COLORS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setFormColor(color.value)}
                      className={`w-10 h-10 rounded-lg transition-all duration-200 ${
                        formColor === color.value
                          ? 'ring-2 ring-offset-2 ring-gray-400 scale-110'
                          : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.label}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 border-t bg-gray-50 px-5 py-4">
              <div>
                {editingEventId ? (
                  <button
                    onClick={() => removeEvent(editingEventId)}
                    className="inline-flex items-center gap-2 rounded-md border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    Apagar
                  </button>
                ) : null}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={resetModal}
                  className="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  disabled={!formTitle.trim() || !formStart}
                  onClick={submitEvent}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                >
                  {editingEventId ? 'Salvar alterações' : 'Criar evento'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
