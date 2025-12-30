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

      const responseData = {
        ...formData,
        church_id: config.church_id,
        form_config_id: config.id,
        campos_personalizados_respostas: formData.campos_personalizados || {},
        status: 'novo',
        data_visita: new Date().toISOString().split('T')[0],
      };

      const response = await fetch('/api/forms/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(responseData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Erro ao enviar:', errorData);
        setError(errorData.message || 'Erro ao enviar formulário. Tente novamente.');
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
    if (field.startsWith('campos_personalizados.')) {
      const customFieldId = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        campos_personalizados: {
          ...prev.campos_personalizados,
          [customFieldId]: value,
        },
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const renderField = (key: string, fieldConfig: { ativo: boolean; obrigatorio: boolean; label: string }) => {
    if (!fieldConfig.ativo) return null;

    const inputClassName = `w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 bg-gray-50 focus:bg-white focus:border-2 outline-none transition-all text-gray-800 placeholder:text-gray-400`;
    const focusStyle = { borderColor: config?.cor_primaria || '#8B5CF6' };

    const commonProps = {
      required: fieldConfig.obrigatorio,
      className: inputClassName,
      onFocus: (e: any) => Object.assign(e.target.style, focusStyle),
      onBlur: (e: any) => e.target.style.borderColor = '',
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
          <div key={key} className="space-y-2.5">
            <label className="block text-sm font-semibold text-gray-700">
              {fieldConfig.label}
              {fieldConfig.obrigatorio && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type={key === 'email' ? 'email' : key === 'telefone' ? 'tel' : 'text'}
              value={formData[key] || ''}
              onChange={(e) => handleInputChange(key, e.target.value)}
              placeholder={`Digite ${fieldConfig.label.toLowerCase()}`}
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
    <div className="min-h-screen py-12 px-4" style={{
      background: `linear-gradient(135deg, ${config.cor_primaria}15 0%, ${config.cor_primaria}05 100%)`,
    }}>
      <div className="max-w-3xl mx-auto">
        {/* Header Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8 text-center">
          {/* Logo da Igreja */}
          {churchData?.logo_url ? (
            <div className="mb-6">
              <img 
                src={churchData.logo_url} 
                alt={churchData.name}
                className="w-24 h-24 object-contain mx-auto rounded-2xl"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <div 
                className="hidden w-24 h-24 rounded-2xl flex items-center justify-center mx-auto shadow-lg"
                style={{ backgroundColor: config.cor_primaria }}
              >
                <Church className="w-12 h-12 text-white" />
              </div>
            </div>
          ) : (
            <div 
              className="w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg"
              style={{ backgroundColor: config.cor_primaria }}
            >
              <Church className="w-12 h-12 text-white" />
            </div>
          )}
          
          {/* Nome da Igreja */}
          {churchData?.name && (
            <h2 className="text-xl font-semibold mb-2" style={{ color: config.cor_primaria }}>
              {churchData.name}
            </h2>
          )}
          
          {/* Título do Formulário */}
          <h1 className="text-4xl font-bold text-gray-800 mb-4">{config.titulo}</h1>
          
          {/* Mensagem de Boas-vindas */}
          {config.mensagem_boas_vindas && (
            <p className="text-gray-600 text-lg max-w-2xl mx-auto leading-relaxed">
              {config.mensagem_boas_vindas}
            </p>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-2xl p-8 md:p-10 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-xl text-red-700 text-sm flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
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
          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 rounded-xl text-white font-bold text-lg transition-all hover:shadow-xl hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-3 shadow-lg"
              style={{ 
                backgroundColor: config.cor_primaria,
                boxShadow: `0 10px 30px ${config.cor_primaria}40`
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <Send className="w-6 h-6" />
                  <span>Enviar Formulário</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="text-center mt-8 space-y-2">
          <p className="text-gray-500 text-sm">
            Seus dados estão seguros e serão tratados com confidencialidade
          </p>
          <p className="text-gray-400 text-xs">
            Powered by <span className="font-semibold">LogiKon</span>
          </p>
        </div>
      </div>
    </div>
  );
}
