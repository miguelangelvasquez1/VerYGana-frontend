import React, { useState } from 'react';

type Ad = {
  title: string;
  description: string;
  advertiser: string;
  minimumViewTime: number;
  creditReward: number;
  url: string; // Ruta del video (puede ser local o remota)
};

interface AdCardProps {
  ad: Ad;
}

const AdCard: React.FC<AdCardProps> = ({ ad }) => {
  const [showVideo, setShowVideo] = useState(false);

  const handleStart = () => {
    setShowVideo(true);
  };

  return (
    <div className="w-full max-w-md mx-auto border rounded-xl p-4 shadow-md bg-white space-y-4">
      <h2 className="text-xl font-bold text-gray-800">{ad.title}</h2>
      <p className="text-sm text-gray-600">Anunciante: {ad.advertiser}</p>

      {showVideo ? (
        <video
          className="w-full h-80 rounded"
          controls
          autoPlay
          src={ad.url} // Usa la URL del modelo Ad
        >
          Tu navegador no soporta la etiqueta de video.
        </video>
      ) : (
        <>
          <p className="text-gray-700">{ad.description}</p>
          <p className="text-sm text-gray-500">
            Recompensa: <strong>{ad.creditReward}</strong> créditos <br />
            Tiempo mínimo: {ad.minimumViewTime} segundos
          </p>
          <button
            onClick={handleStart}
            className="w-full py-2 mt-4 bg-green-600 text-white font-semibold rounded hover:bg-green-700"
          >
            Empezar
          </button>
        </>
      )}
    </div>
  );
};

export default AdCard;
