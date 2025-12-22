import { Bell, Clock, CheckCircle, AlertTriangle, FileText, MessageCircle } from 'lucide-react';

const noticesData = [
    { label: 'Pendentes', value: 0, icon: Clock, bgColor: 'bg-yellow-500/20', textColor: 'text-yellow-400', borderColor: 'border-yellow-500/30' },
    { label: 'Aprovados', value: 21, icon: CheckCircle, bgColor: 'bg-green-500/20', textColor: 'text-green-400', borderColor: 'border-green-500/30' },
    { label: 'Confirmados', value: 0, icon: CheckCircle, bgColor: 'bg-blue-500/20', textColor: 'text-blue-400', borderColor: 'border-blue-500/30' },
    { label: 'Urgentes', value: 0, icon: AlertTriangle, bgColor: 'bg-red-500/20', textColor: 'text-red-400', borderColor: 'border-red-500/30' },
    { label: 'Pedidos', value: 20, icon: FileText, bgColor: 'bg-indigo-500/20', textColor: 'text-indigo-400', borderColor: 'border-indigo-500/30' },
    { label: 'Avisos', value: 1, icon: MessageCircle, bgColor: 'bg-purple-500/20', textColor: 'text-purple-400', borderColor: 'border-purple-500/30' },
]

export function NoticesWidget() {
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700/50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-yellow-500/20 rounded-lg">
            <Bell className="w-5 h-5 text-yellow-400" />
          </div>
          <h2 className="font-semibold text-white">Intenções e Avisos</h2>
        </div>
        <button className="text-sm text-purple-400 hover:text-purple-300 transition-colors">Ver Todos</button>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {noticesData.map(item => (
            <div key={item.label} className={`p-4 rounded-xl text-center border ${item.bgColor} ${item.borderColor} hover:scale-[1.02] transition-transform`}>
                <item.icon className={`w-5 h-5 mx-auto mb-2 ${item.textColor}`} />
                <p className={`text-xs font-semibold ${item.textColor}`}>{item.label}</p>
                <p className={`text-2xl font-bold mt-1 ${item.textColor}`}>{item.value}</p>
            </div>
        ))}
      </div>
    </div>
  );
}
