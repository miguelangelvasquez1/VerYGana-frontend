'use client';

import { useState } from 'react';
import { Copy, CheckCircle } from 'lucide-react';

interface ReferralCodeBoxProps {
  referralCode: string;
  referralLink: string;
}

function useCopy() {
  const [copied, setCopied] = useState(false);

  const copy = (text: string) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        });
      } else {
        const el = document.createElement('textarea');
        el.value = text;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (e) {
      console.error('Error al copiar:', e);
    }
  };

  return { copied, copy };
}

export default function ReferralCodeBox({ referralCode, referralLink }: ReferralCodeBoxProps) {
  const code = useCopy();
  const link = useCopy();

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <div className="text-3xl font-bold text-blue-600 mb-1 tracking-widest font-mono">
          {referralCode}
        </div>
        <div className="text-gray-500 text-sm break-all">{referralLink}</div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => code.copy(referralCode)}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          {code.copied
            ? <CheckCircle className="w-4 h-4 text-green-600" />
            : <Copy className="w-4 h-4" />}
          {code.copied ? '¡Código copiado!' : 'Copiar código'}
        </button>

        <button
          onClick={() => link.copy(referralLink)}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {link.copied
            ? <CheckCircle className="w-4 h-4" />
            : <Copy className="w-4 h-4" />}
          {link.copied ? '¡Link copiado!' : 'Copiar link'}
        </button>
      </div>
    </div>
  );
}