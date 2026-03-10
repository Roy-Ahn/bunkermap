// src/components/Sidebar.tsx
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface Bunker {
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

interface SidebarProps {
    onSelect: (b: Bunker) => void;
}

export default function Sidebar({ onSelect }: SidebarProps) {
    const [bunkers, setBunkers] = useState<Bunker[]>([]);
    const [filter, setFilter] = useState<string>("");

    useEffect(() => {
        const fetchBunkers = async () => {
            const { data, error } = await supabase.from("bunkers").select("*");
            if (!error && data) setBunkers(data as Bunker[]);
        };
        fetchBunkers();
    }, []);

    const filtered = bunkers.filter((b) =>
        b.title.toLowerCase().includes(filter.toLowerCase()) ||
        b.location.toLowerCase().includes(filter.toLowerCase())
    );

    return (
        <aside className="w-80 h-full bg-white border-r border-gray-100 flex flex-col">
            <div className="p-6 border-b border-gray-50">
                <input
                    type="text"
                    placeholder="SEARCH ARCHIVE..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="w-full bg-gray-50 p-3 text-[11px] tracking-widest uppercase focus:outline-none focus:ring-1 focus:ring-black transition-all"
                />
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <ul className="divide-y divide-gray-50">
                    {filtered.map((b) => (
                        <li
                            key={b.id}
                            className="group cursor-pointer p-6 hover:bg-gray-50 transition-colors"
                            onClick={() => onSelect(b)}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <h3 className="text-xs font-bold uppercase tracking-tight text-black group-hover:translate-x-1 transition-transform">{b.title}</h3>
                                <span className="text-[9px] text-gray-300 font-mono">[{b.id.slice(0, 4)}]</span>
                            </div>
                            <p className="text-[10px] text-gray-400 uppercase tracking-wider">{b.location}</p>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                <p className="text-[9px] text-gray-300 text-center uppercase tracking-widest">{filtered.length} BUNKERS INDEXED</p>
            </div>
        </aside>
    );
}

