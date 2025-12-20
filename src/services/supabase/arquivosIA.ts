import { supabase } from '../../lib/supabase';
import type { ArquivoIA } from '../../types/database';

export type CreateArquivoIAInput = Omit<ArquivoIA, 'id' | 'church_id' | 'created_at' | 'updated_at' | 'visualizacoes' | 'downloads'>;
export type UpdateArquivoIAInput = Partial<CreateArquivoIAInput>;

const BUCKET_NAME = 'arquivos-ia';

export const arquivosIAService = {
  async uploadFile(file: File): Promise<{ url: string; caminho: string; bucket: string }> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Usuário não autenticado');

    // Buscar church_id do usuário
    const { data: church } = await supabase
      .from('churches')
      .select('id')
      .eq('owner_id', userData.user.id)
      .single();

    if (!church) throw new Error('Igreja não encontrada');

    // Gerar nome único para o arquivo
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop();
    const fileName = `${timestamp}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${church.id}/${fileName}`;

    // Upload para o Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('[arquivosIA.uploadFile] Erro no upload:', uploadError);
      throw uploadError;
    }

    // Obter URL pública do arquivo
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    return {
      url: urlData.publicUrl,
      caminho: filePath,
      bucket: BUCKET_NAME,
    };
  },

  async deleteFile(caminho: string): Promise<void> {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([caminho]);

    if (error) {
      console.error('[arquivosIA.deleteFile] Erro ao deletar arquivo:', error);
      throw error;
    }
  },

  async uploadAndCreate(file: File, input: Omit<CreateArquivoIAInput, 'url' | 'bucket_name' | 'caminho_storage' | 'tipo_mime' | 'extensao' | 'tamanho' | 'nome_original'>): Promise<ArquivoIA> {
    // Fazer upload do arquivo
    const { url, caminho, bucket } = await this.uploadFile(file);

    // Extrair informações do arquivo
    const extensao = file.name.split('.').pop() || '';
    
    // Criar registro no banco
    return this.create({
      ...input,
      nome_original: file.name,
      url,
      bucket_name: bucket,
      caminho_storage: caminho,
      tipo_mime: file.type,
      extensao,
      tamanho: file.size,
    });
  },

  async list(): Promise<ArquivoIA[]> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return [];

    // Buscar church_id do usuário
    const { data: church } = await supabase
      .from('churches')
      .select('id')
      .eq('owner_id', userData.user.id)
      .single();

    if (!church) return [];

    const { data, error } = await supabase
      .from('arquivos_ia')
      .select('*')
      .eq('church_id', church.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[arquivosIA.list] Erro:', error);
      return [];
    }

    return data || [];
  },

  async getById(id: string): Promise<ArquivoIA | null> {
    const { data, error } = await supabase
      .from('arquivos_ia')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('[arquivosIA.getById] Erro:', error);
      return null;
    }

    return data;
  },

  async create(input: CreateArquivoIAInput): Promise<ArquivoIA> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Usuário não autenticado');

    // Buscar church_id do usuário
    const { data: church } = await supabase
      .from('churches')
      .select('id')
      .eq('owner_id', userData.user.id)
      .single();

    if (!church) throw new Error('Igreja não encontrada');

    const { data, error } = await supabase
      .from('arquivos_ia')
      .insert({
        church_id: church.id,
        nome: input.nome,
        nome_original: input.nome_original,
        categoria: input.categoria,
        subcategoria: input.subcategoria,
        descricao: input.descricao,
        status: input.status || 'ativo',
        disponivel_ia: input.disponivel_ia ?? true,
        processado_ia: input.processado_ia ?? false,
        instrucoes_ia: input.instrucoes_ia,
        contexto_uso: input.contexto_uso,
        palavras_chave: input.palavras_chave,
        prioridade: input.prioridade || 0,
        url: input.url,
        bucket_name: input.bucket_name,
        caminho_storage: input.caminho_storage,
        tipo_mime: input.tipo_mime,
        extensao: input.extensao,
        tamanho: input.tamanho,
        visibilidade: input.visibilidade || 'privado',
        versao: input.versao || 1,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, input: UpdateArquivoIAInput): Promise<ArquivoIA> {
    const { data, error } = await supabase
      .from('arquivos_ia')
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    // Soft delete - apenas marca como deletado
    const { error } = await supabase
      .from('arquivos_ia')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  },

  async hardDelete(id: string): Promise<void> {
    // Hard delete - remove permanentemente
    const { error } = await supabase
      .from('arquivos_ia')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async incrementVisualizacoes(id: string): Promise<void> {
    const { error } = await supabase.rpc('increment_arquivos_ia_visualizacoes', { arquivo_id: id });
    if (error) {
      // Fallback se a função RPC não existir
      const { data: arquivo } = await supabase
        .from('arquivos_ia')
        .select('visualizacoes')
        .eq('id', id)
        .single();
      
      if (arquivo) {
        await supabase
          .from('arquivos_ia')
          .update({ visualizacoes: (arquivo.visualizacoes || 0) + 1 })
          .eq('id', id);
      }
    }
  },

  async incrementDownloads(id: string): Promise<void> {
    const { error } = await supabase.rpc('increment_arquivos_ia_downloads', { arquivo_id: id });
    if (error) {
      // Fallback se a função RPC não existir
      const { data: arquivo } = await supabase
        .from('arquivos_ia')
        .select('downloads')
        .eq('id', id)
        .single();
      
      if (arquivo) {
        await supabase
          .from('arquivos_ia')
          .update({ downloads: (arquivo.downloads || 0) + 1 })
          .eq('id', id);
      }
    }
  },

  async updateUltimaUtilizacaoIA(id: string): Promise<void> {
    await supabase
      .from('arquivos_ia')
      .update({ ultima_utilizacao_ia: new Date().toISOString() })
      .eq('id', id);
  },

  async listByCategoria(categoria: string): Promise<ArquivoIA[]> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return [];

    const { data: church } = await supabase
      .from('churches')
      .select('id')
      .eq('owner_id', userData.user.id)
      .single();

    if (!church) return [];

    const { data, error } = await supabase
      .from('arquivos_ia')
      .select('*')
      .eq('church_id', church.id)
      .eq('categoria', categoria)
      .eq('disponivel_ia', true)
      .is('deleted_at', null)
      .order('prioridade', { ascending: false });

    if (error) return [];
    return data || [];
  },

  async listDisponiveis(): Promise<ArquivoIA[]> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return [];

    const { data: church } = await supabase
      .from('churches')
      .select('id')
      .eq('owner_id', userData.user.id)
      .single();

    if (!church) return [];

    const { data, error } = await supabase
      .from('arquivos_ia')
      .select('*')
      .eq('church_id', church.id)
      .eq('status', 'ativo')
      .eq('disponivel_ia', true)
      .is('deleted_at', null)
      .order('prioridade', { ascending: false });

    if (error) return [];
    return data || [];
  },
};
