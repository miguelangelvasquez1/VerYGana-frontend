"use client";

import LastRafflesResultsPanel from "./LastRafflesResultsPanel";
import LastWinnersPanel from "./LastWinnersPanel";

export default function RafflesSidebar() {
  return (
    <div className="space-y-4">
      <LastRafflesResultsPanel />
      <LastWinnersPanel />
    </div>
  );
}