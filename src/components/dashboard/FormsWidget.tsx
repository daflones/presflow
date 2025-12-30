import { useEffect, useState } from 'react';
import { formsService, type FormResponse } from '../../services/supabase/forms';
import { Loader2, FileText, User, Phone, Calendar, Clock } from 'lucide-react';

export function FormsWidget() {
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadResponses = async () => {
      try {
        setIsLoading(true);
        const data = await formsService.getLatestResponses();
        setResponses(data);
      } catch (error) {
        console.error('Erro ao carregar respostas de formulários:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadResponses();
  }, []);

  return (
    <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white flex items-center">
          <FileText className="w-5 h-5 mr-3 text-purple-400" />
          Formulários Recebidos
        </h2>
        <a href="#" className="text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors">
          Ver Todos
        </a>
      </div>

      {isLoading ? (
        <div className="flex-grow flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
        </div>
      ) : responses.length === 0 ? (
        <div className="flex-grow flex items-center justify-center">
          <p className="text-gray-400">Nenhum formulário recebido ainda.</p>
        </div>
      ) : (
        <div className="space-y-4 overflow-y-auto flex-grow">
          {responses.map((response) => (
            <div key={response.id} className="bg-gray-700/50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-white flex items-center"><User className="w-4 h-4 mr-2 text-gray-400" />{response.nome}</p>
                <span className={`px-2 py-1 text-xs font-bold rounded-full ${response.status === 'novo' ? 'bg-blue-500/20 text-blue-300' : 'bg-green-500/20 text-green-300'}`}>
                  {response.status}
                </span>
              </div>
              <div className="text-sm text-gray-400 space-y-1">
                {response.telefone && <p className="flex items-center"><Phone className="w-4 h-4 mr-2" /> {response.telefone}</p>}
                <p className="flex items-center"><Calendar className="w-4 h-4 mr-2" /> Visita em: {new Date(response.data_visita).toLocaleDateString()}</p>
                <p className="flex items-center"><Clock className="w-4 h-4 mr-2" /> Recebido em: {new Date(response.created_at).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
