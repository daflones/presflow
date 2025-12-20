import { supabase } from '../../lib/supabase';
import type { Church } from '../../types/database';

const LOGO_BUCKET = 'church-logos';

export type UpdateChurchProfileInput = {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  website?: string;
  description?: string;
  instagram?: string;
  facebook?: string;
};

export const churchProfileService = {
  async get(): Promise<Church | null> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return null;

    const { data, error } = await supabase
      .from('churches')
      .select('*')
      .eq('owner_id', userData.user.id)
      .single();

    if (error) {
      console.error('[churchProfile.get] Erro:', error);
      return null;
    }

    return data;
  },

  async update(input: UpdateChurchProfileInput): Promise<Church | null> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('churches')
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq('owner_id', userData.user.id)
      .select()
      .single();

    if (error) {
      console.error('[churchProfile.update] Erro:', error);
      throw error;
    }

    return data;
  },

  async uploadLogo(file: File): Promise<string> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Usuário não autenticado');

    // Buscar church_id
    const { data: church } = await supabase
      .from('churches')
      .select('id, logo_url')
      .eq('owner_id', userData.user.id)
      .single();

    if (!church) throw new Error('Igreja não encontrada');

    // Deletar logo anterior se existir
    if (church.logo_url) {
      const oldPath = church.logo_url.split('/').pop();
      if (oldPath) {
        await supabase.storage.from(LOGO_BUCKET).remove([`${church.id}/${oldPath}`]);
      }
    }

    // Gerar nome único para o arquivo
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop();
    const fileName = `logo-${timestamp}.${fileExt}`;
    const filePath = `${church.id}/${fileName}`;

    // Upload para o Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(LOGO_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      console.error('[churchProfile.uploadLogo] Erro no upload:', uploadError);
      throw uploadError;
    }

    // Obter URL pública
    const { data: urlData } = supabase.storage
      .from(LOGO_BUCKET)
      .getPublicUrl(filePath);

    const logoUrl = urlData.publicUrl;

    // Atualizar logo_url na igreja
    await supabase
      .from('churches')
      .update({ logo_url: logoUrl, updated_at: new Date().toISOString() })
      .eq('id', church.id);

    return logoUrl;
  },

  async removeLogo(): Promise<void> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Usuário não autenticado');

    const { data: church } = await supabase
      .from('churches')
      .select('id, logo_url')
      .eq('owner_id', userData.user.id)
      .single();

    if (!church) throw new Error('Igreja não encontrada');

    // Deletar arquivo do storage
    if (church.logo_url) {
      const pathParts = church.logo_url.split(`${LOGO_BUCKET}/`);
      if (pathParts[1]) {
        await supabase.storage.from(LOGO_BUCKET).remove([pathParts[1]]);
      }
    }

    // Limpar logo_url na igreja
    await supabase
      .from('churches')
      .update({ logo_url: null, updated_at: new Date().toISOString() })
      .eq('id', church.id);
  },
};
