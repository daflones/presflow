import { useEffect, useState, useRef, type MouseEvent } from 'react';
import { FileText, Plus, Pencil, Trash2, Eye, X, Search, Check, AlertCircle, Upload, Link } from 'lucide-react';
import { arquivosIAService } from '../services/supabase';
import type { ArquivoIA } from '../types/database';

const CATEGORIAS = [
  'Documentos',
  'Apresentações',
  'Planilhas',
  'Imagens',
  'Vídeos',
  'Áudios',
  'PDFs',
  'Outros',
];

function StatusBadge({ status }: { status: ArquivoIA['status'] }) {
  const styles = {
    ativo: 'bg-green-100 text-green-700',
    inativo: 'bg-gray-100 text-gray-700',
    arquivado: 'bg-yellow-100 text-yellow-700',
  };

  const labels = {
    ativo: 'Ativo',
    inativo: 'Inativo',
    arquivado: 'Arquivado',
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateString?: string): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function ImageWithZoom({ src, alt }: { src: string; alt: string }) {
  const [showZoom, setShowZoom] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const [imageError, setImageError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPosition({ x, y });
  };

  if (imageError) {
    return (
      <div className="flex items-center justify-center h-48 bg-gray-100 rounded-lg">
        <p className="text-sm text-gray-500">Erro ao carregar imagem</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative rounded-lg overflow-hidden bg-gray-100 cursor-zoom-in"
      onMouseEnter={() => setShowZoom(true)}
      onMouseLeave={() => setShowZoom(false)}
      onMouseMove={handleMouseMove}
    >
      <img
        src={src}
        alt={alt}
        className="w-full h-auto max-h-96 object-contain"
        onError={() => setImageError(true)}
      />
      
      {/* Zoom lens indicator */}
      {showZoom && (
        <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
          <Search className="h-3 w-3" />
          Zoom ativo
        </div>
      )}

      {/* Zoom overlay */}
      {showZoom && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `url(${src})`,
            backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
            backgroundSize: '200%',
            backgroundRepeat: 'no-repeat',
            opacity: 1,
          }}
        />
      )}
    </div>
  );
}

