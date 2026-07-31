"use client";

import { Bell, ShieldCheck } from "lucide-react";

export default function AdminTopbar() {
  return (
    <header className="h-20 border-b border-white/10 flex items-center justify-between px-8 bg-black/20 backdrop-blur-xl">
      <div>
        <h2 className="text-2xl font-bold">
          Admin Control Center
        </h2>

        <p className="text-sm text-gray-400">
          Monitor users, AI processing, and revenue.
        </p>
      </div>

      <div className="flex items-center gap-4">
        <button className="glass p-3 rounded-xl">
          <Bell size={18} />
        </button>

        <div className="glass px-4 py-2 rounded-xl flex items-center gap-2">
          <ShieldCheck size={18} className="text-cyan-400" />
          <span className="text-sm">
            Super Admin
          </span>
        </div>
      </div>
    </header>
  );
}