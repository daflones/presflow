import { useEffect, useState } from 'react';
import { Church, Search, Eye, Settings, Users, FileText } from 'lucide-react';
import { adminService } from '../../services/supabase/admin';
import type { Church as ChurchType } from '../../types/database';

function formatDate(dateString?: string): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function AdminIgrejas() {
  const [churches, setChurches] = useState<ChurchType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChurch, setSelectedChurch] = useState<ChurchType | null>(null);

  useEffect(() => {
    loadChurches();
  }, []);

  async function loadChurches() {
    setIsLoading(true);
    try {
      const data = await adminService.listChurches();
      setChurches(data);
    } catch (error) {
      console.error('Erro ao carregar igrejas:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const filteredChurches = churches.filter(church =>
    church.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    church.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Igrejas</h1>
        <p className="text-gray-400 mt-1">Gerencie todas as igrejas cadastradas no sistema</p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
        <input
          type="text"
          placeholder="Buscar igrejas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
        />
      </div>

      {/* Table */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          </div>
        ) : filteredChurches.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Church className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">Nenhuma igreja encontrada</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-900/50 border-b border-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Igreja</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Telefone</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Instância</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Criado em</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredChurches.map((church) => (
                <tr key={church.id} className="hover:bg-gray-700/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400">
                        <Church className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{church.name}</p>
                        <p className="text-xs text-gray-500">{church.id.slice(0, 8)}...</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">{church.email || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-300">{church.phone || '-'}</td>
                  <td className="px-4 py-3">
                    {church.instance ? (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-500/20 text-green-400 rounded-full">
                        {church.instance}
                      </span>
                    ) : (
                      <span className="text-gray-500 text-sm">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">{formatDate(church.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setSelectedChurch(church)}
                        className="p-2 rounded-lg hover:bg-gray-600 text-gray-400 hover:text-white"
                        title="Ver detalhes"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <a
                        href={`/admin/config-ia?church=${church.id}`}
                        className="p-2 rounded-lg hover:bg-gray-600 text-gray-400 hover:text-purple-400"
                        title="Configurações IA"
                      >
                        <Settings className="h-4 w-4" />
                      </a>
                      <a
                        href={`/admin/clientes?church=${church.id}`}
                        className="p-2 rounded-lg hover:bg-gray-600 text-gray-400 hover:text-green-400"
                        title="Ver clientes"
                      >
                        <Users className="h-4 w-4" />
                      </a>
                      <a
                        href={`/admin/arquivos?church=${church.id}`}
                        className="p-2 rounded-lg hover:bg-gray-600 text-gray-400 hover:text-blue-400"
                        title="Ver arquivos"
                      >
                        <FileText className="h-4 w-4" />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail Modal */}
      {selectedChurch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-gray-800 rounded-xl shadow-xl w-full max-w-lg m-4 border border-gray-700">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h2 className="text-lg font-bold text-white">Detalhes da Igreja</h2>
              <button
                onClick={() => setSelectedChurch(null)}
                className="p-2 rounded-lg hover:bg-gray-700 text-gray-400"
              >
                ✕
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400">
                  <Church className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{selectedChurch.name}</h3>
                  <p className="text-sm text-gray-400">ID: {selectedChurch.id}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-700">
                <div>
                  <p className="text-xs text-gray-500 uppercase">Email</p>
                  <p className="text-sm text-white">{selectedChurch.email || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Telefone</p>
                  <p className="text-sm text-white">{selectedChurch.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Instância WhatsApp</p>
                  <p className="text-sm text-white">{selectedChurch.instance || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Criado em</p>
                  <p className="text-sm text-white">{formatDate(selectedChurch.created_at)}</p>
                </div>
              </div>

              {selectedChurch.address && (
                <div className="pt-4 border-t border-gray-700">
                  <p className="text-xs text-gray-500 uppercase mb-1">Endereço</p>
                  <p className="text-sm text-white">{selectedChurch.address}</p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-gray-700">
              <button
                onClick={() => setSelectedChurch(null)}
                className="px-4 py-2 text-sm font-medium text-white bg-gray-700 rounded-lg hover:bg-gray-600"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
