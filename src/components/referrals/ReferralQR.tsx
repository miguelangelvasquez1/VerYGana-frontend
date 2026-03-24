'use client';

interface ReferralQRProps {
  base64: string;
  referralCode: string;
}

export default function ReferralQR({ base64, referralCode }: ReferralQRProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="w-48 h-48 rounded-xl overflow-hidden border border-gray-200 bg-white flex items-center justify-center">
        {base64 ? (
          <img
            src={`data:image/png;base64,${base64}`}
            alt={`QR referido ${referralCode}`}
            className="w-full h-full object-contain"
          />
        ) : (
          <span className="text-sm text-gray-400">Sin QR</span>
        )}
      </div>
      <p className="text-xs text-gray-400 text-center max-w-[180px] leading-relaxed">
        Escanea para ir directo al registro
      </p>
    </div>
  );
}