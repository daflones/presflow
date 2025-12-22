import { Calendar, Clock, CalendarDays, CalendarCheck } from 'lucide-react';

const calendarData = [
    { label: 'Eventos hoje', value: 0, icon: Calendar, color: 'text-blue-400' },
    { label: 'Esta semana', value: 0, icon: CalendarDays, color: 'text-purple-400' },
    { label: 'Futuros', value: 0, icon: Clock, color: 'text-yellow-400' },
    { label: 'Todos eventos', value: 0, icon: CalendarCheck, color: 'text-green-400' },
]

export function CalendarWidget() {
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700/50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <Calendar className="w-5 h-5 text-purple-400" />
          </div>
          <h2 className="font-semibold text-white">Calendário</h2>
        </div>
        <button className="text-sm text-purple-400 hover:text-purple-300 transition-colors">Ver Todos</button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {calendarData.map(item => (
            <div key={item.label} className='p-4 rounded-xl bg-gray-700/50 border border-gray-600/30 text-center hover:border-purple-500/30 transition-all'>
                <item.icon className={`w-5 h-5 mx-auto mb-2 ${item.color}`} />
                <p className='text-xs text-gray-400'>{item.label}</p>
                <p className='text-2xl font-bold text-white mt-1'>{item.value}</p>
            </div>
        ))}
      </div>
    </div>
  );
}
