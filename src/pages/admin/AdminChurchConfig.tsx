import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Church, Briefcase, Bed, ClipboardList, Save } from 'lucide-react';
import { adminService } from '../../services/supabase/admin';
import type { Church as ChurchType } from '../../types/database';
import { toast } from 'sonner';

type TabType = 'servicos' | 'hospedagem' | 'visitacao';

export function AdminChurchConfig() {
  const { churchId } = useParams<{ churchId: string }>();
  const [church, setChurch] = useState<ChurchType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('servicos');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (churchId) {
      loadChurch();
    }
  }, [churchId]);

  async function loadChurch() {
    if (!churchId) return;
    
    setIsLoading(true);
    try {
      const data = await adminService.getChurchById(churchId);
      setChurch(data);
    } catch (error) {
      console.error('Erro ao carregar igreja:', error);
      toast.error('Erro ao carregar dados da igreja');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSave() {
    if (!churchId || !church) return;

    setIsSaving(true);
    try {
      await adminService.updateChurch(churchId, church);
      toast.success('Configurações salvas com sucesso!');
    } catch (error: any) {
      toast.error('Erro ao salvar: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!church) {
    return (
      <div className="text-center py-12">
        <Church className="h-12 w-12 mx-auto text-gray-500 mb-4" />
        <p className="text-gray-400">Igreja não encontrada</p>
      </div>
    );
  }

  const tabs = [
    { id: 'servicos' as TabType, name: 'Serviços', icon: Briefcase },
    { id: 'hospedagem' as TabType, name: 'Hospedagem', icon: Bed },
    { id: 'visitacao' as TabType, name: 'Visitação', icon: ClipboardList },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/admin/igrejas"
            className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">{church.name}</h1>
            <p className="text-gray-400 mt-1">Configurações da Igreja</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          <Save className="h-5 w-5" />
          {isSaving ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-700">
        <nav className="flex gap-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-400'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
        {activeTab === 'servicos' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white mb-4">Serviços Oferecidos</h2>
            <p className="text-gray-400 text-sm mb-6">
              Configure os serviços que esta igreja oferece aos visitantes e membros.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Descrição dos Serviços
                </label>
                <textarea
                  value={church.services_description || ''}
                  onChange={(e) => setChurch({ ...church, services_description: e.target.value })}
                  rows={6}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  placeholder="Descreva os serviços oferecidos pela igreja..."
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'hospedagem' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white mb-4">Hospedagem</h2>
            <p className="text-gray-400 text-sm mb-6">
              Configure as informações sobre hospedagem disponível na igreja.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Informações de Hospedagem
                </label>
                <textarea
                  value={church.accommodation_info || ''}
                  onChange={(e) => setChurch({ ...church, accommodation_info: e.target.value })}
                  rows={6}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  placeholder="Descreva as opções de hospedagem disponíveis..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Regras de Hospedagem
                </label>
                <textarea
                  value={church.accommodation_rules || ''}
                  onChange={(e) => setChurch({ ...church, accommodation_rules: e.target.value })}
                  rows={4}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  placeholder="Regras e políticas de hospedagem..."
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'visitacao' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white mb-4">Visitação</h2>
            <p className="text-gray-400 text-sm mb-6">
              Configure as informações sobre visitação e tours na igreja.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Informações de Visitação
                </label>
                <textarea
                  value={church.visitation_info || ''}
                  onChange={(e) => setChurch({ ...church, visitation_info: e.target.value })}
                  rows={6}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  placeholder="Horários de visitação, tours disponíveis, etc..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Link do Formulário de Visitação
                </label>
                <input
                  type="url"
                  value={church.visitation_form_link || ''}
                  onChange={(e) => setChurch({ ...church, visitation_form_link: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
