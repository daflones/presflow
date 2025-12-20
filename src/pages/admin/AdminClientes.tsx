import { useEffect, useState } from 'react';
import { Users, Search, Eye, Church, Phone, Mail } from 'lucide-react';
import { adminService } from '../../services/supabase/admin';
import type { Client, Church as ChurchType } from '../../types/database';
import { useSearchParams } from 'react-router-dom';

function formatDate(dateString?: string): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function StatusBadge({ status }: { status: Client['status'] }) {
  const styles = {
    ativo: 'bg-green-500/20 text-green-400',
    lead: 'bg-blue-500/20 text-blue-400',
    inativo: 'bg-gray-500/20 text-gray-400',
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status]}`}>
      {status}
    </span>
  );
}

export function AdminClientes() {
  const [searchParams] = useSearchParams();
  const churchIdParam = searchParams.get('church');

  const [clients, setClients] = useState<(Client & { church?: ChurchType })[]>([]);
  const [churches, setChurches] = useState<ChurchType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterChurch, setFilterChurch] = useState(churchIdParam || '');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client & { church?: ChurchType } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (churchIdParam) {
      setFilterChurch(churchIdParam);
    }
  }, [churchIdParam]);

  async function loadData() {
    setIsLoading(true);
    try {
      const [clientsData, churchesData] = await Promise.all([
        adminService.listAllClients(),
        adminService.listChurches(),
      ]);
      setClients(clientsData);
      setChurches(churchesData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone?.includes(searchTerm);
    const matchesChurch = !filterChurch || client.church_id === filterChurch;
    const matchesStatus = !filterStatus || client.status === filterStatus;
    return matchesSearch && matchesChurch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Clientes</h1>
        <p className="text-gray-400 mt-1">Visualize os clientes de todas as igrejas</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar por nome, email ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
          />
        </div>
        <select
          value={filterChurch}
          onChange={(e) => setFilterChurch(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
        >
          <option value="">Todas as igrejas</option>
          {churches.map(church => (
            <option key={church.id} value={church.id}>{church.name}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
        >
          <option value="">Todos os status</option>
          <option value="lead">Lead</option>
          <option value="ativo">Ativo</option>
          <option value="inativo">Inativo</option>
        </select>
      </div>

      {/* Stats */}
      <div className="flex gap-4 text-sm">
        <span className="text-gray-400">
          Total: <span className="text-white font-medium">{filteredClients.length}</span>
        </span>
        <span className="text-gray-400">
          Leads: <span className="text-blue-400 font-medium">{filteredClients.filter(c => c.status === 'lead').length}</span>
        </span>
        <span className="text-gray-400">
          Ativos: <span className="text-green-400 font-medium">{filteredClients.filter(c => c.status === 'ativo').length}</span>
        </span>
      </div>

      {/* Table */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Users className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">Nenhum cliente encontrado</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-900/50 border-b border-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Cliente</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Igreja</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Contato</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Categoria</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Criado em</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredClients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-700/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/20 text-purple-400 font-bold">
                        {client.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-white">{client.name}</p>
                        {client.tags && client.tags.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {client.tags.slice(0, 2).map((tag, i) => (
                              <span key={i} className="px-1.5 py-0.5 text-xs bg-gray-700 text-gray-400 rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Church className="h-4 w-4 text-blue-400" />
                      <span className="text-sm text-gray-300">{client.church?.name || '-'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      {client.email && (
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Mail className="h-3 w-3" />
                          {client.email}
                        </div>
                      )}
                      {client.phone && (
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Phone className="h-3 w-3" />
                          {client.phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={client.status} />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">
                    {client.category || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">
                    {formatDate(client.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setSelectedClient(client)}
                      className="p-2 rounded-lg hover:bg-gray-600 text-gray-400 hover:text-white"
                      title="Ver detalhes"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail Modal */}
      {selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-gray-800 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto m-4 border border-gray-700">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h2 className="text-lg font-bold text-white">Detalhes do Cliente</h2>
              <button
                onClick={() => setSelectedClient(null)}
                className="p-2 rounded-lg hover:bg-gray-700 text-gray-400"
              >
                ✕
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-500/20 text-purple-400 text-2xl font-bold">
                  {selectedClient.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{selectedClient.name}</h3>
                  <StatusBadge status={selectedClient.status} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-700">
                <div>
                  <p className="text-xs text-gray-500 uppercase">Igreja</p>
                  <p className="text-sm text-white">{selectedClient.church?.name || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Categoria</p>
                  <p className="text-sm text-white">{selectedClient.category || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Email</p>
                  <p className="text-sm text-white">{selectedClient.email || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Telefone</p>
                  <p className="text-sm text-white">{selectedClient.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">WhatsApp</p>
                  <p className="text-sm text-white">{selectedClient.whatsapp || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Criado em</p>
                  <p className="text-sm text-white">{formatDate(selectedClient.created_at)}</p>
                </div>
              </div>

              {selectedClient.notes && (
                <div className="pt-4 border-t border-gray-700">
                  <p className="text-xs text-gray-500 uppercase mb-1">Notas</p>
                  <p className="text-sm text-white whitespace-pre-wrap">{selectedClient.notes}</p>
                </div>
              )}

              {selectedClient.tags && selectedClient.tags.length > 0 && (
                <div className="pt-4 border-t border-gray-700">
                  <p className="text-xs text-gray-500 uppercase mb-2">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedClient.tags.map((tag, i) => (
                      <span key={i} className="px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end p-4 border-t border-gray-700">
              <button
                onClick={() => setSelectedClient(null)}
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
