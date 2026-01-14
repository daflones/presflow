import { useEffect, useState, useCallback } from 'react';
import { KpiCard } from '../components/dashboard/KpiCard';
import { CalendarWidget } from '../components/dashboard/CalendarWidget';
import { NoticesWidget } from '../components/dashboard/NoticesWidget';
import { FormsWidget } from '../components/dashboard/FormsWidget';
import { RefreshCw, Wifi, Bot, Users, Percent, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { dashboardService, type DashboardStats } from '../services/supabase/dashboard';

export function DashboardPage() {
  const { isManager, isChurchAdmin, profile, isReadOnly } = useAuth();
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

  const normalizedRole = String(profile?.role ?? '').trim().toLowerCase();
  const dashboardTitle = isChurchAdmin || isManager
    ? 'Dashboard Admin'
    : isReadOnly || normalizedRole === 'consulta'
      ? 'Dashboard Consulta'
      : normalizedRole === 'manutencao'
        ? 'Dashboard Manutenção'
        : 'Dashboard';

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        <span className="ml-2 text-gray-400">Carregando dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{dashboardTitle}</h1>
          <p className="text-sm text-gray-400">Monitoramento em tempo real do sistema</p>
        </div>
        <button 
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 shadow-lg shadow-purple-500/25 transition-all"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Atualizando...' : 'Atualizar Tudo'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiData.map((kpi) => (
          <KpiCard key={kpi.title} {...kpi} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CalendarWidget />
        <NoticesWidget />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <FormsWidget />
      </div>
    </div>
  );
}
