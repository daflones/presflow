import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Church, 
  Send, 
  Loader2, 
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { VisitationFormConfig, VisitationFieldsConfig } from '../types/database';

export function PublicVisitationForm() {
  const { slug } = useParams<{ slug: string }>();
  const [config, setConfig] = useState<VisitationFormConfig | null>(null);
  const [churchData, setChurchData] = useState<{ name: string; logo_url?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});

  useEffect(() => {
    loadFormConfig();
  }, [slug]);

  const loadFormConfig = async () => {
    if (!slug) return;

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('visitation_form_config')
        .select('*, churches(name, logo_url)')
        .eq('slug', slug)
        .eq('ativo', true)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          setError('Formulário não encontrado');
        } else {
          setError('Erro ao carregar formulário');
        }
        return;
      }

      setConfig(data);
      if (data.churches) {
        setChurchData({
          name: data.churches.name,
          logo_url: data.churches.logo_url,
        });
      }
    } catch (err) {
      console.error('Erro ao carregar formulário:', err);
      setError('Erro ao carregar formulário');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;

    try {
      setIsSubmitting(true);
      setError(null);

      // Preparar dados para envio
      const responseData = {
        church_id: config.church_id,
        form_config_id: config.id,
        nome: formData.nome || '',
        email: formData.email || null,
        telefone: formData.telefone || null,
        data_nascimento: formData.data_nascimento || null,
        endereco: formData.endereco || null,
        bairro: formData.bairro || null,
        cidade: formData.cidade || null,
        estado: formData.estado || null,
        cep: formData.cep || null,
        como_conheceu: formData.como_conheceu || null,
        motivo_visita: formData.motivo_visita || null,
        pedido_oracao: formData.pedido_oracao || null,
        ja_frequenta_igreja: formData.ja_frequenta_igreja || false,
        qual_igreja: formData.qual_igreja || null,
        deseja_receber_visita: formData.deseja_receber_visita || false,
        melhor_horario_contato: formData.melhor_horario_contato || null,
        observacoes: formData.observacoes || null,
        campos_personalizados_respostas: formData.campos_personalizados || {},
        status: 'novo',
        data_visita: new Date().toISOString().split('T')[0],
      };

      const { error: insertError } = await supabase
        .from('visitation_form_responses')
        .insert(responseData);

      if (insertError) {
        console.error('Erro ao enviar:', insertError);
        setError('Erro ao enviar formulário. Tente novamente.');
        return;
      }

      setSubmitted(true);
    } catch (err) {
      console.error('Erro ao enviar formulário:', err);
      setError('Erro ao enviar formulário. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const renderField = (key: string, fieldConfig: { ativo: boolean; obrigatorio: boolean; label: string }) => {
    if (!fieldConfig.ativo) return null;

    const commonProps = {
      required: fieldConfig.obrigatorio,
      className: "w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all text-gray-800",
    };

    switch (key) {
      case 'nome':
      case 'email':
      case 'telefone':
      case 'endereco':
      case 'bairro':
      case 'cidade':
      case 'estado':
      case 'cep':
      case 'qual_igreja':
      case 'melhor_horario_contato':
        return (
          <div key={key} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {fieldConfig.label}
              {fieldConfig.obrigatorio && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type={key === 'email' ? 'email' : key === 'telefone' ? 'tel' : 'text'}
              value={formData[key] || ''}
              onChange={(e) => handleInputChange(key, e.target.value)}
              placeholder={fieldConfig.label}
              {...commonProps}
            />
          </div>
        );

      case 'data_nascimento':
        return (
          <div key={key} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {fieldConfig.label}
              {fieldConfig.obrigatorio && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="date"
              value={formData[key] || ''}
              onChange={(e) => handleInputChange(key, e.target.value)}
              {...commonProps}
            />
          </div>
        );

      case 'como_conheceu':
        return (
          <div key={key} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {fieldConfig.label}
              {fieldConfig.obrigatorio && <span className="text-red-500 ml-1">*</span>}
            </label>
            <select
              value={formData[key] || ''}
              onChange={(e) => handleInputChange(key, e.target.value)}
              {...commonProps}
            >
              <option value="">Selecione...</option>
              {config?.opcoes_como_conheceu?.map((opcao, i) => (
                <option key={i} value={opcao}>{opcao}</option>
              ))}
            </select>
          </div>
        );

      case 'motivo_visita':
        return (
          <div key={key} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {fieldConfig.label}
              {fieldConfig.obrigatorio && <span className="text-red-500 ml-1">*</span>}
            </label>
            <select
              value={formData[key] || ''}
              onChange={(e) => handleInputChange(key, e.target.value)}
              {...commonProps}
            >
              <option value="">Selecione...</option>
              {config?.opcoes_motivo_visita?.map((opcao, i) => (
                <option key={i} value={opcao}>{opcao}</option>
              ))}
            </select>
          </div>
        );

      case 'pedido_oracao':
      case 'observacoes':
        return (
          <div key={key} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {fieldConfig.label}
              {fieldConfig.obrigatorio && <span className="text-red-500 ml-1">*</span>}
            </label>
            <textarea
              value={formData[key] || ''}
              onChange={(e) => handleInputChange(key, e.target.value)}
              placeholder={fieldConfig.label}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all text-gray-800 resize-none"
              required={fieldConfig.obrigatorio}
            />
          </div>
        );

      case 'ja_frequenta_igreja':
      case 'deseja_receber_visita':
        return (
          <div key={key} className="flex items-center gap-3">
            <input
              type="checkbox"
              id={key}
              checked={formData[key] || false}
              onChange={(e) => handleInputChange(key, e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <label htmlFor={key} className="text-sm font-medium text-gray-700">
              {fieldConfig.label}
            </label>
          </div>
        );

      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Formulário não encontrado</h1>
          <p className="text-gray-600">
            O formulário que você está procurando não existe ou foi desativado.
          </p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div 
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: `${config.cor_primaria}20` }}
          >
            <CheckCircle className="w-10 h-10" style={{ color: config.cor_primaria }} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Enviado com sucesso!</h1>
          <p className="text-gray-600">{config.mensagem_agradecimento}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div 
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
            style={{ backgroundColor: config.cor_primaria }}
          >
            <Church className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{config.titulo}</h1>
          {config.mensagem_boas_vindas && (
            <p className="text-gray-600 max-w-md mx-auto">{config.mensagem_boas_vindas}</p>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-6 md:p-8 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Render standard fields */}
          {config.campos_config && Object.entries(config.campos_config as VisitationFieldsConfig).map(([key, fieldConfig]) => 
            renderField(key, fieldConfig)
          )}

          {/* Render custom fields */}
          {config.campos_personalizados?.map((field) => (
            <div key={field.id} className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                {field.label}
                {field.obrigatorio && <span className="text-red-500 ml-1">*</span>}
              </label>
              {field.tipo === 'textarea' ? (
                <textarea
                  value={formData.campos_personalizados?.[field.id] || ''}
                  onChange={(e) => handleInputChange(`campos_personalizados.${field.id}`, e.target.value)}
                  required={field.obrigatorio}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all text-gray-800 resize-none"
                />
              ) : field.tipo === 'select' ? (
                <select
                  value={formData.campos_personalizados?.[field.id] || ''}
                  onChange={(e) => handleInputChange(`campos_personalizados.${field.id}`, e.target.value)}
                  required={field.obrigatorio}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all text-gray-800"
                >
                  <option value="">Selecione...</option>
                  {field.opcoes?.map((opcao, i) => (
                    <option key={i} value={opcao}>{opcao}</option>
                  ))}
                </select>
              ) : field.tipo === 'checkbox' ? (
                <input
                  type="checkbox"
                  checked={formData.campos_personalizados?.[field.id] || false}
                  onChange={(e) => handleInputChange(`campos_personalizados.${field.id}`, e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
              ) : (
                <input
                  type={field.tipo === 'number' ? 'number' : field.tipo === 'date' ? 'date' : 'text'}
                  value={formData.campos_personalizados?.[field.id] || ''}
                  onChange={(e) => handleInputChange(`campos_personalizados.${field.id}`, e.target.value)}
                  required={field.obrigatorio}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all text-gray-800"
                />
              )}
            </div>
          ))}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 rounded-xl text-white font-semibold text-lg transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ backgroundColor: config.cor_primaria }}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Enviar
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-gray-500 text-sm mt-6">
          Powered by PrestFlow
        </p>
      </div>
    </div>
  );
}
