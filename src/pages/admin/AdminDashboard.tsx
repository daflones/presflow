import { useEffect, useState } from 'react';
import { Church, Users, FileText, Bot, TrendingUp } from 'lucide-react';
import { adminService } from '../../services/supabase/admin';

export function AdminDashboard() {
  const [stats, setStats] = useState({
    totalChurches: 0,
    totalClients: 0,
    totalArquivos: 0,
    totalAIConfigs: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    setIsLoading(true);
    try {
      const data = await adminService.getStats();
      setStats(data);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const statCards = [
    {
      title: 'Igrejas',
      value: stats.totalChurches,
      icon: Church,
      color: 'bg-blue-500',
      description: 'Total de igrejas cadastradas',
    },
    {
      title: 'Clientes',
      value: stats.totalClients,
      icon: Users,
      color: 'bg-green-500',
      description: 'Total de clientes/leads',
    },
    {
      title: 'Arquivos IA',
      value: stats.totalArquivos,
      icon: FileText,
      color: 'bg-purple-500',
      description: 'Documentos para IA',
    },
    {
      title: 'Configs IA',
      value: stats.totalAIConfigs,
      icon: Bot,
      color: 'bg-orange-500',
      description: 'Configurações de IA ativas',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard Administrativo</h1>
        <p className="text-gray-400 mt-1">Visão geral do sistema</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <div
            key={stat.title}
            className="bg-gray-800 rounded-xl p-6 border border-gray-700"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <TrendingUp className="h-5 w-5 text-green-400" />
            </div>
            <div>
              {isLoading ? (
                <div className="h-8 w-16 bg-gray-700 rounded animate-pulse"></div>
              ) : (
                <p className="text-3xl font-bold text-white">{stat.value}</p>
              )}
              <p className="text-sm font-medium text-gray-300 mt-1">{stat.title}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h2 className="text-xl font-bold text-white mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/admin/igrejas"
            className="flex items-center gap-3 p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
          >
            <Church className="h-8 w-8 text-blue-400" />
            <div>
              <p className="font-medium text-white">Gerenciar Igrejas</p>
              <p className="text-sm text-gray-400">Ver todas as igrejas</p>
            </div>
          </a>
          <a
            href="/admin/config-ia"
            className="flex items-center gap-3 p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
          >
            <Bot className="h-8 w-8 text-purple-400" />
            <div>
              <p className="font-medium text-white">Configurações IA</p>
              <p className="text-sm text-gray-400">Editar configs por igreja</p>
            </div>
          </a>
          <a
            href="/admin/clientes"
            className="flex items-center gap-3 p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
          >
            <Users className="h-8 w-8 text-green-400" />
            <div>
              <p className="font-medium text-white">Ver Clientes</p>
              <p className="text-sm text-gray-400">Clientes de todas igrejas</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
