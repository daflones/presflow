const calendarData = [
    { label: 'Eventos hoje', value: 0 },
    { label: 'Esta semana', value: 0 },
    { label: 'Futuros', value: 0 },
    { label: 'Todos eventos', value: 0 },
]

export function CalendarWidget() {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-700">Calendário</h2>
        <button className="text-sm text-blue-600 hover:underline">Ver Todos</button>
      </div>
      <div className="grid grid-cols-2 gap-4 mt-4">
        {calendarData.map(item => (
            <div key={item.label} className='p-4 rounded-md bg-gray-50 text-center'>
                <p className='text-xs text-gray-500'>{item.label}</p>
                <p className='text-2xl font-bold text-gray-800 mt-1'>{item.value}</p>
            </div>
        ))}
      </div>
    </div>
  );
}
