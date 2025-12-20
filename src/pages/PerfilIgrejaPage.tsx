import { useEffect, useState } from 'react';
import { Church, Upload, Save, Trash2, Instagram, Facebook, Mail, Phone, Globe, MapPin } from 'lucide-react';
import { churchProfileService } from '../services/supabase';
import type { Church as ChurchType } from '../types/database';

export function PerfilIgrejaPage() {
  const [church, setChurch] = useState<ChurchType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    website: '',
    description: '',
    instagram: '',
    facebook: '',
  });

  useEffect(() => {
    loadChurch();
  }, []);

  async function loadChurch() {
    setIsLoading(true);
    try {
      const data = await churchProfileService.get();
      if (data) {
        setChurch(data);
        setFormData({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          address: data.address || '',
          city: data.city || '',
          state: data.state || '',
          website: data.website || '',
          description: data.description || '',
          instagram: data.instagram || '',
          facebook: data.facebook || '',
        });
      }
    } catch (error) {
      console.error('Erro ao carregar igreja:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function handleChange(field: keyof typeof formData, value: string) {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  }

  async function handleSave() {
    if (!formData.name.trim()) {
      alert('Nome da igreja é obrigatório');
      return;
    }

    setIsSaving(true);
    try {
      await churchProfileService.update(formData);
      setHasChanges(false);
      alert('Perfil atualizado com sucesso!');
      // Recarregar para atualizar o contexto
      window.location.reload();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar perfil. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione uma imagem');
      return;
    }

    // Validar tamanho (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 2MB');
      return;
    }

    setIsUploadingLogo(true);
    try {
      const logoUrl = await churchProfileService.uploadLogo(file);
      setChurch(prev => prev ? { ...prev, logo_url: logoUrl } : null);
      alert('Logo atualizada com sucesso!');
      // Recarregar para atualizar o sidebar
      window.location.reload();
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      alert('Erro ao fazer upload da logo. Tente novamente.');
    } finally {
      setIsUploadingLogo(false);
    }
  }

  async function handleRemoveLogo() {
    if (!confirm('Tem certeza que deseja remover a logo?')) return;

    setIsUploadingLogo(true);
    try {
      await churchProfileService.removeLogo();
      setChurch(prev => prev ? { ...prev, logo_url: undefined } : null);
      alert('Logo removida com sucesso!');
      window.location.reload();
    } catch (error) {
      console.error('Erro ao remover logo:', error);
      alert('Erro ao remover logo. Tente novamente.');
    } finally {
      setIsUploadingLogo(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white">
            <Church className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Perfil da Igreja</h1>
            <p className="text-sm text-gray-500">Gerencie as informações e identidade visual da sua igreja.</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          <Save className="h-4 w-4" />
          {isSaving ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </div>

      {/* Logo Section */}
      <div className="rounded-xl border bg-white p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Logo da Igreja</h2>
        <p className="text-sm text-gray-500 mb-6">A logo aparecerá no menu lateral e em outros locais do sistema.</p>

        <div className="flex items-start gap-6">
          {/* Logo Preview */}
          <div className="flex-shrink-0">
            {church?.logo_url ? (
              <div className="relative group">
                <img
                  src={church.logo_url}
                  alt="Logo da igreja"
                  className="h-32 w-32 rounded-xl object-cover border-2 border-gray-200"
                />
                <button
                  onClick={handleRemoveLogo}
                  disabled={isUploadingLogo}
                  className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  title="Remover logo"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="h-32 w-32 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                <Church className="h-12 w-12 text-gray-400" />
              </div>
            )}
          </div>

          {/* Upload Area */}
          <div className="flex-1">
            <label className="block">
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                disabled={isUploadingLogo}
                className="hidden"
              />
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center cursor-pointer hover:border-blue-300 hover:bg-blue-50/50 transition-colors">
                {isUploadingLogo ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    <span className="text-sm text-gray-600">Enviando...</span>
                  </div>
                ) : (
                  <>
                    <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm font-medium text-gray-700">Clique para enviar uma logo</p>
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG ou GIF (máx. 2MB)</p>
                  </>
                )}
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Basic Info */}
      <div className="rounded-xl border bg-white p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Informações Básicas</h2>
        <p className="text-sm text-gray-500 mb-6">Dados principais da sua igreja.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome da Igreja *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
              placeholder="Nome da sua igreja"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Mail className="h-4 w-4 inline mr-1" />
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
              placeholder="contato@igreja.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Phone className="h-4 w-4 inline mr-1" />
              Telefone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
              placeholder="(00) 00000-0000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Globe className="h-4 w-4 inline mr-1" />
              Website
            </label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => handleChange('website', e.target.value)}
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
              placeholder="https://www.suaigreja.com.br"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <MapPin className="h-4 w-4 inline mr-1" />
              Cidade
            </label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => handleChange('city', e.target.value)}
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
              placeholder="Cidade"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Endereço
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
              placeholder="Rua, número, bairro"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrição
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 resize-none"
              placeholder="Uma breve descrição sobre sua igreja..."
            />
          </div>
        </div>
      </div>

      {/* Social Media */}
      <div className="rounded-xl border bg-white p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Redes Sociais</h2>
        <p className="text-sm text-gray-500 mb-6">Links para as redes sociais da sua igreja.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Instagram className="h-4 w-4 inline mr-1 text-pink-500" />
              Instagram
            </label>
            <div className="flex">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-200 bg-gray-50 text-gray-500 text-sm">
                @
              </span>
              <input
                type="text"
                value={formData.instagram}
                onChange={(e) => handleChange('instagram', e.target.value.replace('@', ''))}
                className="flex-1 rounded-r-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                placeholder="suaigreja"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Facebook className="h-4 w-4 inline mr-1 text-blue-600" />
              Facebook
            </label>
            <div className="flex">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-200 bg-gray-50 text-gray-500 text-sm">
                facebook.com/
              </span>
              <input
                type="text"
                value={formData.facebook}
                onChange={(e) => handleChange('facebook', e.target.value)}
                className="flex-1 rounded-r-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                placeholder="suaigreja"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 border-t bg-white p-4 shadow-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-end">
          <button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </div>
    </div>
  );
}
