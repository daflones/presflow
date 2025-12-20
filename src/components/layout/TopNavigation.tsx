import { Church, MessageSquare, Calendar, Users, Bot, Phone, Bell, FileText, Shield, Settings, LayoutDashboard } from 'lucide-react';
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
  { name: 'Conversas', href: '/conversas', icon: Phone },
  { name: 'Contatos / CRM', href: '/contatos', icon: Users },
  { name: 'Calendário', href: '/calendario', icon: Calendar },
  { name: 'Intenções e Avisos', href: '/avisos', icon: Bell },
];

export function TopNavigation() {
  const location = useLocation();
  const { church, isManager } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
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
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                <Church className="text-white h-4 w-4" />
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex items-center gap-1 flex-1 overflow-x-auto">
            {navigationItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
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
                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-all ${
                  location.pathname.startsWith('/admin')
                    ? 'bg-purple-600 text-white'
                    : 'text-purple-600 hover:bg-purple-50'
                }`}
              >
                <Shield className="h-4 w-4" />
                <span>Admin</span>
              </Link>
            )}
          </nav>

          {/* Right side - Settings & Profile */}
          <div className="flex items-center gap-2 ml-4">
            <Link
              to="/arquivos-ia"
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-all ${
                location.pathname === '/arquivos-ia'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              title="Arquivos IA"
            >
              <FileText className="h-4 w-4" />
            </Link>
            <Link
              to="/perfil-igreja"
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-all ${
                location.pathname === '/perfil-igreja'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              title="Configurações"
            >
              <Settings className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
