'use client';

import React from 'react';
import { usePetBridge } from '@/hooks/pet/usePetBridge';

const GAME_URL =
  'https://assets-abokamato.s3.us-east-2.amazonaws.com/PetVirtual/index.html';

const PetGame: React.FC = () => {
  const { iframeRef } = usePetBridge();

  return (
    <div className="w-full rounded-lg overflow-hidden border border-gray-200 shadow-sm">
      <iframe
        ref={iframeRef}
        src={GAME_URL}
        width="100%"
        height="600px"
        style={{ border: 'none' }}
        title="Mascota Virtual"
        allow="autoplay; fullscreen *"
        allowFullScreen
      />
    </div>
  );
};

export default PetGame;