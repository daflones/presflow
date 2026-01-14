import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, CalendarDays, CalendarCheck, Loader2 } from 'lucide-react';
import { calendarService, serviceAppointmentsService } from '../../services/supabase';
import type { CalendarEvent, ServiceAppointment } from '../../types/database';

export function CalendarWidget() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [appointments, setAppointments] = useState<ServiceAppointment[]>([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setIsLoading(true);
        const [ev, ap] = await Promise.all([
          calendarService.getAll(),
          serviceAppointmentsService.getAll(),
        ]);
        if (!mounted) return;
        setEvents(ev || []);
        setAppointments(ap || []);
      } catch {
        if (!mounted) return;
        setEvents([]);
        setAppointments([]);
      } finally {
        if (!mounted) return;
        setIsLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const calendarData = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const startOfWeek = new Date(startOfDay);
    const day = startOfWeek.getDay();
    const diffToMonday = (day + 6) % 7;
    startOfWeek.setDate(startOfWeek.getDate() - diffToMonday);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const items: Date[] = [];
    for (const e of events) {
      const d = new Date(e.start_at);
      if (!Number.isNaN(d.getTime())) items.push(d);
    }
    for (const a of appointments) {
      const d = new Date(a.data_agendamento);
      if (!Number.isNaN(d.getTime())) items.push(d);
    }

    const todayCount = items.filter((d) => d >= startOfDay && d <= endOfDay).length;
    const weekCount = items.filter((d) => d >= startOfWeek && d <= endOfWeek).length;
    const futureCount = items.filter((d) => d > endOfDay).length;
    const total = items.length;

    return [
      { label: 'Hoje', value: todayCount, icon: Calendar, color: 'text-blue-400' },
      { label: 'Esta semana', value: weekCount, icon: CalendarDays, color: 'text-purple-400' },
      { label: 'Futuros', value: futureCount, icon: Clock, color: 'text-yellow-400' },
      { label: 'Total', value: total, icon: CalendarCheck, color: 'text-green-400' },
    ];
  }, [events, appointments]);

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700/50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <Calendar className="w-5 h-5 text-purple-400" />
          </div>
          <h2 className="font-semibold text-white">Calendário</h2>
        </div>
        <button
          type="button"
          onClick={() => navigate('/calendario')}
          className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
        >
          Ver Todos
        </button>
      </div>
      {isLoading ? (
        <div className="h-[140px] flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {calendarData.map((item) => (
            <div
              key={item.label}
              className="p-4 rounded-xl bg-gray-700/50 border border-gray-600/30 text-center hover:border-purple-500/30 transition-all"
            >
              <item.icon className={`w-5 h-5 mx-auto mb-2 ${item.color}`} />
              <p className="text-xs text-gray-400">{item.label}</p>
              <p className="text-2xl font-bold text-white mt-1">{item.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
