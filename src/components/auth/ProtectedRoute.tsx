import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export function ProtectedRoute() {
  const { church, user, loading, signOut } = useAuth();
  const location = useLocation();

  // Mostra loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // Se não está autenticado, redireciona para login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Se está autenticado mas não tem igreja ainda
  if (!church) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4 text-center max-w-md px-6">
          <p className="text-gray-900 font-semibold">Não foi possível carregar os dados da sua igreja.</p>
          <p className="text-gray-600 text-sm">
            Isso normalmente acontece quando a conta ainda não está vinculada a uma igreja ou quando as permissões (RLS) ainda não foram aplicadas.
          </p>
          <button
            type="button"
            onClick={() => void signOut()}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Sair
          </button>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
