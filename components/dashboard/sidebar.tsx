"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  LayoutDashboard,
  FolderKanban,
  Video,
  Sparkles,
  CreditCard,
  Settings,
  User,
  ImageIcon,
} from "lucide-react";

const items = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Projects",
    href: "/dashboard/projects",
    icon: FolderKanban,
  },
  {
    label: "Videos",
    href: "/dashboard/videos",
    icon: Video,
  },
  {
    label: "Templates",
    href: "/dashboard/templates",
    icon: Sparkles,
  },
  {
    label: "Billing",
    href: "/dashboard/billing",
    icon: CreditCard,
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
  {
    label: "Profile",
    href: "/dashboard/profile",
    icon: User,
  },
  {
  label: "AI Images",
  href: "/dashboard/images",
  icon: ImageIcon,
},
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden h-full w-72 shrink-0 flex-col overflow-hidden border-r border-white/10 bg-black/20 backdrop-blur-xl lg:flex">

      {/* Logo */}
      <div className="flex h-20 items-center border-b border-white/10 px-6">

        <div className="flex items-center gap-3">

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-r from-violet-500 to-cyan-500 font-bold">
            L
          </div>

          <div>
            <h2 className="text-lg font-bold">
              Lumora AI
            </h2>

            <p className="text-xs text-white/50">
              Creative Studio
            </p>
          </div>

        </div>

      </div>

      {/* Navigation */}
      <div className="min-h-0 flex-1 overflow-y-auto p-4">

        <div className="mb-3 px-3 text-xs uppercase tracking-widest text-white/40">
          Workspace
        </div>

        <div className="space-y-2">

          {items.map((item) => {
            const active =
              pathname === item.href ||
              pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 transition ${
                  active
                    ? "bg-linear-to-r from-violet-500/20 to-cyan-500/20 text-white border border-white/10"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <item.icon className="h-5 w-5" />

                <span>{item.label}</span>
              </Link>
            );
          })}

        </div>

      </div>

      {/* Bottom Card */}
      <div className="mx-4 mb-4 shrink-0 rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">

        <p className="text-sm font-medium">
          Free Plan
        </p>

        <p className="mt-1 text-xs text-white/50">
          Upgrade to Pro for unlimited AI video generation.
        </p>

        <button className="mt-4 w-full rounded-xl bg-linear-to-r from-violet-500 to-cyan-500 py-2 text-sm font-medium">
          Upgrade
        </button>

      </div>

    </aside>
  );
}