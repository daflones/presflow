import { Shield, Info } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function UsersPage() {
  const { user, church } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Proprietário da Igreja</h1>
          <p className="text-sm text-gray-500">Informações do proprietário da igreja.</p>
        </div>
      </div>

      {/* Info Card */}
      <div className="rounded-xl border bg-blue-50 border-blue-200 p-4">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900">Sistema simplificado</p>
            <p className="text-sm text-blue-700">
              Atualmente o sistema suporta apenas um proprietário por igreja. 
              Funcionalidade de múltiplos usuários será adicionada em breve.
            </p>
          </div>
        </div>
      </div>

      {/* Owner Card */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center font-bold text-white text-2xl">
              {church?.name?.charAt(0).toUpperCase() || 'P'}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-gray-900">{church?.name || 'Proprietário'}</h2>
                <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold bg-purple-100 text-purple-700">
                  <Shield className="h-3 w-3" />
                  Proprietário
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1">{user?.email || 'Email não disponível'}</p>
              <p className="text-sm text-gray-400 mt-1">
                Igreja criada em: {church?.created_at ? new Date(church.created_at).toLocaleDateString('pt-BR') : 'N/A'}
              </p>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-green-100 text-green-700">
                Ativo
              </span>
            </div>
          </div>
        </div>

        <div className="border-t bg-gray-50 px-6 py-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Plano</p>
              <p className="font-semibold text-gray-900 capitalize">{church?.plan || 'Free'}</p>
            </div>
            <div>
              <p className="text-gray-500">Slug</p>
              <p className="font-semibold text-gray-900">{church?.slug || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
