import { useEffect, useMemo, useState } from 'react';
import { Shield, Trash2, UserPlus, Users as UsersIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

type ChurchUser = {
  id: string;
  auth_id: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

function roleLabel(role: string) {
  const r = String(role || '').toLowerCase();
  if (r === 'admin') return 'Admin';
  if (r === 'manutencao') return 'Manutenção';
  if (r === 'consulta') return 'Consulta';
  return role;
}

export function UsersPage() {
  const { session, church, canManageChurchUsers, isOwner, isChurchAdmin, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<ChurchUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'consulta' });

  const accessToken = session?.access_token;
  const churchId = church?.id;

  const createRoleOptions = useMemo(() => {
    if (isOwner) return ['admin', 'manutencao', 'consulta'];
    if (isChurchAdmin) return ['manutencao', 'consulta'];
    return [];
  }, [isOwner, isChurchAdmin]);

  const loadUsers = async () => {
    if (!accessToken || !churchId) return;
    setLoading(true);
    setError(null);
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

      setUsers((data?.users || []) as ChurchUser[]);
    } catch (e: any) {
      setError(e?.message || 'Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!canManageChurchUsers) return;
    void loadUsers();
  }, [accessToken, churchId, canManageChurchUsers]);

  const onDeleteUser = async (targetUser: ChurchUser) => {
    if (!accessToken || !churchId) return;

    const isSelf = !!user?.id && String(targetUser.auth_id) === String(user.id);
    if (isSelf) {
      setError('Não é permitido excluir seu próprio usuário');
      return;
    }

    if (church?.owner_id && String(targetUser.auth_id) === String(church.owner_id)) {
      setError('Não é permitido excluir o dono da igreja');
      return;
    }

    if (!confirm(`Tem certeza que deseja excluir o usuário ${targetUser.name}?`)) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/delete-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          churchId,
          userId: targetUser.id,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || 'Falha ao excluir usuário');
      }

      await loadUsers();
    } catch (e: any) {
      setError(e?.message || 'Erro ao excluir usuário');
    } finally {
      setLoading(false);
    }
  };

  const onCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !churchId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          churchId,
          userName: form.name,
          email: form.email,
          password: form.password,
          role: form.role,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || 'Falha ao criar usuário');
      }

      setForm({ name: '', email: '', password: '', role: 'consulta' });
      await loadUsers();
    } catch (e: any) {
      setError(e?.message || 'Erro ao criar usuário');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuários</h1>
          <p className="text-sm text-gray-500">Gerencie os acessos dos funcionários da sua igreja.</p>
        </div>
      </div>

      {!canManageChurchUsers && (
        <div className="rounded-xl border bg-white p-4 text-sm text-gray-600">
          Você não tem permissão para acessar esta página.
        </div>
      )}

      {canManageChurchUsers && (
        <>
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 rounded-xl border bg-white shadow-sm overflow-hidden">
              <div className="p-6 border-b">
                <div className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-purple-600" />
                  <h2 className="text-lg font-bold text-gray-900">Criar acesso</h2>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {isOwner ? 'Dono pode criar Admin, Manutenção e Consulta.' : 'Admin pode criar Manutenção e Consulta.'}
                </p>
              </div>

              <form className="p-6 space-y-4" onSubmit={onCreateUser}>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nome</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                    className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                    placeholder="Nome do funcionário"
                    disabled={loading}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
                    className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                    placeholder="email@exemplo.com"
                    disabled={loading}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Senha</label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
                    className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                    placeholder="mínimo 6 caracteres"
                    disabled={loading}
                    minLength={6}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Cargo</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm((s) => ({ ...s, role: e.target.value }))}
                    className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                    disabled={loading}
                  >
                    {createRoleOptions.map((r) => (
                      <option key={r} value={r}>
                        {roleLabel(r)}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={loading || createRoleOptions.length === 0}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  <Shield className="h-4 w-4" />
                  Criar usuário
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 rounded-xl border bg-white shadow-sm overflow-hidden">
              <div className="p-6 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UsersIcon className="h-5 w-5 text-blue-600" />
                  <h2 className="text-lg font-bold text-gray-900">Usuários da igreja</h2>
                </div>
                <button
                  type="button"
                  onClick={() => void loadUsers()}
                  className="rounded-lg border px-3 py-2 text-sm"
                  disabled={loading}
                >
                  Atualizar
                </button>
              </div>

              <div className="p-6">
                {users.length === 0 ? (
                  <div className="text-sm text-gray-500">Nenhum usuário encontrado.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="text-left text-gray-500">
                        <tr>
                          <th className="py-2">Nome</th>
                          <th className="py-2">Email</th>
                          <th className="py-2">Cargo</th>
                          <th className="py-2">Status</th>
                          <th className="py-2 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="text-gray-900">
                        {users.map((u) => (
                          <tr key={u.id} className="border-t">
                            <td className="py-2 font-medium">{u.name}</td>
                            <td className="py-2">{u.email}</td>
                            <td className="py-2">{roleLabel(u.role)}</td>
                            <td className="py-2">
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                                  u.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {u.is_active ? 'Ativo' : 'Inativo'}
                              </span>
                            </td>
                            <td className="py-2 text-right">
                              <button
                                type="button"
                                onClick={() => void onDeleteUser(u)}
                                disabled={
                                  loading ||
                                  (user?.id ? String(u.auth_id) === String(user.id) : false) ||
                                  (church?.owner_id ? String(u.auth_id) === String(church.owner_id) : false) ||
                                  (!isOwner && String(u.role || '').toLowerCase() === 'admin')
                                }
                                className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                                title="Excluir usuário"
                              >
                                <Trash2 className="h-4 w-4" />
                                Excluir
                              </button>
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

          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
            <div className="font-semibold">Regras</div>
            <div>
              {isOwner ? 'Dono pode criar Admin, Manutenção e Consulta.' : 'Admin pode criar Manutenção e Consulta (não pode criar Admin).'}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
