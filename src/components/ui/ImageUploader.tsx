import { useState, useRef } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { storageService } from '../../services/supabase/storageService';
import type { ImageCategory } from '../../services/supabase/storageService';

interface ImageItem {
  url: string;
  descricao: string;
}

interface ImageUploaderProps {
  images: ImageItem[];
  onChange: (images: ImageItem[]) => void;
  churchId: string;
  category: ImageCategory;
  maxImages?: number;
  label?: string;
}

export function ImageUploader({
  images,
  onChange,
  churchId,
  category,
  maxImages = 10,
  label = 'Imagens',
}: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = maxImages - images.length;
    if (remainingSlots <= 0) {
      alert(`Máximo de ${maxImages} imagens permitido.`);
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    setIsUploading(true);
    setUploadProgress(0);

    const newImages: ImageItem[] = [];
    
    for (let i = 0; i < filesToUpload.length; i++) {
      const file = filesToUpload[i];
      
      // Validar arquivo
      const validation = storageService.validateImageFile(file);
      if (!validation.valid) {
        alert(`${file.name}: ${validation.error}`);
        continue;
      }

      try {
        // Comprimir imagem antes do upload
        const compressedFile = await storageService.compressImage(file);
        
        // Fazer upload
        const result = await storageService.uploadImage(compressedFile, churchId, category);
        
        newImages.push({
          url: result.url,
          descricao: '',
        });

        setUploadProgress(Math.round(((i + 1) / filesToUpload.length) * 100));
      } catch (error) {
        console.error(`Erro ao fazer upload de ${file.name}:`, error);
        alert(`Erro ao fazer upload de ${file.name}`);
      }
    }

    if (newImages.length > 0) {
      onChange([...images, ...newImages]);
    }

    setIsUploading(false);
    setUploadProgress(0);
    
    // Limpar input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = async (index: number) => {
    const imageToRemove = images[index];
    
    try {
      // Tentar deletar do storage
      await storageService.deleteImageByUrl(imageToRemove.url);
    } catch (error) {
      console.error('Erro ao deletar imagem do storage:', error);
      // Continuar mesmo se falhar a deleção do storage
    }

    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);
  };

  const handleDescriptionChange = (index: number, descricao: string) => {
    const newImages = images.map((img, i) => 
      i === index ? { ...img, descricao } : img
    );
    onChange(newImages);
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-300">{label}</label>
      
      {/* Grid de imagens */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((image, index) => (
          <div key={index} className="relative group">
            <div className="aspect-square rounded-lg overflow-hidden bg-gray-700 border border-gray-600">
              <img
                src={image.url}
                alt={image.descricao || `Imagem ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Botão remover */}
            <button
              type="button"
              onClick={() => handleRemoveImage(index)}
              className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
            >
              <X className="w-4 h-4" />
            </button>
            
            {/* Campo descrição */}
            <input
              type="text"
              value={image.descricao}
              onChange={(e) => handleDescriptionChange(index, e.target.value)}
              placeholder="Descrição..."
              className="mt-2 w-full text-xs px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
        ))}

        {/* Botão adicionar */}
        {images.length < maxImages && (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="aspect-square rounded-lg border-2 border-dashed border-gray-600 flex flex-col items-center justify-center cursor-pointer hover:border-purple-500 hover:bg-purple-500/10 transition-colors"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                <span className="text-sm text-gray-400 mt-2">{uploadProgress}%</span>
              </>
            ) : (
              <>
                <Upload className="w-8 h-8 text-gray-500" />
                <span className="text-sm text-gray-400 mt-2">Adicionar</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Input file oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Info */}
      <p className="text-xs text-gray-500">
        {images.length}/{maxImages} imagens • JPG, PNG, GIF ou WebP • Máx. 5MB cada
      </p>
    </div>
  );
}
