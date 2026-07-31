"use client";

import { Bell, Search } from "lucide-react";

export default function Topbar() {
  return (
    <header className="h-20 border-b border-white/10 flex items-center justify-between px-6 bg-black/20 backdrop-blur-xl">
      <div className="flex items-center gap-3 glass px-4 py-2 rounded-xl w-[320px]">
        <Search size={18} className="text-gray-400" />

        <input
          type="text"
          placeholder="Search projects..."
          className="bg-transparent outline-none w-full text-sm"
        />
      </div>

      <button className="relative p-3 rounded-xl glass">
        <Bell size={18} />

        <span className="absolute top-1 right-1 w-2 h-2 bg-cyan-400 rounded-full" />
      </button>
    </header>
  );
}