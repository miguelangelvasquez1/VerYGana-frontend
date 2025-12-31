import apiClient from '@/lib/api/client';
import { FileUploadPermission } from '@/types/GenericTypes';

/**
 * Servicio genérico para preparar uploads de archivos hacia R2
 * mediante URLs pre-firmadas.
 */
class FileUploadService {

  /**
   * Sube un archivo directamente a R2 usando una URL pre-firmada.
   */
  async uploadToR2(
    uploadUrl: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      if (onProgress) {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            onProgress((e.loaded / e.total) * 100);
          }
        });
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      };

      xhr.onerror = () => reject(new Error('Network error during upload'));
      xhr.onabort = () => reject(new Error('Upload aborted'));

      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);
    });
  }
}

export const fileUploadService = new FileUploadService();
