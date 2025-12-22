import { BarChart3, TrendingUp } from 'lucide-react';

export function MessagesWidget() {
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700/50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-500/20 rounded-lg">
            <BarChart3 className="w-5 h-5 text-green-400" />
          </div>
          <h2 className="font-semibold text-white">Mensagens - Últimos 7 Dias</h2>
        </div>
        <div className="flex items-center gap-2 text-green-400 text-sm">
          <TrendingUp className="w-4 h-4" />
          <span>+12%</span>
        </div>
      </div>
      <div className='h-64 bg-gray-700/30 rounded-xl border border-gray-600/30 flex items-center justify-center'>
          <div className="text-center">
            <BarChart3 className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className='text-gray-500'>Gráfico de mensagens aqui</p>
          </div>
      </div>
    </div>
  );
}
