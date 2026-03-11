import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#fafafa] p-4 text-center selection:bg-black selection:text-white">
      <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        
        {/* Main Headline */}
        <h1 className="text-5xl md:text-7xl lg:text-8xl tracking-tighter text-gray-500 font-light mix-blend-multiply">
          the only{" "}
          <span className="font-bold text-black opacity-100">
            'real.'
          </span>{" "}
          estate broker website
        </h1>
        
        {/* Subtitle */}
        <p className="mx-auto max-w-2xl text-lg md:text-xl text-gray-400 font-light tracking-wide uppercase">
          collection of the only real assets that matters after apocalypse
        </p>
        
        {/* CTA Button */}
        <div className="pt-12">
          <Link 
            href="/map"
            className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full border border-black bg-transparent px-8 py-4 font-medium text-black transition-all hover:bg-black hover:text-white focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
          >
            <span className="relative z-10 text-sm tracking-widest uppercase">explore now</span>
            <ArrowRight className="h-4 w-4 relative z-10 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
        
      </div>
    </div>
  );
}
