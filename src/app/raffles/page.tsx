'use client';

import React from 'react';
import NavBar from '@/components/bars/NavBar';
import Footer from '@/components/Footer';
import WinnersCarousel from '@/components/winnersCarousel';

const raffles = [
  {
    id: 1,
    title: 'Rifa: iPhone 14 Pro Max',
    image: '/phones/iphone.webp',
    drawDate: '10 de agosto de 2025',
    ticketPrice: 1000,
    ticketsLeft: 50,
    totalTickets: 100,
    reward: 'iPhone 14 Pro Max',
    isActive: true,
  },
  {
    id: 2,
    title: 'Rifa: Smart TV 65\'\'',
    image: '/products/tv.jpg',
    drawDate: '12 de agosto de 2025',
    ticketPrice: 800,
    ticketsLeft: 20,
    totalTickets: 80,
    reward: 'Smart TV LG 65\'\'',
    isActive: true,
  },
  // Más rifas...
];

export default function RafflesPage() {
  return (
    <>
      <NavBar />

      {/* Carrusel lateral fijo */}
      <WinnersCarousel />

      <main className="bg-gradient-to-b from-[#E6F2FF] to-[#F4F8FB] min-h-screen py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 text-center sm:text-left">
            🎟️ Rifas activas
          </h1>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {raffles.map((raffle) => (
              <div
                key={raffle.id}
                className="bg-white shadow rounded-xl p-4 flex flex-col justify-between transition hover:shadow-lg"
              >
                <img
                  src={raffle.image}
                  alt={raffle.title}
                  className="w-full h-48 object-cover rounded-md mb-4"
                />

                <div className="flex-grow space-y-2">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-800">{raffle.title}</h2>
                  <p className="text-sm text-gray-600">📅 Sorteo: {raffle.drawDate}</p>
                  <p className="text-sm text-gray-600">🎁 Premio: {raffle.reward}</p>
                  <p className="text-sm text-gray-600">
                    💰 Ticket: <strong>{raffle.ticketPrice} créditos</strong>
                  </p>
                  <p className="text-sm text-gray-600">
                    🎟️ Tickets: {raffle.ticketsLeft} / {raffle.totalTickets}
                  </p>
                </div>

                <button
                  className="mt-4 w-full py-2 bg-blue-950 hover:bg-blue-700 text-white font-medium rounded-md transition"
                >
                  Comprar ticket
                </button>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
