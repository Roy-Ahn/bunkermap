import type { Metadata } from "next";
import { Geist, Space_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  variable: "--font-space-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bunker Finder",
  description: "Global bunker radar sweep and analysis.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${spaceMono.variable} antialiased bg-white text-black font-sans h-screen w-screen overflow-hidden select-none`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