function FilePreview({ arquivo }: { arquivo: ArquivoIA }) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!arquivo.url) {
    return (
      <div className="flex items-center justify-center h-48 bg-gray-100 rounded-lg">
        <p className="text-sm text-gray-500">Nenhuma URL disponível</p>
      </div>
    );
  }

  const mimeType = arquivo.tipo_mime || '';
  const isImage = mimeType.startsWith('image/');
  const isPdf = mimeType === 'application/pdf' || arquivo.extensao?.toLowerCase() === 'pdf';
  const isVideo = mimeType.startsWith('video/');
  const isAudio = mimeType.startsWith('audio/');

  if (isImage) {
    return (
      <>
        <div className="relative group">
          <ImageWithZoom src={arquivo.url} alt={arquivo.nome} />
          <button
            onClick={() => setIsFullscreen(true)}
            className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
          >
            <Eye className="h-3 w-3" />
            Tela cheia
          </button>
        </div>

        {/* Fullscreen modal */}
        {isFullscreen && (
          <div
            className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center cursor-zoom-out"
            onClick={() => setIsFullscreen(false)}
          >
            <button
              onClick={() => setIsFullscreen(false)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
            >
              <X className="h-8 w-8" />
            </button>
            <img
              src={arquivo.url}
              alt={arquivo.nome}
              className="max-w-[90vw] max-h-[90vh] object-contain"
            />
          </div>
        )}
      </>
    );
  }

  if (isPdf) {
    return (
      <div className="rounded-lg overflow-hidden border bg-gray-50">
        <iframe
          src={`${arquivo.url}#toolbar=1&navpanes=0&scrollbar=1`}
          className="w-full h-96"
          title={arquivo.nome}
        />
        <div className="p-2 bg-gray-100 border-t flex justify-end">
          <a
            href={arquivo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700"
          >
            <Eye className="h-3 w-3" />
            Abrir em nova aba
          </a>
        </div>
      </div>
    );
  }

  if (isVideo) {
    return (
      <div className="rounded-lg overflow-hidden bg-black">
        <video
          src={arquivo.url}
          controls
          className="w-full max-h-96"
        >
          Seu navegador não suporta vídeos.
        </video>
      </div>
    );
  }

  if (isAudio) {
    return (
      <div className="rounded-lg bg-gray-100 p-4">
        <audio src={arquivo.url} controls className="w-full">
          Seu navegador não suporta áudio.
        </audio>
      </div>
    );
  }

  // Para outros tipos de arquivo, mostrar botão de download/abrir
  return (
    <div className="flex flex-col items-center justify-center h-48 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
      <FileText className="h-12 w-12 text-gray-400 mb-3" />
      <p className="text-sm text-gray-600 mb-3">Pré-visualização não disponível</p>
      <a
        href={arquivo.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100"
      >
        <Eye className="h-4 w-4" />
        Abrir arquivo
      </a>
    </div>
  );
}

export function ArquivosIAPage() {
  const [arquivos, setArquivos] = useState<ArquivoIA[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategoria, setFilterCategoria] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedArquivo, setSelectedArquivo] = useState<ArquivoIA | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    nome: '',
    nome_original: '',
    categoria: '',
    subcategoria: '',
    descricao: '',
    status: 'ativo' as ArquivoIA['status'],
    disponivel_ia: true,
    instrucoes_ia: '',
    contexto_uso: '',
    palavras_chave: '',
    prioridade: 0,
    url: '',
    tipo_mime: '',
    extensao: '',
    tamanho: 0,
    visibilidade: 'privado' as ArquivoIA['visibilidade'],
  });

  useEffect(() => {
    loadArquivos();
  }, []);

  async function loadArquivos() {
    setIsLoading(true);
    try {
      const data = await arquivosIAService.list();
      setArquivos(data);
    } catch (error) {
      console.error('Erro ao carregar arquivos:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function resetForm() {
    setFormData({
      nome: '',
      nome_original: '',
      categoria: '',
      subcategoria: '',
      descricao: '',
      status: 'ativo',
      disponivel_ia: true,
      instrucoes_ia: '',
      contexto_uso: '',
      palavras_chave: '',
      prioridade: 0,
      url: '',
      tipo_mime: '',
      extensao: '',
      tamanho: 0,
      visibilidade: 'privado',
    });
    setSelectedArquivo(null);
    setSelectedFile(null);
    setUploadMode('file');
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Auto-preencher nome se estiver vazio
      if (!formData.nome) {
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
        setFormData(prev => ({ ...prev, nome: nameWithoutExt }));
      }
    }
  }

  function openCreate() {
    resetForm();
    setIsModalOpen(true);
  }

  function openEdit(arquivo: ArquivoIA) {
    setSelectedArquivo(arquivo);
    setFormData({
      nome: arquivo.nome,
      nome_original: arquivo.nome_original || '',
      categoria: arquivo.categoria || '',
      subcategoria: arquivo.subcategoria || '',
      descricao: arquivo.descricao || '',
      status: arquivo.status,
      disponivel_ia: arquivo.disponivel_ia,
      instrucoes_ia: arquivo.instrucoes_ia || '',
      contexto_uso: arquivo.contexto_uso || '',
      palavras_chave: arquivo.palavras_chave?.join(', ') || '',
      prioridade: arquivo.prioridade,
      url: arquivo.url || '',
      tipo_mime: arquivo.tipo_mime || '',
      extensao: arquivo.extensao || '',
      tamanho: arquivo.tamanho || 0,
      visibilidade: arquivo.visibilidade,
    });
    setIsModalOpen(true);
  }

  function openView(arquivo: ArquivoIA) {
    setSelectedArquivo(arquivo);
    setIsViewModalOpen(true);
  }

  async function handleSave() {
    if (!formData.nome.trim()) {
      alert('Nome é obrigatório');
      return;
    }

    // Validar: precisa de arquivo ou URL para criar novo
    if (!selectedArquivo && uploadMode === 'file' && !selectedFile) {
      alert('Selecione um arquivo para upload');
      return;
    }

    if (!selectedArquivo && uploadMode === 'url' && !formData.url.trim()) {
      alert('Informe a URL do arquivo');
      return;
    }

    setIsSaving(true);
    setIsUploading(uploadMode === 'file' && !!selectedFile);
    
    try {
      const palavrasChaveArray = formData.palavras_chave
        .split(',')
        .map(p => p.trim())
        .filter(Boolean);

      if (selectedArquivo) {
        // Atualizar arquivo existente
        const payload = {
          nome: formData.nome,
          categoria: formData.categoria || undefined,
          subcategoria: formData.subcategoria || undefined,
          descricao: formData.descricao || undefined,
          status: formData.status,
          disponivel_ia: formData.disponivel_ia,
          instrucoes_ia: formData.instrucoes_ia || undefined,
          contexto_uso: formData.contexto_uso || undefined,
          palavras_chave: palavrasChaveArray.length > 0 ? palavrasChaveArray : undefined,
          prioridade: formData.prioridade,
          visibilidade: formData.visibilidade,
        };
        await arquivosIAService.update(selectedArquivo.id, payload);
      } else if (uploadMode === 'file' && selectedFile) {
        // Upload de arquivo para Supabase Storage
        await arquivosIAService.uploadAndCreate(selectedFile, {
          nome: formData.nome,
          categoria: formData.categoria || undefined,
          subcategoria: formData.subcategoria || undefined,
          descricao: formData.descricao || undefined,
          status: formData.status,
          disponivel_ia: formData.disponivel_ia,
          processado_ia: false,
          instrucoes_ia: formData.instrucoes_ia || undefined,
          contexto_uso: formData.contexto_uso || undefined,
          palavras_chave: palavrasChaveArray.length > 0 ? palavrasChaveArray : undefined,
          prioridade: formData.prioridade,
          visibilidade: formData.visibilidade,
          versao: 1,
        });
      } else {
        // Criar com URL externa
        const payload = {
          nome: formData.nome,
          nome_original: formData.nome_original || undefined,
          categoria: formData.categoria || undefined,
          subcategoria: formData.subcategoria || undefined,
          descricao: formData.descricao || undefined,
          status: formData.status,
          disponivel_ia: formData.disponivel_ia,
          processado_ia: false,
          instrucoes_ia: formData.instrucoes_ia || undefined,
          contexto_uso: formData.contexto_uso || undefined,
          palavras_chave: palavrasChaveArray.length > 0 ? palavrasChaveArray : undefined,
          prioridade: formData.prioridade,
          url: formData.url || undefined,
          tipo_mime: formData.tipo_mime || undefined,
          extensao: formData.extensao || undefined,
          tamanho: formData.tamanho || undefined,
          visibilidade: formData.visibilidade,
          versao: 1,
        };
        await arquivosIAService.create(payload);
      }

      setIsModalOpen(false);
      resetForm();
      loadArquivos();
    } catch (error) {
      console.error('Erro ao salvar arquivo:', error);
      alert('Erro ao salvar arquivo. Tente novamente.');
    } finally {
      setIsSaving(false);
      setIsUploading(false);
    }
  }

  async function handleDelete(arquivo: ArquivoIA) {
    if (!confirm(`Tem certeza que deseja excluir "${arquivo.nome}"?`)) return;

    try {
      await arquivosIAService.delete(arquivo.id);
      loadArquivos();
    } catch (error) {
      console.error('Erro ao excluir arquivo:', error);
      alert('Erro ao excluir arquivo. Tente novamente.');
    }
  }

  const filteredArquivos = arquivos.filter(arquivo => {
    const matchesSearch = arquivo.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      arquivo.descricao?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategoria = !filterCategoria || arquivo.categoria === filterCategoria;
    const matchesStatus = !filterStatus || arquivo.status === filterStatus;
    return matchesSearch && matchesCategoria && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Arquivos IA</h1>
          <p className="text-sm text-gray-500">Gerencie os documentos e arquivos disponíveis para o agente de IA.</p>
        </div>

        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-md bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-purple-700"
        >
          <Plus className="h-4 w-4" />
          Novo Arquivo
        </button>
      </div>

      {/* Filters */}
      <div className="rounded-xl border bg-white p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar arquivos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-md border border-gray-200 pl-10 pr-4 py-2 text-sm outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={filterCategoria}
              onChange={(e) => setFilterCategoria(e.target.value)}
              className="rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100"
            >
              <option value="">Todas categorias</option>
              {CATEGORIAS.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100"
            >
              <option value="">Todos status</option>
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
              <option value="arquivado">Arquivado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : filteredArquivos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <FileText className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">Nenhum arquivo encontrado</p>
            <p className="text-sm">Clique em "Novo Arquivo" para adicionar um documento.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Nome</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Categoria</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Disponível IA</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Tamanho</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Criado em</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredArquivos.map((arquivo) => (
                <tr key={arquivo.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{arquivo.nome}</p>
                        {arquivo.extensao && (
                          <p className="text-xs text-gray-500">.{arquivo.extensao}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{arquivo.categoria || '-'}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={arquivo.status} />
                  </td>
                  <td className="px-4 py-3">
                    {arquivo.disponivel_ia ? (
                      <span className="inline-flex items-center gap-1 text-green-600">
                        <Check className="h-4 w-4" />
                        <span className="text-xs">Sim</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-gray-400">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-xs">Não</span>
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{formatFileSize(arquivo.tamanho)}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{formatDate(arquivo.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openView(arquivo)}
                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                        title="Visualizar"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openEdit(arquivo)}
                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(arquivo)}
                        className="p-2 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-bold text-gray-900">
                {selectedArquivo ? 'Editar Arquivo' : 'Novo Arquivo'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100"
                    placeholder="Nome do arquivo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                  <select
                    value={formData.categoria}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100"
                  >
                    <option value="">Selecione...</option>
                    {CATEGORIAS.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as ArquivoIA['status'] })}
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100"
                  >
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo</option>
                    <option value="arquivado">Arquivado</option>
                  </select>
                </div>

                {/* Upload Section - Only show for new files */}
                {!selectedArquivo && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Origem do Arquivo *</label>
                    
                    {/* Toggle buttons */}
                    <div className="flex gap-2 mb-3">
                      <button
                        type="button"
                        onClick={() => setUploadMode('file')}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                          uploadMode === 'file'
                            ? 'bg-purple-50 border-purple-300 text-purple-700'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <Upload className="h-4 w-4" />
                        Upload de Arquivo
                      </button>
                      <button
                        type="button"
                        onClick={() => setUploadMode('url')}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                          uploadMode === 'url'
                            ? 'bg-purple-50 border-purple-300 text-purple-700'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <Link className="h-4 w-4" />
                        URL Externa
                      </button>
                    </div>

                    {/* File Upload */}
                    {uploadMode === 'file' && (
                      <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center hover:border-purple-300 transition-colors">
                        <input
                          type="file"
                          id="file-upload"
                          className="hidden"
                          onChange={handleFileSelect}
                        />
                        <label htmlFor="file-upload" className="cursor-pointer">
                          {selectedFile ? (
                            <div className="space-y-2">
                              <div className="flex items-center justify-center gap-2 text-purple-600">
                                <FileText className="h-8 w-8" />
                              </div>
                              <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                              <p className="text-xs text-gray-500">
                                {(selectedFile.size / 1024).toFixed(1)} KB • Clique para trocar
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <Upload className="h-10 w-10 mx-auto text-gray-400" />
                              <p className="text-sm font-medium text-gray-700">
                                Clique para selecionar um arquivo
                              </p>
                              <p className="text-xs text-gray-500">
                                PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, imagens, etc.
                              </p>
                            </div>
                          )}
                        </label>
                      </div>
                    )}

                    {/* URL Input */}
                    {uploadMode === 'url' && (
                      <input
                        type="url"
                        value={formData.url}
                        onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                        className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100"
                        placeholder="https://exemplo.com/arquivo.pdf"
                      />
                    )}
                  </div>
                )}

                {/* Show current file info when editing */}
                {selectedArquivo && selectedArquivo.url && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Arquivo Atual</label>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <FileText className="h-8 w-8 text-purple-600" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {selectedArquivo.nome_original || selectedArquivo.nome}
                        </p>
                        <a
                          href={selectedArquivo.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-purple-600 hover:underline truncate block"
                        >
                          {selectedArquivo.url}
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                  <textarea
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    rows={2}
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100 resize-none"
                    placeholder="Descrição do arquivo..."
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Instruções para IA</label>
                  <textarea
                    value={formData.instrucoes_ia}
                    onChange={(e) => setFormData({ ...formData, instrucoes_ia: e.target.value })}
                    rows={3}
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100 resize-none"
                    placeholder="Instruções de como a IA deve usar este arquivo..."
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contexto de Uso</label>
                  <textarea
                    value={formData.contexto_uso}
                    onChange={(e) => setFormData({ ...formData, contexto_uso: e.target.value })}
                    rows={2}
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100 resize-none"
                    placeholder="Em qual contexto este arquivo deve ser usado..."
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Palavras-chave</label>
                  <input
                    type="text"
                    value={formData.palavras_chave}
                    onChange={(e) => setFormData({ ...formData, palavras_chave: e.target.value })}
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100"
                    placeholder="palavra1, palavra2, palavra3..."
                  />
                  <p className="text-xs text-gray-500 mt-1">Separe as palavras-chave por vírgula</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prioridade</label>
                  <input
                    type="number"
                    value={formData.prioridade}
                    onChange={(e) => setFormData({ ...formData, prioridade: parseInt(e.target.value) || 0 })}
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100"
                    min="0"
                    max="100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Visibilidade</label>
                  <select
                    value={formData.visibilidade}
                    onChange={(e) => setFormData({ ...formData, visibilidade: e.target.value as ArquivoIA['visibilidade'] })}
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100"
                  >
                    <option value="privado">Privado</option>
                    <option value="publico">Público</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.disponivel_ia}
                      onChange={(e) => setFormData({ ...formData, disponivel_ia: e.target.checked })}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Disponível para IA</span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1">Quando ativado, a IA poderá usar este arquivo nas conversas</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-4 border-t bg-gray-50">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50"
              >
                {isSaving ? (isUploading ? 'Enviando arquivo...' : 'Salvando...') : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {isViewModalOpen && selectedArquivo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-bold text-gray-900">Detalhes do Arquivo</h2>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                  <FileText className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedArquivo.nome}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <StatusBadge status={selectedArquivo.status} />
                    {selectedArquivo.disponivel_ia && (
                      <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                        <Check className="h-3 w-3" />
                        Disponível para IA
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Pré-visualização do arquivo */}
              <div className="pt-4 border-t">
                <p className="text-xs text-gray-500 uppercase font-medium mb-3">Pré-visualização</p>
                <FilePreview arquivo={selectedArquivo} />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Categoria</p>
                  <p className="text-sm text-gray-900">{selectedArquivo.categoria || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Subcategoria</p>
                  <p className="text-sm text-gray-900">{selectedArquivo.subcategoria || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Tamanho</p>
                  <p className="text-sm text-gray-900">{formatFileSize(selectedArquivo.tamanho)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Tipo</p>
                  <p className="text-sm text-gray-900">{selectedArquivo.tipo_mime || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Visualizações</p>
                  <p className="text-sm text-gray-900">{selectedArquivo.visualizacoes}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Downloads</p>
                  <p className="text-sm text-gray-900">{selectedArquivo.downloads}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Prioridade</p>
                  <p className="text-sm text-gray-900">{selectedArquivo.prioridade}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Versão</p>
                  <p className="text-sm text-gray-900">{selectedArquivo.versao}</p>
                </div>
              </div>

              {selectedArquivo.descricao && (
                <div className="pt-4 border-t">
                  <p className="text-xs text-gray-500 uppercase font-medium mb-1">Descrição</p>
                  <p className="text-sm text-gray-900">{selectedArquivo.descricao}</p>
                </div>
              )}

              {selectedArquivo.instrucoes_ia && (
                <div className="pt-4 border-t">
                  <p className="text-xs text-gray-500 uppercase font-medium mb-1">Instruções para IA</p>
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedArquivo.instrucoes_ia}</p>
                </div>
              )}

              {selectedArquivo.contexto_uso && (
                <div className="pt-4 border-t">
                  <p className="text-xs text-gray-500 uppercase font-medium mb-1">Contexto de Uso</p>
                  <p className="text-sm text-gray-900">{selectedArquivo.contexto_uso}</p>
                </div>
              )}

              {selectedArquivo.palavras_chave && selectedArquivo.palavras_chave.length > 0 && (
                <div className="pt-4 border-t">
                  <p className="text-xs text-gray-500 uppercase font-medium mb-2">Palavras-chave</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedArquivo.palavras_chave.map((palavra, index) => (
                      <span key={index} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                        {palavra}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Criado em</p>
                  <p className="text-sm text-gray-900">{formatDate(selectedArquivo.created_at)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Última utilização IA</p>
                  <p className="text-sm text-gray-900">{formatDate(selectedArquivo.ultima_utilizacao_ia)}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-4 border-t bg-gray-50">
              <button
                onClick={() => {
                  setIsViewModalOpen(false);
                  openEdit(selectedArquivo);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
              >
                <Pencil className="h-4 w-4" />
                Editar
              </button>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-white bg-purple-600 rounded-md hover:bg-purple-700"
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
