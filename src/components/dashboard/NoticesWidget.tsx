import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Clock, CheckCircle, AlertTriangle, FileText, MessageCircle } from 'lucide-react';
import { supportTicketsService } from '../../services/supabase/supportTicketsService';
import { getUserData } from '../../lib/user';

export function NoticesWidget() {
  const [stats, setStats] = useState({ total: 0, pendentes: 0, emAndamento: 0, resolvidos: 0, urgentes: 0, hoje: 0 });

  useEffect(() => {
    const load = async () => {
      try {
        const profile = await getUserData();
        const churchId = profile?.church_id;
        if (!churchId) {
          setStats({ total: 0, pendentes: 0, emAndamento: 0, resolvidos: 0, urgentes: 0, hoje: 0 });
          return;
        }

        const data = await supportTicketsService.getStats(churchId);
        setStats(data);
      } catch (error) {
        console.error('Erro ao carregar estatísticas de tickets:', error);
        setStats({ total: 0, pendentes: 0, emAndamento: 0, resolvidos: 0, urgentes: 0, hoje: 0 });
      }
    };

    load();
  }, []);

  const noticesData = useMemo(() => [
    { label: 'Pendentes', value: stats.pendentes, icon: Clock, bgColor: 'bg-yellow-500/20', textColor: 'text-yellow-400', borderColor: 'border-yellow-500/30' },
    { label: 'Aprovados', value: stats.emAndamento, icon: CheckCircle, bgColor: 'bg-green-500/20', textColor: 'text-green-400', borderColor: 'border-green-500/30' },
    { label: 'Confirmados', value: stats.resolvidos, icon: CheckCircle, bgColor: 'bg-blue-500/20', textColor: 'text-blue-400', borderColor: 'border-blue-500/30' },
    { label: 'Urgentes', value: stats.urgentes, icon: AlertTriangle, bgColor: 'bg-red-500/20', textColor: 'text-red-400', borderColor: 'border-red-500/30' },
    { label: 'Pedidos', value: stats.hoje, icon: FileText, bgColor: 'bg-indigo-500/20', textColor: 'text-indigo-400', borderColor: 'border-indigo-500/30' },
    { label: 'Avisos', value: stats.total, icon: MessageCircle, bgColor: 'bg-purple-500/20', textColor: 'text-purple-400', borderColor: 'border-purple-500/30' },
  ], [stats]);

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700/50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-yellow-500/20 rounded-lg">
            <Bell className="w-5 h-5 text-yellow-400" />
          </div>
          <h2 className="font-semibold text-white">Intenções de Missas / Avisos</h2>
        </div>
        <Link to="/avisos" className="text-sm text-purple-400 hover:text-purple-300 transition-colors">Ver Todos</Link>
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
