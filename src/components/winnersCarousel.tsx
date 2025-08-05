import React, { useEffect, useRef, useState } from "react";

type Winner = {
  id: number;
  name: string;
  prize: string;
  date: string;
};

const winners: Winner[] = [
  { id: 1, name: "Juan Pérez", prize: "iPhone 14", date: "03/08/2025" },
  { id: 2, name: "María Gómez", prize: "PlayStation 5", date: "02/08/2025" },
  { id: 3, name: "Carlos Ruiz", prize: "Smartwatch", date: "01/08/2025" },
  { id: 4, name: "Luisa Torres", prize: "Tablet Samsung", date: "31/07/2025" },
  { id: 5, name: "Andrés López", prize: 'TV 55"', date: "30/07/2025" },
  { id: 6, name: "Daniela Méndez", prize: "Laptop Dell", date: "29/07/2025" },
];

const VISIBLE_COUNT = 3;

const WinnersCarousel: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % winners.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getVisibleList = () => {
    const visible = [];
    for (let i = 0; i < winners.length; i++) {
      visible.push(winners[(currentIndex + i) % winners.length]);
    }
    return visible;
  };

  return (
    <div
      className={`
        bg-white border shadow-md rounded-xl z-30 overflow-hidden
        md:fixed md:top-24 md:right-6 md:w-64 md:h-[450px]
        w-full max-w-md mx-auto mt-8 md:mt-0
      `}
    > 
      <div className=" bg-blue-950 p-2 flex items-center justify-center">
        <h3 className="text-lg font-bold text-white">
        🏆  Últimos ganadores
        </h3>
      </div>

      <div
        ref={containerRef}
        className="relative h-[calc(100%-2rem)] overflow-hidden"
      >
        <div
          className="transition-transform duration-700 ease-in-out"
          style={{
            height: `${(winners.length / VISIBLE_COUNT) * 100}%`,
            transform: `translateY(-${(100 / winners.length) * currentIndex}%)`,
          }}
        >
          {getVisibleList().map((winner, index) => (
            <div
              key={`${winner.id}-${index}`}
              className="flex flex-col items-center text-center justify-center space-y-1"
              style={{ height: `${100 / winners.length}%` }}
            >
              <p className="text-sm font-semibold text-gray-800">
                🧑 {winner.name}
              </p>
              <p className="text-sm text-gray-600">🎁 {winner.prize}</p>
              <p className="text-xs text-gray-400">📅 {winner.date}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WinnersCarousel;


