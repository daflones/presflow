import { supabase } from '../../lib/supabase';

// Tipos de bucket disponíveis
export type BucketType = 'church-images' | 'services-images' | 'hosting-images' | 'spaces-images';

// Categorias de imagens
export type ImageCategory = 
  | 'igreja'        // Imagens gerais da igreja
  | 'batismos'      // Fotos de batismos
  | 'casamentos'    // Fotos de casamentos
  | 'espacos'       // Fotos dos espaços
  | 'hospedagem'    // Fotos de hospedagem
  | 'acomodacoes'   // Fotos de acomodações
  | 'servicos';     // Fotos de serviços gerais

// Mapeamento de categoria para bucket
const categoryToBucket: Record<ImageCategory, BucketType> = {
  igreja: 'church-images',
  batismos: 'services-images',
  casamentos: 'services-images',
  espacos: 'spaces-images',
  hospedagem: 'hosting-images',
  acomodacoes: 'hosting-images',
  servicos: 'services-images',
};

export interface UploadResult {
  url: string;
  path: string;
  bucket: BucketType;
}

export interface ImageItem {
  url: string;
  descricao?: string;
}

class StorageService {
  /**
   * Faz upload de uma imagem para o Supabase Storage
   */
  async uploadImage(
    file: File,
    churchId: string,
    category: ImageCategory,
    customFileName?: string
  ): Promise<UploadResult> {
    const bucket = categoryToBucket[category];
    
    // Gerar nome único para o arquivo
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    const fileName = customFileName 
      ? `${customFileName}.${fileExt}`
      : `${timestamp}_${randomId}.${fileExt}`;
    
    // Caminho: church_id/categoria/arquivo
    const filePath = `${churchId}/${category}/${fileName}`;
    
    console.log(`[Storage] Uploading to ${bucket}/${filePath}`);
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });
    
    if (error) {
      console.error('[Storage] Upload error:', error);
      throw new Error(`Erro ao fazer upload: ${error.message}`);
    }
    
    // Obter URL pública
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);
    
    console.log(`[Storage] Upload successful: ${urlData.publicUrl}`);
    
    return {
      url: urlData.publicUrl,
      path: data.path,
      bucket,
    };
  }

  /**
   * Faz upload de múltiplas imagens
   */
  async uploadMultipleImages(
    files: File[],
    churchId: string,
    category: ImageCategory
  ): Promise<UploadResult[]> {
    const results: UploadResult[] = [];
    
    for (const file of files) {
      try {
        const result = await this.uploadImage(file, churchId, category);
        results.push(result);
      } catch (error) {
        console.error(`[Storage] Failed to upload ${file.name}:`, error);
        // Continuar com os outros arquivos
      }
    }
    
    return results;
  }

  /**
   * Deleta uma imagem do storage
   */
  async deleteImage(bucket: BucketType, path: string): Promise<void> {
    console.log(`[Storage] Deleting ${bucket}/${path}`);
    
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);
    
    if (error) {
      console.error('[Storage] Delete error:', error);
      throw new Error(`Erro ao deletar imagem: ${error.message}`);
    }
    
    console.log('[Storage] Delete successful');
  }

  /**
   * Deleta uma imagem pela URL pública
   */
  async deleteImageByUrl(url: string): Promise<void> {
    // Extrair bucket e path da URL
    // URL format: https://xxx.supabase.co/storage/v1/object/public/bucket-name/path/to/file
    const match = url.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
    
    if (!match) {
      console.error('[Storage] Could not parse URL:', url);
      throw new Error('URL de imagem inválida');
    }
    
    const [, bucket, path] = match;
    await this.deleteImage(bucket as BucketType, path);
  }

  /**
   * Lista imagens de uma categoria
   */
  async listImages(churchId: string, category: ImageCategory): Promise<string[]> {
    const bucket = categoryToBucket[category];
    const folderPath = `${churchId}/${category}`;
    
    console.log(`[Storage] Listing ${bucket}/${folderPath}`);
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(folderPath);
    
    if (error) {
      console.error('[Storage] List error:', error);
      throw new Error(`Erro ao listar imagens: ${error.message}`);
    }
    
    // Converter para URLs públicas
    const urls = data
      .filter(item => !item.id.endsWith('/')) // Ignorar pastas
      .map(item => {
        const { data: urlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(`${folderPath}/${item.name}`);
        return urlData.publicUrl;
      });
    
    return urls;
  }

  /**
   * Obtém URL pública de um arquivo
   */
  getPublicUrl(bucket: BucketType, path: string): string {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    
    return data.publicUrl;
  }

  /**
   * Valida se o arquivo é uma imagem válida
   */
  validateImageFile(file: File): { valid: boolean; error?: string } {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Tipo de arquivo não permitido. Use JPG, PNG, GIF ou WebP.',
      };
    }
    
    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'Arquivo muito grande. Máximo permitido: 5MB.',
      };
    }
    
    return { valid: true };
  }

  /**
   * Comprime uma imagem antes do upload (opcional)
   */
  async compressImage(file: File, maxWidth = 1920, quality = 0.8): Promise<File> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      img.onload = () => {
        let { width, height } = img;
        
        // Redimensionar se necessário
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              reject(new Error('Falha ao comprimir imagem'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      
      img.onerror = () => reject(new Error('Falha ao carregar imagem'));
      img.src = URL.createObjectURL(file);
    });
  }
}

export const storageService = new StorageService();
