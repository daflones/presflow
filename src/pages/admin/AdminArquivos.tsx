import { useEffect, useState } from 'react';
import { FileText, Search, Eye, Church, Check, X } from 'lucide-react';
import { adminService } from '../../services/supabase/admin';
import type { ArquivoIA, Church as ChurchType } from '../../types/database';
import { useSearchParams } from 'react-router-dom';

function formatDate(dateString?: string): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function StatusBadge({ status }: { status: ArquivoIA['status'] }) {
  const styles = {
    ativo: 'bg-green-500/20 text-green-400',
    inativo: 'bg-gray-500/20 text-gray-400',
    arquivado: 'bg-yellow-500/20 text-yellow-400',
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status]}`}>
      {status}
    </span>
  );
}

export function AdminArquivos() {
  const [searchParams] = useSearchParams();
  const churchIdParam = searchParams.get('church');

  const [arquivos, setArquivos] = useState<(ArquivoIA & { church?: ChurchType })[]>([]);
  const [churches, setChurches] = useState<ChurchType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterChurch, setFilterChurch] = useState(churchIdParam || '');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedArquivo, setSelectedArquivo] = useState<ArquivoIA & { church?: ChurchType } | null>(null);

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
      const [arquivosData, churchesData] = await Promise.all([
        adminService.listAllArquivos(),
        adminService.listChurches(),
      ]);
      setArquivos(arquivosData);
      setChurches(churchesData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const filteredArquivos = arquivos.filter(arquivo => {
    const matchesSearch = arquivo.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      arquivo.categoria?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesChurch = !filterChurch || arquivo.church_id === filterChurch;
    const matchesStatus = !filterStatus || arquivo.status === filterStatus;
    return matchesSearch && matchesChurch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Arquivos IA</h1>
        <p className="text-gray-400 mt-1">Visualize os arquivos de IA de todas as igrejas</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar por nome ou categoria..."
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
          <option value="ativo">Ativo</option>
          <option value="inativo">Inativo</option>
          <option value="arquivado">Arquivado</option>
        </select>
      </div>

      {/* Stats */}
      <div className="flex gap-4 text-sm">
        <span className="text-gray-400">
          Total: <span className="text-white font-medium">{filteredArquivos.length}</span>
        </span>
        <span className="text-gray-400">
          Disponíveis para IA: <span className="text-green-400 font-medium">{filteredArquivos.filter(a => a.disponivel_ia).length}</span>
        </span>
      </div>

      {/* Table */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          </div>
        ) : filteredArquivos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <FileText className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">Nenhum arquivo encontrado</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-900/50 border-b border-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Arquivo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Igreja</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Categoria</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Disponível IA</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Tamanho</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Criado em</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredArquivos.map((arquivo) => (
                <tr key={arquivo.id} className="hover:bg-gray-700/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/20 text-purple-400">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{arquivo.nome}</p>
                        {arquivo.extensao && (
                          <p className="text-xs text-gray-500">.{arquivo.extensao}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Church className="h-4 w-4 text-blue-400" />
                      <span className="text-sm text-gray-300">{arquivo.church?.name || '-'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">
                    {arquivo.categoria || '-'}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={arquivo.status} />
                  </td>
                  <td className="px-4 py-3">
                    {arquivo.disponivel_ia ? (
                      <Check className="h-4 w-4 text-green-400" />
                    ) : (
                      <X className="h-4 w-4 text-gray-500" />
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">
                    {formatFileSize(arquivo.tamanho)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">
                    {formatDate(arquivo.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setSelectedArquivo(arquivo)}
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
      {selectedArquivo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4 border border-gray-700">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h2 className="text-lg font-bold text-white">Detalhes do Arquivo</h2>
              <button
                onClick={() => setSelectedArquivo(null)}
                className="p-2 rounded-lg hover:bg-gray-700 text-gray-400"
              >
                ✕
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400">
                  <FileText className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{selectedArquivo.nome}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <StatusBadge status={selectedArquivo.status} />
                    {selectedArquivo.disponivel_ia && (
                      <span className="px-2 py-1 text-xs font-medium bg-green-500/20 text-green-400 rounded-full">
                        Disponível para IA
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Preview */}
              {selectedArquivo.url && selectedArquivo.tipo_mime?.startsWith('image/') && (
                <div className="pt-4 border-t border-gray-700">
                  <p className="text-xs text-gray-500 uppercase mb-2">Pré-visualização</p>
                  <img
                    src={selectedArquivo.url}
                    alt={selectedArquivo.nome}
                    className="max-h-64 rounded-lg object-contain bg-gray-900"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-700">
                <div>
                  <p className="text-xs text-gray-500 uppercase">Igreja</p>
                  <p className="text-sm text-white">{selectedArquivo.church?.name || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Categoria</p>
                  <p className="text-sm text-white">{selectedArquivo.categoria || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Tipo MIME</p>
                  <p className="text-sm text-white">{selectedArquivo.tipo_mime || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Tamanho</p>
                  <p className="text-sm text-white">{formatFileSize(selectedArquivo.tamanho)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Prioridade</p>
                  <p className="text-sm text-white">{selectedArquivo.prioridade}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Visualizações</p>
                  <p className="text-sm text-white">{selectedArquivo.visualizacoes}</p>
                </div>
              </div>

              {selectedArquivo.descricao && (
                <div className="pt-4 border-t border-gray-700">
                  <p className="text-xs text-gray-500 uppercase mb-1">Descrição</p>
                  <p className="text-sm text-white">{selectedArquivo.descricao}</p>
                </div>
              )}

              {selectedArquivo.instrucoes_ia && (
                <div className="pt-4 border-t border-gray-700">
                  <p className="text-xs text-gray-500 uppercase mb-1">Instruções para IA</p>
                  <p className="text-sm text-white whitespace-pre-wrap">{selectedArquivo.instrucoes_ia}</p>
                </div>
              )}

              {selectedArquivo.contexto_uso && (
                <div className="pt-4 border-t border-gray-700">
                  <p className="text-xs text-gray-500 uppercase mb-1">Contexto de Uso</p>
                  <p className="text-sm text-white">{selectedArquivo.contexto_uso}</p>
                </div>
              )}

              {selectedArquivo.palavras_chave && selectedArquivo.palavras_chave.length > 0 && (
                <div className="pt-4 border-t border-gray-700">
                  <p className="text-xs text-gray-500 uppercase mb-2">Palavras-chave</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedArquivo.palavras_chave.map((palavra, i) => (
                      <span key={i} className="px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded-full">
                        {palavra}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-gray-700">
              {selectedArquivo.url && (
                <a
                  href={selectedArquivo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 text-sm font-medium text-purple-400 bg-purple-500/20 rounded-lg hover:bg-purple-500/30"
                >
                  Abrir arquivo
                </a>
              )}
              <button
                onClick={() => setSelectedArquivo(null)}
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
