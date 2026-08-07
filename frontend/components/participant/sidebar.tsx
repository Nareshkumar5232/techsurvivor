"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import {
  LayoutDashboard,
  ListChecks,
  Code2,
  Trophy,
  User,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from "lucide-react";
import { firebaseAuth } from "@/lib/firebaseClient";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/round1", label: "Round 1 - MCQ", icon: ListChecks },
  { href: "/round2", label: "Round 2 - Coding", icon: Code2 },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/profile", label: "Profile", icon: User },
];

export interface ParticipantSidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onCloseMobile?: () => void;
}

export function ParticipantSidebar({
  collapsed = false,
  onToggleCollapse,
  onCloseMobile,
}: ParticipantSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await signOut(firebaseAuth);
    router.replace("/login");
  }

  return (
    <nav
      className={cn(
        "flex h-full w-full flex-col gap-1.5 transition-all duration-300",
        collapsed ? "p-3" : "p-4",
      )}
      aria-label="Participant navigation"
    >
      {/* Header with Logo and Open/Close Toggle Button */}
      <div
        className={cn(
          "mb-6 flex items-center justify-between px-1 text-lg font-bold text-navy-900 dark:text-white",
          collapsed && "flex-col gap-3 justify-center text-center",
        )}
      >
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 text-sm font-black text-white shadow-md shadow-blue-500/20">
            TS
          </span>
          {!collapsed && (
            <span className="bg-gradient-to-r from-navy-900 to-slate-700 bg-clip-text text-transparent font-extrabold dark:from-white dark:to-slate-300">
              Tech Survivor
            </span>
          )}
        </Link>

        {/* Toggle Button for Desktop */}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-white/60 hover:text-navy-900 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
            title={collapsed ? "Open sidebar" : "Close sidebar"}
            aria-label={collapsed ? "Open sidebar" : "Close sidebar"}
          >
            {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
          </button>
        )}

        {/* Close Button for Mobile Drawer */}
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 md:hidden dark:text-slate-400 dark:hover:bg-white/10"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            onClick={onCloseMobile}
            title={collapsed ? label : undefined}
            className={cn(
              "flex items-center gap-3 rounded-xl py-2.5 text-sm font-medium transition-all duration-200",
              collapsed ? "justify-center px-0" : "px-3.5",
              active
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25 font-semibold"
                : "text-slate-600 hover:bg-white/60 hover:text-navy-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white",
            )}
            aria-current={active ? "page" : undefined}
          >
            <Icon
              className={cn(
                "h-5 w-5 flex-shrink-0 transition-transform duration-200",
                active ? "scale-110 text-white" : "opacity-75",
              )}
              aria-hidden="true"
            />
            {!collapsed && <span className="truncate">{label}</span>}
          </Link>
        );
      })}

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        title={collapsed ? "Log out" : undefined}
        className={cn(
          "mt-auto flex items-center gap-3 rounded-xl py-2.5 text-sm font-medium text-slate-600 transition-all duration-200 hover:bg-red-500/10 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-500/20 dark:hover:text-red-400",
          collapsed ? "justify-center px-0" : "px-3.5",
        )}
      >
        <LogOut className="h-5 w-5 flex-shrink-0 opacity-75" aria-hidden="true" />
        {!collapsed && <span className="truncate">Log out</span>}
      </button>
    </nav>
  );
}
