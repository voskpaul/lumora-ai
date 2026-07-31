"use client";

import Link from "next/link";

export default function Navbar() {
  return (
    <header className="fixed top-0 z-50 w-full border-b border-white/10 bg-black/30 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">

        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-3"
        >
          <img
            src="/logo.svg"
            alt="Lumora AI"
            className="h-10 w-10"
          />

          <span className="text-xl font-bold tracking-tight">
            Lumora AI
          </span>
        </Link>

        {/* Navigation */}
        <nav className="hidden items-center gap-8 md:flex">
          <a
            href="#features"
            className="text-sm text-white/70 transition hover:text-white"
          >
            Features
          </a>

          <a
            href="#pricing"
            className="text-sm text-white/70 transition hover:text-white"
          >
            Pricing
          </a>

          <a
            href="#faq"
            className="text-sm text-white/70 transition hover:text-white"
          >
            FAQ
          </a>
        </nav>

        {/* Auth Actions */}
        <div className="flex items-center gap-3">
          <a
            href="/login"
            className="text-sm text-white/70 transition hover:text-white"
          >
            Login
          </a>

          <a
            href="/register"
            className="rounded-xl bg-linear-to-r from-violet-500 to-cyan-500 px-5 py-2 text-sm font-medium text-white transition hover:opacity-90"
          >
            Start Creating
          </a>
        </div>
      </div>
    </header>
  );
}