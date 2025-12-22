import { useEffect, useState } from 'react';
import { Church, Search, Eye, Settings, Users, FileText, Plus, X, Shield } from 'lucide-react';
import { adminService } from '../../services/supabase/admin';
import type { Church as ChurchType } from '../../types/database';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';

function formatDate(dateString?: string): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function AdminIgrejas() {
  const navigate = useNavigate();
  const [churches, setChurches] = useState<ChurchType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChurch, setSelectedChurch] = useState<ChurchType | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [churchOwners, setChurchOwners] = useState<Record<string, { isManager: boolean; email: string }>>({});
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    userName: '',
    userPassword: '',
    owner_id: ''
  });

  useEffect(() => {
    loadChurches();
  }, []);

  async function loadChurches() {
    setIsLoading(true);
    try {
      const data = await adminService.listChurches();
      setChurches(data);
      
      // Buscar informações de role da própria tabela churches
      const ownersInfo: Record<string, { isManager: boolean; email: string }> = {};
      
      data.forEach(church => {
        if (church.owner_id) {
          ownersInfo[church.owner_id] = {
            isManager: church.role === 'manager',
            email: church.email || ''
          };
        }
      });
      
      setChurchOwners(ownersInfo);
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

  // Função para gerar slug a partir do nome
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
      .replace(/\s+/g, '-') // Substitui espaços por hífens
      .replace(/-+/g, '-') // Remove hífens duplicados
      .trim();
  };

  async function handleCreateChurch(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.userName.trim() || !formData.userPassword.trim()) {
      toast.error('Nome da igreja, email, nome do usuário e senha são obrigatórios');
      return;
    }

    setIsCreating(true);
    try {
      // 1. Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.userPassword.trim(),
        options: {
          data: {
            full_name: formData.userName.trim(),
            church_name: formData.name.trim(),
          },
        },
      });

      if (authError) {
        throw new Error('Erro ao criar usuário: ' + authError.message);
      }

      if (!authData.user) {
        throw new Error('Erro ao criar usuário');
      }

      // 2. Gerar slug a partir do nome
      const slug = generateSlug(formData.name.trim());
      
      // 3. Criar igreja na tabela churches com o ID do usuário criado
      await adminService.createChurch({
        name: formData.name.trim(),
        slug: slug,
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        address: formData.address.trim() || undefined,
        owner_id: authData.user.id,
        timezone: 'America/Sao_Paulo',
        language: 'pt-BR',
        plan: 'free',
        is_active: true
      });

      // 4. Fazer logout do usuário criado
      await supabase.auth.signOut();
      
      toast.success('Igreja e usuário criados com sucesso!');
      setShowCreateForm(false);
      setFormData({ 
        name: '', 
        email: '', 
        phone: '', 
        address: '', 
        userName: '', 
        userPassword: '' 
      });
      loadChurches();
    } catch (error: any) {
      toast.error('Erro ao cadastrar igreja: ' + error.message);
    } finally {
      setIsCreating(false);
    }
  }

  async function toggleManagerRole(church: ChurchType) {
    if (!church.owner_id) {
      toast.error('Igreja sem proprietário definido');
      return;
    }

    const currentIsManager = churchOwners[church.owner_id]?.isManager || false;
    const newRole = currentIsManager ? null : 'manager';

    try {
      // Atualizar role na tabela churches
      const { error } = await supabase
        .from('churches')
        .update({ role: newRole })
        .eq('id', church.id);

      if (error) throw error;

      toast.success(currentIsManager ? 'Permissão de manager removida' : 'Permissão de manager concedida');
      loadChurches();
    } catch (error: any) {
      console.error('Erro ao alterar role:', error);
      toast.error('Erro ao alterar permissão: ' + error.message);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Igrejas</h1>
          <p className="text-gray-400 mt-1">Gerencie todas as igrejas cadastradas no sistema</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
        >
          <Plus className="h-5 w-5" />
          Nova Igreja
        </button>
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
                  <td className="px-4 py-3">
                    {church.owner_id && churchOwners[church.owner_id] ? (
                      <button
                        onClick={() => toggleManagerRole(church)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                          churchOwners[church.owner_id].isManager
                            ? 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30'
                            : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                        }`}
                        title={churchOwners[church.owner_id].isManager ? 'Remover permissão de manager' : 'Conceder permissão de manager'}
                      >
                        <Shield className="h-3 w-3" />
                        {churchOwners[church.owner_id].isManager ? 'Manager' : 'Usuário'}
                      </button>
                    ) : (
                      <span className="text-gray-500 text-sm">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">{formatDate(church.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center juconfst-ia?chuich=d gap-1">
                      <button
                        onClick={() => setSelectedChurch(church)}
                        className="p-2 rounded-lg hover:bg-gray-600 text-gray-400 hover:text-white"
                        title="Ver detalhes"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => navigate(`/admin/igrejas/${church.id}/config`)}
                        className="p-2 rounded-lg hover:bg-gray-600 text-gray-400 hover:text-purple-400"
                        title="Configurações da Igreja"
                      >
                        <Settings className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => navigate(`/admin/clientes?church=${church.id}`)}
                        className="p-2 rounded-lg hover:bg-gray-600 text-gray-400 hover:text-green-400"
                        title="Ver clientes"
                      >
                        <Users className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => navigate(`/admin/arquivos?church=${church.id}`)}
                        className="p-2 rounded-lg hover:bg-gray-600 text-gray-400 hover:text-blue-400"
                        title="Ver arquivos"
                      >
                        <FileText className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-gray-800 rounded-xl shadow-xl w-full max-w-lg m-4 border border-gray-700">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h2 className="text-lg font-bold text-white">Cadastrar Nova Igreja</h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="p-2 rounded-lg hover:bg-gray-700 text-gray-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateChurch} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Nome da Igreja *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Nome do Usuário *</label>
                <input
                  type="text"
                  value={formData.userName}
                  onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  placeholder="Nome completo do administrador"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Senha do Usuário *</label>
                <input
                  type="password"
                  value={formData.userPassword}
                  onChange={(e) => setFormData({ ...formData, userPassword: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  placeholder="Mínimo 6 caracteres"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Telefone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Endereço</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 text-sm font-medium text-white bg-gray-700 rounded-lg hover:bg-gray-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  {isCreating ? 'Cadastrando...' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
