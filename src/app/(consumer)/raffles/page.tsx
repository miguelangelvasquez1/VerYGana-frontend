"use client";

import LiveRafflesCarousel from "@/components/consumer/raffles/LiveRafflesCarousel";
import ActiveRafflesSection from "@/components/consumer/raffles/ActiveRafflesSection";


export default function RafflesPage() {
  return (
    <div className="w-full min-h-screen bg-gray-50">

      <section className="w-full px-6 xl:px-10 py-8 space-y-10">

        {/* 🔥 HERO LIVE */}
        <LiveRafflesCarousel />

        {/* 🎯 ACTIVAS */}
        <ActiveRafflesSection />

      </section>

    </div>
  );
}