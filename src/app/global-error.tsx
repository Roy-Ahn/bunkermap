"use client";

import { useEffect } from "react";
import { Geist, Space_Mono } from "next/font/google";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const spaceMono = Space_Mono({
    weight: ["400", "700"],
    variable: "--font-space-mono",
    subsets: ["latin"],
});

export default function GlobalError({
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
        <html lang="en" className="dark">
            <body className={`${geistSans.variable} ${spaceMono.variable} antialiased bg-black text-[#FF0000] font-mono h-screen w-screen overflow-hidden select-none flex flex-col items-center justify-center`}>
                <div className="border-2 border-[#FF0000] p-12 text-center max-w-xl">
                    <h1 className="text-4xl font-bold mb-4 uppercase tracking-[0.2em] glitch-text">Terminal Error</h1>
                    <p className="opacity-80 mb-8 uppercase text-xs tracking-widest">
                        Core layout rendering failed. The system cannot be recovered automatically.
                    </p>
                    <button
                        onClick={() => reset()}
                        className="border border-[#FF0000]/50 px-8 py-3 uppercase tracking-widest hover:bg-[#FF0000]/20 transition-all focus:outline-none"
                    >
                        [Hard Reset]
                    </button>
                </div>
            </body>
        </html>
    );
}
