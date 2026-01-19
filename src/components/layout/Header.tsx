import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Cable, 
  Bot, 
  MessageSquare, 
  Contact, 
  Calendar, 
  BellDot, 
  LogOut,
  PauseCircle,
  User as UserIcon
} from 'lucide-react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/conexoes', label: 'Conexões', icon: Cable },
  { href: '/agente-ia', label: 'Agente IA', icon: Bot },
  { href: '/contatos', label: 'Contatos / CRM', icon: Contact },
  { href: '/calendario', label: 'Calendário', icon: Calendar },
  { href: '/avisos', label: 'Intenções de Missas / Avisos', icon: BellDot },
];

export function Header() {
  const location = useLocation();

  return (
    <header className="flex items-center justify-between h-16 px-6 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
      <nav className="flex items-center gap-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={`group flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                  : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900'
              }`}
            >
              <item.icon className={`w-4 h-4 transition-transform duration-200 ${
                isActive ? 'scale-110' : 'group-hover:scale-110'
              }`} />
              <span>{item.label}</span>
              {item.isPill && (
                <span className='ml-1 text-xs bg-white/20 backdrop-blur-sm text-white px-2 py-0.5 rounded-full font-semibold'>
                  PAB
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-4">
        <button className='flex items-center gap-2 text-sm text-gray-700 bg-orange-50 hover:bg-orange-100 px-3 py-2 rounded-lg transition-colors duration-200 font-medium'>
          <PauseCircle className='w-4 h-4 text-orange-600'/>
          <span>1 pausada</span>
        </button>

        <div className='flex items-center gap-3 border-l border-gray-200/50 pl-4'>
          <div className='text-right'>
            <p className='text-sm font-bold text-gray-900'>SBC</p>
            <div className='flex items-center justify-end gap-1.5'>
              <span className='w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-lg shadow-green-500/50'></span>
              <p className='text-xs text-gray-500 font-medium'>Online</p>
            </div>
          </div>
          <div className='w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center shadow-sm'>
            <UserIcon className='w-5 h-5 text-gray-600'/>
          </div>
          <button className='flex items-center gap-1.5 text-sm text-gray-600 hover:text-red-600 transition-colors duration-200 font-medium'>
            <LogOut className='w-4 h-4'/>
            <span>Sair</span>
          </button>
        </div>
      </div>
    </header>
  );
}
