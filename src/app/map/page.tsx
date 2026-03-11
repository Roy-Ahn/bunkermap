"use client";

import { useState } from "react";
import Scene from "@/components/Scene";
import Sidebar from "@/components/Sidebar";

export interface Bunker {
  id: string;
  title: string;
  location: string;
  lat: number;
  lng: number;
  depth: string;
  capacity: string;
  description: string;
  image_url: string | null;
}

export default function Home() {
  const [selectedBunker, setSelectedBunker] = useState<Bunker | null>(null);

  return (
    <main className="flex h-screen w-screen bg-white text-black overflow-hidden font-sans">
      {/* Sidebar for bunker list & search */}
      <Sidebar onSelect={setSelectedBunker} />

      {/* 3D Scene / Globe Area */}
      <div className="flex-1 relative border-l border-gray-100">
        <Scene selectedBunker={selectedBunker} onSelectBunker={setSelectedBunker} />

        {/* Refined Brand Header Overlay */}
        <div className="absolute top-6 left-6 z-10 pointer-events-none">
          <h1 className="text-xl font-bold tracking-tighter uppercase">Bunker Finder</h1>
          <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest leading-none">Global Geospatial Archive // v1.0.2</p>
        </div>
      </div>
    </main>
  );
}

