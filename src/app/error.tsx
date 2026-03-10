"use client";

import { useEffect } from "react";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="flex h-screen w-screen flex-col items-center justify-center bg-black font-mono text-[#00FF41]">
            <div className="border border-[#FF0000]/50 bg-[#050505] p-8 text-center max-w-lg shadow-[0_0_15px_rgba(255,0,0,0.3)]">
                <h2 className="mb-4 text-2xl font-bold tracking-widest text-[#FF0000] animate-pulse">
                    CRITICAL SYSTEM FAILURE
                </h2>
                <p className="mb-8 text-sm opacity-80">
                    Global Radar Network connection severed. Unexpected anomaly detected in sector data stream. Data loss may have occurred.
                </p>
                <button
                    onClick={
                        // Attempt to recover by trying to re-render the segment
                        () => reset()
                    }
                    className="border border-[#00FF41]/50 bg-black px-6 py-2 text-sm uppercase tracking-wider transition-colors hover:bg-[#00FF41]/10 focus:outline-none"
                >
                    [Initiate System Reboot]
                </button>
            </div>
        </div>
    );
}
