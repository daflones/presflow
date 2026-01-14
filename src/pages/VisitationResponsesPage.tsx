import { useEffect, useMemo, useState } from 'react';
import { Loader2, Search, FileText, Phone, Calendar, Clock, X } from 'lucide-react';
import { getUserData } from '../lib/user';
import { visitationResponsesService } from '../services/supabase';
import type { VisitationFormResponse } from '../types/database';

export function VisitationResponsesPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [responses, setResponses] = useState<VisitationFormResponse[]>([]);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<VisitationFormResponse | null>(null);
  const [isLoadingSelected, setIsLoadingSelected] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setIsLoading(true);
        const profile = await getUserData();
        if (!profile?.church_id) {
          if (!mounted) return;
          setResponses([]);
          return;
        }
        const data = await visitationResponsesService.listByChurch(profile.church_id);
        if (!mounted) return;
        setResponses(data || []);
      } catch {
        if (!mounted) return;
        setResponses([]);
      } finally {
        if (!mounted) return;
        setIsLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    async function loadSelected() {
      if (!selectedId) {
        setSelected(null);
        return;
      }
      try {
        setIsLoadingSelected(true);
        const data = await visitationResponsesService.getById(selectedId);
        if (!mounted) return;
        setSelected(data);
      } catch {
        if (!mounted) return;
        setSelected(null);
      } finally {
        if (!mounted) return;
        setIsLoadingSelected(false);
      }
    }
    loadSelected();
    return () => {
      mounted = false;
    };
  }, [selectedId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return responses;
    return responses.filter((r) => {
      const hay = [r.nome, r.email || '', r.telefone || '', r.status || ''].join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [responses, query]);

  const details = useMemo(() => {
    if (!selected) return [] as Array<{ label: string; value: any }>;
    const base: Array<{ label: string; value: any }> = [
      { label: 'Nome', value: selected.nome },
      { label: 'Email', value: selected.email },
      { label: 'Telefone', value: selected.telefone },
      { label: 'Data de nascimento', value: selected.data_nascimento },
      { label: 'Endereço', value: selected.endereco },
      { label: 'Bairro', value: selected.bairro },
      { label: 'Cidade', value: selected.cidade },
      { label: 'Estado', value: selected.estado },
      { label: 'CEP', value: selected.cep },
      { label: 'Como conheceu', value: selected.como_conheceu },
      { label: 'Motivo da visita', value: selected.motivo_visita },
      { label: 'Pedido de oração', value: selected.pedido_oracao },
      { label: 'Já frequenta igreja?', value: selected.ja_frequenta_igreja },
      { label: 'Qual igreja', value: selected.qual_igreja },
      { label: 'Deseja receber visita?', value: selected.deseja_receber_visita },
      { label: 'Melhor horário contato', value: selected.melhor_horario_contato },
      { label: 'Observações', value: selected.observacoes },
      { label: 'Status', value: selected.status },
      { label: 'Notas acompanhamento', value: selected.notas_acompanhamento },
      { label: 'Data visita', value: selected.data_visita },
      { label: 'Recebido em', value: selected.created_at },
    ];

    const custom = selected.campos_personalizados_respostas || {};
    for (const [k, v] of Object.entries(custom)) {
      base.push({ label: k, value: v });
    }
    return base;
  }, [selected]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Formulários de Visitação</h1>
          <p className="text-sm text-gray-400">Respostas recebidas do formulário de visitação.</p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-700/50 bg-gray-800/50 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nome, email, telefone..."
            className="w-full rounded-xl border border-gray-700 bg-gray-900/40 px-9 py-2.5 text-sm text-white placeholder:text-gray-500 outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
          <span className="ml-2 text-gray-400">Carregando formulários...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-gray-700/50 bg-gray-800/50 p-10 text-center text-sm text-gray-400">
          Nenhum formulário encontrado.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setSelectedId(r.id)}
              className="w-full text-left rounded-2xl border border-gray-700/50 bg-gray-800/50 p-5 hover:bg-gray-800/70 transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-white font-semibold">
                    <FileText className="h-4 w-4 text-purple-400" />
                    <span>{r.nome}</span>
                  </div>
                  <div className="mt-2 text-sm text-gray-300 space-y-1">
                    {r.telefone ? (
                      <div className="flex items-center gap-2"><Phone className="h-4 w-4" />{r.telefone}</div>
                    ) : null}
                    <div className="flex items-center gap-2"><Calendar className="h-4 w-4" />Visita em: {new Date(r.data_visita).toLocaleDateString('pt-BR')}</div>
                    <div className="flex items-center gap-2"><Clock className="h-4 w-4" />Recebido em: {new Date(r.created_at).toLocaleString('pt-BR')}</div>
                  </div>
                </div>
                <span className={`shrink-0 px-2 py-1 text-xs font-bold rounded-full ${r.status === 'novo' ? 'bg-blue-500/20 text-blue-300' : 'bg-green-500/20 text-green-300'}`}>
                  {r.status}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {selectedId ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setSelectedId(null);
          }}
        >
          <div className="flex w-full max-w-2xl max-h-[85vh] flex-col overflow-hidden rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <h2 className="text-base font-bold text-gray-900">Detalhes do formulário</h2>
                {selected?.created_at ? (
                  <p className="text-sm text-gray-500">Recebido em {new Date(selected.created_at).toLocaleString('pt-BR')}</p>
                ) : null}
              </div>
              <button onClick={() => setSelectedId(null)} className="rounded-md p-2 text-gray-500 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {isLoadingSelected ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
                </div>
              ) : selected ? (
                <div className="space-y-3">
                  {details
                    .filter((d) => d.value !== undefined && d.value !== null && String(d.value).trim() !== '')
                    .map((d) => {
                      const value =
                        typeof d.value === 'boolean'
                          ? d.value
                            ? 'Sim'
                            : 'Não'
                          : d.label === 'Recebido em'
                            ? new Date(String(d.value)).toLocaleString('pt-BR')
                            : d.label === 'Data visita' || d.label === 'Data de nascimento'
                              ? new Date(String(d.value)).toLocaleDateString('pt-BR')
                              : typeof d.value === 'object'
                                ? JSON.stringify(d.value)
                                : String(d.value);

                      return (
                        <div key={d.label} className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                          <div className="text-xs font-semibold text-gray-500">{d.label}</div>
                          <div className="mt-1 text-sm font-semibold text-gray-900 break-words">{value}</div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className="py-10 text-center text-sm text-gray-600">Não foi possível carregar o formulário.</div>
              )}
            </div>

            <div className="border-t bg-white px-5 py-4 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                className="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
