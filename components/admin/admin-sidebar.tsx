"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Activity,
  Settings,
} from "lucide-react";

const links = [
  {
    name: "Overview",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    name: "Users",
    href: "/admin/users",
    icon: Users,
  },
  {
    name: "Revenue",
    href: "/admin/revenue",
    icon: CreditCard,
  },
  {
    name: "AI Queue",
    href: "/admin/queue",
    icon: Activity,
  },
  {
    name: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
];

export default function AdminSidebar() {
  return (
    <aside className="hidden lg:flex flex-col w-72 min-h-screen border-r border-white/10 bg-black/30 backdrop-blur-xl">
      <div className="p-6 border-b border-white/10">
        <h1 className="text-3xl font-bold gradient-text">
          Lumora-ai Admin
        </h1>
      </div>

      <nav className="flex-1 p-5 space-y-3">
        {links.map((link) => {
          const Icon = link.icon;

          return (
            <Link
              key={link.name}
              href={link.href}
              className="flex items-center gap-3 px-4 py-4 rounded-2xl text-gray-300 hover:bg-white/10 hover:text-white transition"
            >
              <Icon size={20} />
              {link.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}