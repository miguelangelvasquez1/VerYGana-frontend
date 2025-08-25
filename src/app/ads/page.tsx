'use client';

import Sidebar from "@/components/AdsPage/Sidebar";
import VideoAdPlayer from "@/components/AdsPage/VideoAdPlayer";
import Navbar from "@/components/bars/NavBar";
import { useState } from "react";

export default function AnunciosPage() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="h-screen overflow-hidden bg-black">
            <Navbar />
            
            {/* Mobile Menu Button - Hide when sidebar is open */}
            {!isSidebarOpen && (
                <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="md:hidden fixed top-20 left-4 z-50 bg-black/60 backdrop-blur-sm text-white p-2 rounded-lg border border-gray-700"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
            )}

            {/* Main Container - Fixed height accounting for navbar and mobile bottom nav */}
            <div className="flex text-white relative h-[calc(100vh-144px)] lg:h-[calc(100vh-64px)]">
                {/* Sidebar Overlay - Mobile */}
                {isSidebarOpen && (
                    <div 
                        className="md:hidden fixed inset-0 bg-black/50 z-40 top-0"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}

                {/* Sidebar */}
                <aside className={`
                    fixed md:static top-0 left-0 h-[calc(100vh-144px)] w-80 z-40
                    transform transition-transform duration-300 ease-in-out
                    ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                    md:w-72 lg:w-80
                    md:h-[calc(100vh-144px)] lg:h-[calc(100vh-64px)]
                    mt-[74px] md:mt-0
                `}>
                    <Sidebar onClose={() => setIsSidebarOpen(false)} />
                </aside>

                {/* Main Content - Video Player */}
                <section className="flex-1 relative overflow-hidden h-full">
                    <VideoAdPlayer />
                </section>
            </div>
        </div>
    );
}