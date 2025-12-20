import { useEffect, useState, useCallback } from 'react';
import { KpiCard } from '../components/dashboard/KpiCard';
import { StatCard } from '../components/dashboard/StatCard';
import { CalendarWidget } from '../components/dashboard/CalendarWidget';
import { NoticesWidget } from '../components/dashboard/NoticesWidget';
import { MessagesWidget } from '../components/dashboard/MessagesWidget';
import { RefreshCw, Wifi, Bot, MessageSquare, Users, Percent, ArrowUp, ArrowDown, Clock, Check, ThumbsUp, ThumbsDown, Loader2 } from 'lucide-react';
import { dashboardService, type DashboardStats } from '../services/supabase/dashboard';

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadStats = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setIsRefreshing(true);
      else setIsLoading(true);
      
      const data = await dashboardService.getStats();
      setStats(data);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleRefresh = () => {
    loadStats(true);
  };

  // Dados para KPIs
  const kpiData = [
    { 
      title: 'Conexões WhatsApp', 
      value: stats ? `${stats.whatsappConnections.connected}/${stats.whatsappConnections.total}` : '0/0', 
      icon: Wifi, 
      color: '#4A90E2', 
      status: (stats?.whatsappConnections?.connected ?? 0) > 0 ? 'ONLINE' : 'OFFLINE' 
    },
    { 
      title: 'Agentes IA', 
      value: stats?.aiAgentsActive || 0, 
      icon: Bot, 
      color: '#9013FE', 
      status: stats?.aiAgentsActive ? 'ATIVOS' : 'INATIVO' 
    },
    { 
      title: 'Conversas Ativas', 
      value: stats?.activeConversations || 0, 
      icon: MessageSquare, 
      color: '#50E3C2', 
      status: 'TEMPO REAL' 
    },
    { 
      title: 'Base de Contatos', 
      value: stats?.totalContacts || 0, 
      icon: Users, 
      color: '#F5A623', 
      status: 'CRM' 
    },
    { 
      title: 'Taxa Conversão', 
      value: `${stats?.conversionRate || 0}%`, 
      icon: Percent, 
      color: '#F8E71C', 
      status: 'PIPELINE' 
    },
  ];

  // Dados para estatísticas
  const statData = [
    { label: 'Hoje', value: stats?.messagesToday || 0, icon: ArrowUp },
    { label: 'Enviadas', value: stats?.messagesSent || 0, icon: ArrowUp },
    { label: 'Recebidas', value: stats?.messagesReceived || 0, icon: ArrowDown },
    { label: 'Novos', value: stats?.newLeadsToday || 0, icon: Check },
    { label: 'Pausas', value: 0, icon: Clock },
    { label: 'Pipelines', value: stats?.totalLeads || 0, icon: Users },
    { label: 'Ganhos', value: stats?.totalActiveClients || 0, icon: ThumbsUp },
    { label: 'Perdidos', value: stats?.totalInactiveClients || 0, icon: ThumbsDown },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Carregando dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard Admin</h1>
          <p className="text-sm text-gray-500">Monitoramento em tempo real do sistema</p>
        </div>
        <button 
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Atualizando...' : 'Atualizar Tudo'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {kpiData.map((kpi) => (
          <KpiCard key={kpi.title} {...kpi} />
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        {statData.map((stat) => (
            <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CalendarWidget />
        <NoticesWidget />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <MessagesWidget />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm">
            <h2 className="font-semibold text-gray-700">Monitor</h2>
            <div className='mt-4 h-64 bg-gray-100 rounded-md flex items-center justify-center'>
                <p className='text-gray-400'>Gráfico do monitor aqui</p>
            </div>
        </div>
      </div>
    </div>
  );
}
