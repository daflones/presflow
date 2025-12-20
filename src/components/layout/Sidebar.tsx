import { Church, MessageSquare, Calendar, Users, Bot, Phone, Bell, FileText, Shield, Settings } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

type NavigationItem = {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

const navigationItems: NavigationItem[] = [
  { name: 'Dashboard', href: '/', icon: Church },
  { name: 'WhatsApp', href: '/whatsapp', icon: MessageSquare },
  { name: 'Agente IA', href: '/agente-ia', icon: Bot },
  { name: 'Arquivos IA', href: '/arquivos-ia', icon: FileText },
  { name: 'Conversas', href: '/conversas', icon: Phone },
  { name: 'Contatos', href: '/contatos', icon: Users },
  { name: 'Calendário', href: '/calendario', icon: Calendar },
  { name: 'Avisos', href: '/avisos', icon: Bell },
  { name: 'Perfil da Igreja', href: '/perfil-igreja', icon: Settings },
];

export function Sidebar() {
  const location = useLocation();
  const { church, user, isManager } = useAuth();

  const churchName = church?.name || 'Minha Igreja';
  const userName = user?.user_metadata?.full_name || user?.email || 'Usuário';
  const userEmail = user?.email || '';

  return (
    <aside className="w-72 bg-white/80 backdrop-blur-xl flex flex-col h-full border-r border-gray-200/50 shadow-xl">
      {/* Logo/Header */}
      <div className="flex items-center gap-3 p-6 border-b border-gray-200/50">
        {church?.logo_url ? (
          <img
            src={church.logo_url}
            alt={churchName}
            className="h-11 w-11 rounded-xl object-cover shadow-lg"
          />
        ) : (
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg shadow-blue-500/30">
            <Church className="text-white h-6 w-6" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold text-gray-900 truncate">{churchName}</h1>
          <p className="text-xs text-gray-500">Sistema de Gestão</p>
        </div>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto">
        {/* Navigation */}
        <div className="mb-8">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 px-3">Navegação</h2>
          <nav className="space-y-1">
            {navigationItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30'
                      : 'text-gray-700 hover:bg-gray-100/80 hover:text-gray-900'
                  }`}
                >
                  <item.icon className={`h-5 w-5 transition-transform duration-200 ${
                    isActive ? 'scale-110' : 'group-hover:scale-110'
                  }`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Admin Link - Only for managers */}
        {isManager && (
          <div className="mb-8">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 px-3">Administração</h2>
            <Link
              to="/admin"
              className={`group flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                location.pathname.startsWith('/admin')
                  ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-500/30'
                  : 'text-gray-700 hover:bg-purple-50 hover:text-purple-700'
              }`}
            >
              <Shield className={`h-5 w-5 transition-transform duration-200 ${
                location.pathname.startsWith('/admin') ? 'scale-110' : 'group-hover:scale-110'
              }`} />
              <span>Painel Admin</span>
            </Link>
          </div>
        )}

        {/* User Info */}
        {user && (
          <div className="mt-auto pt-4 border-t border-gray-200/50">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50/80">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center font-bold text-white shadow-sm">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{userName}</p>
                <p className="text-xs text-gray-500 truncate">{userEmail}</p>
              </div>
              <span className="inline-flex items-center text-xs px-2 py-1 rounded-full font-medium bg-purple-50 text-purple-600">
                Dono
              </span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
