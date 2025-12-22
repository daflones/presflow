import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Shield, Church, Bot, Users, FileText, LogOut, Home, Bed, Calendar, MapPin } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useEffect } from 'react';

const adminNavItems = [
  { name: 'Dashboard', href: '/admin', icon: Home },
  { name: 'Igrejas', href: '/admin/igrejas', icon: Church },
  { name: 'Calendário', href: '/admin/calendario', icon: Calendar },
  { name: 'Configurações IA', href: '/admin/config-ia', icon: Bot },
  { name: 'Serviços', href: '/admin/servicos', icon: MapPin },
  { name: 'Hospedagem', href: '/admin/hospedagem', icon: Bed },
  { name: 'Visitação', href: '/admin/visitacao', icon: Calendar },
  { name: 'Clientes', href: '/admin/clientes', icon: Users },
  { name: 'Arquivos IA', href: '/admin/arquivos', icon: FileText },
];

export function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isManager, signOut, loading } = useAuth();

  useEffect(() => {
    if (!loading && !isManager) {
      navigate('/login');
    }
  }, [loading, isManager, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!isManager) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 flex flex-col">
        {/* Logo */}
        <div className="flex items-center gap-3 p-6 border-b border-gray-700">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-600">
            <Shield className="text-white h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Admin Panel</h1>
            <p className="text-xs text-gray-400">Gerenciamento</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {adminNavItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center font-bold text-white">
              {user?.email?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.email}</p>
              <p className="text-xs text-purple-400">Manager</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              to="/"
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600"
            >
              <Home className="h-4 w-4" />
              Painel Igreja
            </Link>
            <button
              onClick={signOut}
              className="flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-red-400 bg-gray-700 rounded-lg hover:bg-gray-600"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-gray-900 p-8">
        <Outlet />
      </main>
    </div>
  );
}
