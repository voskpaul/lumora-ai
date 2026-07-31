"use client";

import { Button } from "@/components/ui/button";

export default function HeroSection() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-6">
      
      {/* Background Glow */}
      <div className="absolute inset-0 grid-bg opacity-30" />

      <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-500/20 blur-3xl" />

      {/* Content */}
      <div className="relative z-10 flex max-w-6xl flex-col items-center">
        
        <div className="glass mb-6 rounded-full px-5 py-2 text-sm text-white/70">
          AI Video Generation Platform
        </div>

        <h1 className="max-w-5xl text-center text-5xl font-extrabold leading-tight md:text-7xl">
          Create Cinematic
          <span className="gradient-text"> AI Videos </span>
          In Seconds
        </h1>

        <p className="mt-6 max-w-2xl text-center text-lg text-white/70">
          Generate films, commercials, animations, avatars,
          ads, reels, and visual effects using next-generation AI.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Button size="lg">
            Start Creating
          </Button>

          <Button
            variant="outline"
            size="lg"
          >
            Watch Demo
          </Button>
        </div>
      </div>
    </section>
  );
}