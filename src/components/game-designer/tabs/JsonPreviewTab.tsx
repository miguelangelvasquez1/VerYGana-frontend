'use client';

import React, { useMemo } from 'react';
import { Copy, FileJson2 } from 'lucide-react';
import toast from 'react-hot-toast';

function syntaxHighlight(json: string): string {
  // Escape HTML entities first to prevent XSS
  const safe = json
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Colorize tokens: key strings, value strings, keywords, numbers
  return safe.replace(
    /("(?:[^"\\]|\\.)*")(\s*:)|("(?:[^"\\]|\\.)*")|(\btrue\b|\bfalse\b|\bnull\b)|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g,
    (match, key, colon, str, keyword, num) => {
      if (key && colon) return `<span style="color:#c084fc;font-weight:600">${key}</span>${colon}`;
      if (str)          return `<span style="color:#4ade80">${str}</span>`;
      if (keyword)      return `<span style="color:#fbbf24">${keyword}</span>`;
      if (num != null)  return `<span style="color:#60a5fa">${num}</span>`;
      return match;
    }
  );
}

interface Props {
  gameConfig: Record<string, unknown>;
}

function stripAssetIds(data: unknown): unknown {
  if (Array.isArray(data)) return data.map(stripAssetIds);
  if (data !== null && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    if ('assetId' in obj && 'url' in obj) return obj.url;
    return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, stripAssetIds(v)]));
  }
  return data;
}

export const JsonPreviewTab: React.FC<Props> = ({ gameConfig }) => {
  const isEmpty = Object.keys(gameConfig).length === 0;
  const stripped = useMemo(() => stripAssetIds(gameConfig) as Record<string, unknown>, [gameConfig]);
  const json = useMemo(() => JSON.stringify(stripped, null, 2), [stripped]);
  const highlighted = useMemo(() => syntaxHighlight(json), [json]);

  const handleCopy = () => {
    navigator.clipboard.writeText(json).then(() => {
      toast.success('JSON copiado al portapapeles');
    });
  };

  if (isEmpty) {
    return (
      <div className="p-5 flex flex-col items-center justify-center py-16 text-center">
        <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-3">
          <FileJson2 size={24} className="text-gray-400" />
        </div>
        <p className="text-sm text-gray-500 font-medium">Sin datos aún</p>
        <p className="text-xs text-gray-400 mt-1 max-w-xs">
          Edita la pestaña de configuración — los cambios se reflejan aquí en tiempo real.
        </p>
      </div>
    );
  }

  return (
    <div className="p-5 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">
          Vista en tiempo real ·{' '}
          <code className="bg-gray-100 px-1 rounded text-violet-700 font-mono">gameConfig</code>
        </p>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
        >
          <Copy size={12} />
          Copiar JSON
        </button>
      </div>
      <div className="rounded-xl overflow-hidden border border-gray-800">
        <pre
          className="text-xs leading-relaxed p-5 overflow-x-auto font-mono bg-gray-950 text-gray-300"
          // Safe: input is JSON.stringify output, HTML-escaped before regex injection
          dangerouslySetInnerHTML={{ __html: highlighted }}
        />
      </div>
    </div>
  );
};

export default JsonPreviewTab;
