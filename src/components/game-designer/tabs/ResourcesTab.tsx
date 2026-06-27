'use client';

import React, { useState } from 'react';
import { Download, Archive, FileImage, Package, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import JSZip from 'jszip';
import type { DesignerBrandingDetail } from '@/services/GameDesignerService';

const fileSizeLabel = (bytes: number) => {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

interface Props {
  detail: DesignerBrandingDetail;
}

export const ResourcesTab: React.FC<Props> = ({ detail }) => {
  const [imgErrors, setImgErrors] = useState<Set<number>>(new Set());
  const [zipping, setZipping] = useState(false);

  const validatedResources = detail.corporateResources.filter(r => r.status === 'VALIDATED');

  const handleDownloadZip = async () => {
    const toDownload = validatedResources.filter(r => r.temporalUrl);
    if (toDownload.length === 0) {
      toast.error('No hay recursos disponibles para descargar');
      return;
    }
    setZipping(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder('recursos') ?? zip;
      await Promise.all(
        toDownload.map(async (res) => {
          const response = await fetch(`/api/proxy-download?url=${encodeURIComponent(res.temporalUrl!)}`);
          if (!response.ok) throw new Error(`Error descargando ${res.originalFileName}`);
          folder.file(res.originalFileName, await response.blob());
        })
      );
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recursos-${detail.brandName.toLowerCase().replace(/\s+/g, '-')}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`${toDownload.length} archivos descargados`);
    } catch (err: any) {
      toast.error(err?.message || 'Error al generar el ZIP');
    } finally {
      setZipping(false);
    }
  };

  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          {validatedResources.length === 0
            ? 'No hay recursos validados'
            : `${validatedResources.length} recurso${validatedResources.length !== 1 ? 's' : ''} validado${validatedResources.length !== 1 ? 's' : ''}`}
        </p>
        {validatedResources.length > 0 && (
          <button
            onClick={handleDownloadZip}
            disabled={zipping}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-60 cursor-pointer"
          >
            {zipping ? <Loader2 size={14} className="animate-spin" /> : <Archive size={14} />}
            {zipping ? 'Generando ZIP...' : 'Descargar ZIP'}
          </button>
        )}
      </div>

      {validatedResources.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-3">
            <Package size={24} className="text-gray-400" />
          </div>
          <p className="text-gray-500 text-sm">No hay recursos corporativos validados aún.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {validatedResources.map(res => (
            <div key={res.id} className="group">
              <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                {res.temporalUrl && !imgErrors.has(res.id) ? (
                  <>
                    <img
                      src={res.temporalUrl}
                      alt={res.originalFileName}
                      className="w-full h-full object-contain"
                      onError={() => setImgErrors(prev => new Set([...prev, res.id]))}
                    />
                    <a
                      href={res.temporalUrl}
                      download={res.originalFileName}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Descargar"
                    >
                      <Download size={22} className="text-white" />
                    </a>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <FileImage size={28} className="text-gray-300" />
                  </div>
                )}
              </div>
              <p className="text-[10px] text-gray-500 mt-1 truncate">{res.originalFileName}</p>
              <p className="text-[10px] text-gray-400">{fileSizeLabel(res.sizeBytes)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ResourcesTab;
