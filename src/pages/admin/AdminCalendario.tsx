import { useEffect, useState, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { EventClickArg, DateSelectArg } from '@fullcalendar/core';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';
import { Calendar, Church, Search, X, Eye } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { CalendarEvent as DbCalendarEvent, Church as ChurchType } from '../../types/database';
import { adminService } from '../../services/supabase/admin';

type CalendarEvent = {
  id: string;
  title: string;
  start: string;
  end?: string;
  backgroundColor?: string;
  borderColor?: string;
  extendedProps?: {
    description?: string;
    location?: string;
    church_id: string;
    church_name?: string;
    cliente_id?: string;
  };
};

function dbEventToLocal(e: DbCalendarEvent, churchName?: string): CalendarEvent {
  const churchColors: Record<string, { bg: string; border: string }> = {
    default: { bg: '#8B5CF6', border: '#7C3AED' },
  };

  const colors = churchColors.default;

  return {
    id: e.id,
    title: e.title,
    start: e.start_at,
    end: e.end_at || undefined,
    backgroundColor: colors.bg,
    borderColor: colors.border,
    extendedProps: {
      description: e.description || undefined,
      location: e.location || undefined,
      church_id: e.church_id,
      church_name: churchName,
      cliente_id: e.cliente_id || undefined,
    },
  };
}

export function AdminCalendario() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [churches, setChurches] = useState<ChurchType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedChurch, setSelectedChurch] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);
    try {
      // Carregar igrejas
      const churchesData = await adminService.listChurches();
      setChurches(churchesData);

      // Carregar eventos de todas as igrejas
      const { data: eventsData, error } = await supabase
        .from('calendar_events')
        .select('*')
        .order('start_at', { ascending: true });

      if (error) throw error;

      // Mapear eventos com nome da igreja
      const eventsWithChurch = (eventsData || []).map((event) => {
        const church = churchesData.find((c) => c.id === event.church_id);
        return dbEventToLocal(event, church?.name);
      });

      setEvents(eventsWithChurch);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const filteredEvents = useMemo(() => {
    let filtered = events;

    // Filtrar por igreja
    if (selectedChurch !== 'all') {
      filtered = filtered.filter((e) => e.extendedProps?.church_id === selectedChurch);
    }

    // Filtrar por busca
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.title.toLowerCase().includes(search) ||
          e.extendedProps?.description?.toLowerCase().includes(search) ||
          e.extendedProps?.church_name?.toLowerCase().includes(search)
      );
    }

    return filtered;
  }, [events, selectedChurch, searchTerm]);

  function handleEventClick(clickInfo: EventClickArg) {
    const event = events.find((e) => e.id === clickInfo.event.id);
    if (event) {
      setSelectedEvent(event);
    }
  }

  function formatDateTime(dateStr: string) {
    return new Date(dateStr).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Calendário Geral</h1>
          <p className="text-gray-400 mt-1">Visualize eventos de todas as igrejas</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar eventos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Church Filter */}
          <div className="relative">
            <Church className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              value={selectedChurch}
              onChange={(e) => setSelectedChurch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">Todas as Igrejas</option>
              {churches.map((church) => (
                <option key={church.id} value={church.id}>
                  {church.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 flex items-center gap-4 text-sm text-gray-400">
          <span>Total de eventos: {filteredEvents.length}</span>
          {selectedChurch !== 'all' && (
            <span>
              Igreja: {churches.find((c) => c.id === selectedChurch)?.name}
            </span>
          )}
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          </div>
        ) : (
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            locale={ptBrLocale}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay',
            }}
            events={filteredEvents}
            eventClick={handleEventClick}
            height="auto"
            eventTimeFormat={{
              hour: '2-digit',
              minute: '2-digit',
              meridiem: false,
            }}
            slotLabelFormat={{
              hour: '2-digit',
              minute: '2-digit',
              meridiem: false,
            }}
          />
        )}
      </div>

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl border border-gray-700 max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Eye className="h-5 w-5 text-purple-400" />
                Detalhes do Evento
              </h2>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-400">Título</label>
                <p className="text-white mt-1">{selectedEvent.title}</p>
              </div>

              {selectedEvent.extendedProps?.church_name && (
                <div>
                  <label className="text-sm font-medium text-gray-400">Igreja</label>
                  <p className="text-white mt-1 flex items-center gap-2">
                    <Church className="h-4 w-4 text-purple-400" />
                    {selectedEvent.extendedProps.church_name}
                  </p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-400">Início</label>
                <p className="text-white mt-1">{formatDateTime(selectedEvent.start)}</p>
              </div>

              {selectedEvent.end && (
                <div>
                  <label className="text-sm font-medium text-gray-400">Fim</label>
                  <p className="text-white mt-1">{formatDateTime(selectedEvent.end)}</p>
                </div>
              )}

              {selectedEvent.extendedProps?.location && (
                <div>
                  <label className="text-sm font-medium text-gray-400">Local</label>
                  <p className="text-white mt-1">{selectedEvent.extendedProps.location}</p>
                </div>
              )}

              {selectedEvent.extendedProps?.description && (
                <div>
                  <label className="text-sm font-medium text-gray-400">Descrição</label>
                  <p className="text-white mt-1">{selectedEvent.extendedProps.description}</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
