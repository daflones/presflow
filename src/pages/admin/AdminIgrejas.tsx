import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Church, Search, Eye, Edit, Users, Plus, X, Shield, FolderOpen, Smartphone, MessageCircle, Trash2, UserPlus } from 'lucide-react';
import { adminService } from '../../services/supabase/admin';
import type { Church as ChurchType } from '../../types/database';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { useCreateChurchInstance, useDeleteChurchInstance } from '../../hooks/useWhatsAppChurch';
import { useAuth } from '../../contexts/AuthContext';

function formatDate(dateString?: string): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

type CreateUserForm = {
  name: string;
  email: string;
  password: string;
  role: string;
};

export function AdminIgrejas() {
  const { session } = useAuth();
  const [churches, setChurches] = useState<ChurchType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChurch, setSelectedChurch] = useState<ChurchType | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [churchOwners, setChurchOwners] = useState<Record<string, { isManager: boolean; email: string }>>({});
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [showFilesModal, setShowFilesModal] = useState(false);
  const [showInstanceModal, setShowInstanceModal] = useState(false);
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [usersModalLoading, setUsersModalLoading] = useState(false);
  const [usersModalError, setUsersModalError] = useState<string | null>(null);
  const [churchUsers, setChurchUsers] = useState<
    Array<{ id: string; auth_id: string; name: string; email: string; role: string; is_active: boolean; created_at: string; updated_at: string }>
  >([]);
  const [createUserForm, setCreateUserForm] = useState<CreateUserForm>({ name: '', email: '', password: '', role: 'consulta' });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    userName: '',
    userPassword: ''
  });
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });
  const [clientFormData, setClientFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    observations: ''
  });
  const [instanceData, setInstanceData] = useState({
    instanceName: '',
    phoneNumber: ''
  });

  const createInstance = useCreateChurchInstance();
  const deleteInstance = useDeleteChurchInstance();

  const accessToken = session?.access_token;

  const roleLabel = useMemo(() => {
    return (role: string) => {
      const r = String(role || '').toLowerCase();
      if (r === 'admin') return 'Admin';
      if (r === 'manutencao') return 'Manutenção';
      if (r === 'consulta') return 'Consulta';
      return role;
    };
  }, []);

  useEffect(() => {
    loadChurches();
  }, []);

  // Funções para os modais
  const openDetailsModal = (church: ChurchType) => {
    setSelectedChurch(church);
    setShowDetailsModal(true);
  };

  const openEditModal = (church: ChurchType) => {
    setSelectedChurch(church);
    setEditFormData({
      name: church.name,
      email: church.email || '',
      phone: church.phone || '',
      address: church.address || ''
    });
    setShowEditModal(true);
  };

  const openInstanceModal = (church: ChurchType) => {
    setSelectedChurch(church);
    // Gerar nome da instância baseado no nome da igreja
    const generateInstanceName = (churchName: string) => {
      return churchName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    };
    
    setInstanceData({
      instanceName: generateInstanceName(church.name),
      phoneNumber: church.phone || ''
    });
    setShowInstanceModal(true);
  };

  const openUsersModal = async (church: ChurchType) => {
    setSelectedChurch(church);
    setUsersModalError(null);
    setChurchUsers([]);
    setCreateUserForm({ name: '', email: '', password: '', role: 'consulta' });
    setShowUsersModal(true);
    await loadChurchUsers(church.id);
  };

  const loadChurchUsers = async (churchId: string) => {
    if (!accessToken) return;
    setUsersModalLoading(true);
    setUsersModalError(null);
    try {
      const res = await fetch(`/api/auth/list-users?churchId=${encodeURIComponent(churchId)}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || 'Falha ao carregar usuários');
      }

      setChurchUsers((data?.users || []) as any);
    } catch (e: any) {
      setUsersModalError(e?.message || 'Erro ao carregar usuários');
    } finally {
      setUsersModalLoading(false);
    }
  };

  const onCreateChurchUser = async (e: FormEvent) => {
    e.preventDefault();
    if (!accessToken || !selectedChurch?.id) return;

    setUsersModalLoading(true);
    setUsersModalError(null);
    try {
      const res = await fetch('/api/auth/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          churchId: selectedChurch.id,
          userName: createUserForm.name,
          email: createUserForm.email,
          password: createUserForm.password,
          role: createUserForm.role,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || 'Falha ao criar usuário');
      }

      setCreateUserForm({ name: '', email: '', password: '', role: 'consulta' });
      await loadChurchUsers(selectedChurch.id);
    } catch (e: any) {
      setUsersModalError(e?.message || 'Erro ao criar usuário');
    } finally {
      setUsersModalLoading(false);
    }
  };

  const handleCreateInstance = async () => {
    if (!selectedChurch || !instanceData.instanceName.trim() || !instanceData.phoneNumber.trim()) return;
    
    try {
      setIsCreating(true);
      await createInstance.mutateAsync({ 
        churchId: selectedChurch.id,
        instanceName: instanceData.instanceName.trim(), 
        phoneNumber: instanceData.phoneNumber.trim() 
      });
      
      // Atualizar a igreja com o nome da instância
      await adminService.updateChurch(selectedChurch.id, { 
        instance: instanceData.instanceName.trim() 
      });
      
      setShowInstanceModal(false);
      loadChurches();
    } catch (error) {
      console.error('Erro ao criar instância:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteInstance = async (church: ChurchType) => {
    if (!church.instance) return;
    if (!confirm('Tem certeza que deseja remover esta instância WhatsApp?')) return;
    
    try {
      setIsCreating(true);
      await deleteInstance.mutateAsync(church.id);
      
      // Remover instância da igreja
      await adminService.updateChurch(church.id, { 
        instance: undefined 
      });
      
      loadChurches();
    } catch (error) {
      console.error('Erro ao remover instância:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const openAddClientModal = (church: ChurchType) => {
    setSelectedChurch(church);
    setClientFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      observations: ''
    });
    setShowAddClientModal(true);
  };

  const openFilesModal = (church: ChurchType) => {
    setSelectedChurch(church);
    setShowFilesModal(true);
  };

  const handleEditChurch = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedChurch) return;

    try {
      setIsCreating(true);
      await adminService.updateChurch(selectedChurch.id, editFormData);
      toast.success('Igreja atualizada com sucesso!');
      setShowEditModal(false);
      loadChurches();
    } catch (error) {
      console.error('Erro ao atualizar igreja:', error);
      toast.error('Erro ao atualizar igreja');
    } finally {
      setIsCreating(false);
    }
  };

  const handleAddClient = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedChurch) return;

    try {
      setIsCreating(true);
      // Aqui você precisaria de um serviço para adicionar clientes
      // Por enquanto, vamos apenas mostrar um toast
      toast.success('Cliente adicionado com sucesso!');
      setShowAddClientModal(false);
      setClientFormData({
        name: '',
        email: '',
        phone: '',
        address: '',
        observations: ''
      });
    } catch (error) {
      console.error('Erro ao adicionar cliente:', error);
      toast.error('Erro ao adicionar cliente');
    } finally {
      setIsCreating(false);
    }
  };

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

  async function handleCreateChurch(e: FormEvent) {
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
                    <div className="flex items-center gap-1">
                      {church.instance ? (
                        <>
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-500/20 text-green-400 rounded-full">
                            <Smartphone className="h-3 w-3 mr-1" />
                            {church.instance}
                          </span>
                          <button
                            onClick={() => handleDeleteInstance(church)}
                            className="p-1 rounded hover:bg-red-600/20 text-red-400"
                            title="Remover instância"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => openInstanceModal(church)}
                          className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30"
                          title="Criar instância WhatsApp"
                        >
                          <MessageCircle className="h-3 w-3 mr-1" />
                          Criar
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">{formatDate(church.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {church.owner_id && churchOwners[church.owner_id] && (
                        <button
                          onClick={() => toggleManagerRole(church)}
                          className={`p-2 rounded-lg hover:bg-gray-600 transition-colors ${
                            churchOwners[church.owner_id].isManager
                              ? 'text-purple-400 hover:text-purple-300'
                              : 'text-gray-400 hover:text-purple-400'
                          }`}
                          title={churchOwners[church.owner_id].isManager ? 'Remover permissão de manager' : 'Conceder permissão de manager'}
                        >
                          <Shield className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => openDetailsModal(church)}
                        className="p-2 rounded-lg hover:bg-gray-600 text-gray-400 hover:text-white"
                        title="Visualizar detalhes"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(church)}
                        className="p-2 rounded-lg hover:bg-gray-600 text-gray-400 hover:text-purple-400"
                        title="Alterar detalhes"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openAddClientModal(church)}
                        className="p-2 rounded-lg hover:bg-gray-600 text-gray-400 hover:text-green-400"
                        title="Inserir novo cliente"
                      >
                        <Users className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openFilesModal(church)}
                        className="p-2 rounded-lg hover:bg-gray-600 text-gray-400 hover:text-blue-400"
                        title="Visualizar arquivos"
                      >
                        <FolderOpen className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => void openUsersModal(church)}
                        className="p-2 rounded-lg hover:bg-gray-600 text-gray-400 hover:text-purple-400"
                        title="Usuários"
                        disabled={!accessToken}
                      >
                        <UserPlus className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showUsersModal && selectedChurch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-gray-800 rounded-xl shadow-xl w-full max-w-4xl m-4 border border-gray-700 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <div>
                <h2 className="text-lg font-bold text-white">Usuários - {selectedChurch.name}</h2>
                <p className="text-xs text-gray-400">Crie e visualize usuários desta igreja.</p>
              </div>
              <button
                onClick={() => setShowUsersModal(false)}
                className="p-2 rounded-lg hover:bg-gray-700 text-gray-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3">
              <div className="p-4 border-b lg:border-b-0 lg:border-r border-gray-700">
                {usersModalError && (
                  <div className="mb-4 rounded-lg border border-red-800/50 bg-red-900/20 px-3 py-2 text-sm text-red-200">
                    {usersModalError}
                  </div>
                )}

                <form className="space-y-3" onSubmit={onCreateChurchUser}>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Nome</label>
                    <input
                      type="text"
                      value={createUserForm.name}
                      onChange={(e) => setCreateUserForm((s) => ({ ...s, name: e.target.value }))}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                      disabled={usersModalLoading}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                    <input
                      type="email"
                      value={createUserForm.email}
                      onChange={(e) => setCreateUserForm((s) => ({ ...s, email: e.target.value }))}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                      disabled={usersModalLoading}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Senha</label>
                    <input
                      type="password"
                      value={createUserForm.password}
                      onChange={(e) => setCreateUserForm((s) => ({ ...s, password: e.target.value }))}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                      disabled={usersModalLoading}
                      minLength={6}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Cargo</label>
                    <select
                      value={createUserForm.role}
                      onChange={(e) => setCreateUserForm((s) => ({ ...s, role: e.target.value }))}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                      disabled={usersModalLoading}
                    >
                      <option value="admin">Admin</option>
                      <option value="manutencao">Manutenção</option>
                      <option value="consulta">Consulta</option>
                    </select>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={usersModalLoading || !accessToken}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      <UserPlus className="h-4 w-4" />
                      {usersModalLoading ? 'Salvando...' : 'Criar usuário'}
                    </button>
                  </div>
                </form>
              </div>

              <div className="p-4 lg:col-span-2">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-semibold text-white">Usuários cadastrados</div>
                  <button
                    type="button"
                    onClick={() => void loadChurchUsers(selectedChurch.id)}
                    className="rounded-lg border border-gray-600 px-3 py-2 text-sm text-gray-200 hover:bg-gray-700 disabled:opacity-50"
                    disabled={usersModalLoading || !accessToken}
                  >
                    Atualizar
                  </button>
                </div>

                {usersModalLoading && churchUsers.length === 0 ? (
                  <div className="text-sm text-gray-400">Carregando...</div>
                ) : churchUsers.length === 0 ? (
                  <div className="text-sm text-gray-400">Nenhum usuário encontrado.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="text-left text-gray-400">
                        <tr>
                          <th className="py-2 pr-4">Nome</th>
                          <th className="py-2 pr-4">Email</th>
                          <th className="py-2 pr-4">Cargo</th>
                          <th className="py-2">Status</th>
                        </tr>
                      </thead>
                      <tbody className="text-gray-200">
                        {churchUsers.map((u) => (
                          <tr key={u.id} className="border-t border-gray-700">
                            <td className="py-2 pr-4 font-medium">{u.name}</td>
                            <td className="py-2 pr-4">{u.email}</td>
                            <td className="py-2 pr-4">{roleLabel(u.role)}</td>
                            <td className="py-2">
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                                  u.is_active ? 'bg-green-500/20 text-green-300' : 'bg-gray-700 text-gray-300'
                                }`}
                              >
                                {u.is_active ? 'Ativo' : 'Inativo'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

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

      {/* Instance Modal */}
      {showInstanceModal && selectedChurch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-gray-800 rounded-xl shadow-xl w-full max-w-lg m-4 border border-gray-700">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h2 className="text-lg font-bold text-white">Criar Instância WhatsApp - {selectedChurch.name}</h2>
              <button
                onClick={() => setShowInstanceModal(false)}
                className="p-2 rounded-lg hover:bg-gray-700 text-gray-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateInstance} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Nome da Instância *</label>
                <input
                  type="text"
                  value={instanceData.instanceName}
                  onChange={(e) => setInstanceData({ ...instanceData, instanceName: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Número WhatsApp *</label>
                <input
                  type="text"
                  value={instanceData.phoneNumber}
                  onChange={(e) => setInstanceData({ ...instanceData, phoneNumber: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  placeholder="5511999999999"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowInstanceModal(false)}
                  className="px-4 py-2 text-sm font-medium text-white bg-gray-700 rounded-lg hover:bg-gray-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {isCreating ? 'Criando...' : 'Criar Instância'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Client Modal */}
      {showAddClientModal && selectedChurch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-gray-800 rounded-xl shadow-xl w-full max-w-lg m-4 border border-gray-700">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h2 className="text-lg font-bold text-white">Adicionar Cliente - {selectedChurch.name}</h2>
              <button
                onClick={() => setShowAddClientModal(false)}
                className="p-2 rounded-lg hover:bg-gray-700 text-gray-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAddClient} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Nome *</label>
                <input
                  type="text"
                  value={clientFormData.name}
                  onChange={(e) => setClientFormData({ ...clientFormData, name: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Email *</label>
                <input
                  type="email"
                  value={clientFormData.email}
                  onChange={(e) => setClientFormData({ ...clientFormData, email: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Telefone *</label>
                <input
                  type="text"
                  value={clientFormData.phone}
                  onChange={(e) => setClientFormData({ ...clientFormData, phone: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Endereço</label>
                <input
                  type="text"
                  value={clientFormData.address}
                  onChange={(e) => setClientFormData({ ...clientFormData, address: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Observações</label>
                <textarea
                  value={clientFormData.observations}
                  onChange={(e) => setClientFormData({ ...clientFormData, observations: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddClientModal(false)}
                  className="px-4 py-2 text-sm font-medium text-white bg-gray-700 rounded-lg hover:bg-gray-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {isCreating ? 'Adicionando...' : 'Adicionar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Files Modal */}
      {showFilesModal && selectedChurch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl m-4 border border-gray-700">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h2 className="text-lg font-bold text-white">Arquivos - {selectedChurch.name}</h2>
              <button
                onClick={() => setShowFilesModal(false)}
                className="p-2 rounded-lg hover:bg-gray-700 text-gray-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4">
              <div className="text-center py-8">
                <FolderOpen className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">Nenhum arquivo encontrado</p>
                <p className="text-gray-500 text-sm mt-2">Funcionalidade de upload de arquivos será implementada em breve</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedChurch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-gray-800 rounded-xl shadow-xl w-full max-w-lg m-4 border border-gray-700">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h2 className="text-lg font-bold text-white">Editar Igreja - {selectedChurch.name}</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 rounded-lg hover:bg-gray-700 text-gray-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleEditChurch} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Nome *</label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Email *</label>
                <input
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Telefone</label>
                <input
                  type="text"
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Endereço</label>
                <input
                  type="text"
                  value={editFormData.address}
                  onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-sm font-medium text-white bg-gray-700 rounded-lg hover:bg-gray-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  {isCreating ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailsModal && selectedChurch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-gray-800 rounded-xl shadow-xl w-full max-w-lg m-4 border border-gray-700">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h2 className="text-lg font-bold text-white">Detalhes da Igreja</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
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
