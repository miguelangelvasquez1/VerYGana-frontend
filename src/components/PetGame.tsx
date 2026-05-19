'use client';

import React from 'react';

const GAME_URL =
  'https://assets-abokamato.s3.us-east-2.amazonaws.com/PetVirtual/index.html';

const PetGame: React.FC = () => {
  return (
    <div className="w-full rounded-lg overflow-hidden border border-gray-200 shadow-sm">
      <iframe
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