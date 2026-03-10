import Link from 'next/link'

export default function NotFound() {
    return (
        <div className="flex h-screen w-screen flex-col items-center justify-center bg-black font-mono text-[#00FF41]">
            <div className="border border-[#00FF41]/30 bg-[#050505] p-12 text-center max-w-lg">
                <h2 className="mb-4 text-4xl font-bold tracking-[0.3em] uppercase opacity-70">
                    404 - Void
                </h2>
                <p className="mb-8 text-sm opacity-60 uppercase tracking-widest">
                    Coordinates invalid. Radar sweep reveals no targets at this sector.
                </p>
                <Link
                    href="/"
                    className="inline-block border border-[#00FF41]/50 px-6 py-2 text-sm uppercase tracking-wider transition-colors hover:bg-[#00FF41]/10 focus:outline-none"
                >
                    [Return to Base]
                </Link>
            </div>
        </div>
    )
}
