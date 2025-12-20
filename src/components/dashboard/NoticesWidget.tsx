const noticesData = [
    { label: 'Pendentes', value: 0, color: 'bg-yellow-100 text-yellow-600' },
    { label: 'Aprovados', value: 21, color: 'bg-green-100 text-green-600' },
    { label: 'Confirmados', value: 0, color: 'bg-blue-100 text-blue-600' },
    { label: 'Urgentes', value: 0, color: 'bg-red-100 text-red-600' },
    { label: 'Pedidos', value: 20, color: 'bg-indigo-100 text-indigo-600' },
    { label: 'Avisos', value: 1, color: 'bg-purple-100 text-purple-600' },
]

export function NoticesWidget() {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-700">Intenções e Avisos</h2>
        <button className="text-sm text-blue-600 hover:underline">Ver Todos</button>
      </div>
      <div className="grid grid-cols-3 gap-4 mt-4">
        {noticesData.map(item => (
            <div key={item.label} className={`p-4 rounded-md text-center ${item.color}`}>
                <p className='text-xs font-semibold'>{item.label}</p>
                <p className='text-2xl font-bold mt-1'>{item.value}</p>
            </div>
        ))}
      </div>
    </div>
  );
}
