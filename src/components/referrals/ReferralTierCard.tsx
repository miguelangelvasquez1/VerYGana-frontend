'use client';

import { Trophy, Ticket, CheckCircle } from 'lucide-react';

interface ReferralTierCardProps {
  level: string;
  minReferrals: number;
  ticketsPerReferral: number;
  color: string;
  isCurrent: boolean;
  isUnlocked: boolean;
}

export default function ReferralTierCard({
  level, minReferrals, ticketsPerReferral, color, isCurrent, isUnlocked,
}: ReferralTierCardProps) {
  return (
    <div className={`relative rounded-xl p-6 border-2 transition-all ${
      isCurrent  ? 'border-blue-500 bg-blue-50'  :
      isUnlocked ? 'border-green-300 bg-green-50' :
                   'border-gray-200 bg-gray-50'
    }`}>
      {isCurrent && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
            Nivel actual
          </span>
        </div>
      )}

      <div className={`w-12 h-12 bg-gradient-to-r ${color} rounded-lg flex items-center justify-center mb-4 mx-auto`}>
        <Trophy className="w-6 h-6 text-white" />
      </div>

      <div className="text-center">
        <h3 className="text-lg font-bold text-gray-900 mb-1">{level}</h3>
        <p className="text-sm text-gray-600 mb-4">{minReferrals}+ referidos</p>

        <div className="flex items-center justify-center gap-2 text-sm">
          <Ticket className="w-4 h-4 text-blue-600" />
          <span>
            <span className="font-semibold text-gray-900">{ticketsPerReferral}</span>
            {' '}ticket{ticketsPerReferral > 1 ? 's' : ''} por referido
          </span>
        </div>

        {isUnlocked && (
          <CheckCircle className="w-6 h-6 text-green-600 mx-auto mt-4" />
        )}
      </div>
    </div>
  );
}