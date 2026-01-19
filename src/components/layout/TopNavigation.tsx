import { Church, MessageSquare, Calendar, Users, Bot, Bell, FileText, Shield, Settings, LayoutDashboard, LogOut } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

type NavigationItem = {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

const navigationItems: NavigationItem[] = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Conexões', href: '/whatsapp', icon: MessageSquare },
  { name: 'Agente IA', href: '/agente-ia', icon: Bot },
  { name: 'Contatos / CRM', href: '/contatos', icon: Users },
  { name: 'Calendário', href: '/calendario', icon: Calendar },
  { name: 'Intenções de Missas / Avisos', href: '/avisos', icon: Bell },
];

export function TopNavigation() {
  const location = useLocation();
  const { church, isManager, signOut, canManageChurchUsers } = useAuth();

  return (
    <header className="bg-gray-900/80 backdrop-blur-xl border-b border-gray-700/50 shadow-lg">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-14">
          {/* Logo */}
          <div className="flex items-center gap-2 mr-8">
            {church?.logo_url ? (
              <img
                src={church.logo_url}
                alt={church.name}
                className="h-8 w-8 rounded-lg object-cover"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 shadow-lg shadow-purple-500/25">
                <Church className="text-white h-4 w-4" />
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex items-center gap-1 flex-1 overflow-x-auto scrollbar-hide">
            {navigationItems.map((item) => {
              // Ocultar "Agente IA" para usuários que não são managers
              if (item.name === 'Agente IA' && !isManager) {
                return null;
              }
              
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25'
                      : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}

            {/* Admin Link - Only for managers */}
            {isManager && (
              <Link
                to="/admin"
                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-all ${
                  location.pathname.startsWith('/admin')
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25'
                    : 'text-purple-400 hover:bg-purple-500/20'
                }`}
              >
                <Shield className="h-4 w-4" />
                <span>Admin</span>
              </Link>
            )}

            {canManageChurchUsers && (
              <Link
                to="/usuarios"
                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-all ${
                  location.pathname === '/usuarios'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25'
                    : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
                }`}
              >
                <Users className="h-4 w-4" />
                <span>Usuários</span>
              </Link>
            )}
          </nav>

          {/* Right side - Settings & Profile */}
          <div className="flex items-center gap-2 ml-4">
            <Link
              to="/arquivos-ia"
              className={`flex items-center gap-2 p-2 text-sm font-medium rounded-lg whitespace-nowrap transition-all ${
                location.pathname === '/arquivos-ia'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
              }`}
              title="Arquivos IA"
            >
              <FileText className="h-4 w-4" />
            </Link>
            <Link
              to="/perfil-igreja"
              className={`flex items-center gap-2 p-2 text-sm font-medium rounded-lg whitespace-nowrap transition-all ${
                location.pathname === '/perfil-igreja'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
              }`}
              title="Configurações"
            >
              <Settings className="h-4 w-4" />
            </Link>
            <button
              onClick={signOut}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-all text-red-400 hover:bg-red-500/20 hover:text-red-300"
              title="Sair"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
