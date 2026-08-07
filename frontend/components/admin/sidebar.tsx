"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import {
  LayoutDashboard,
  Settings,
  Users,
  ListChecks,
  Code2,
  SlidersHorizontal,
  Award,
  Activity,
  Trophy,
  Megaphone,
  ScrollText,
  Download,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from "lucide-react";
import { firebaseAuth } from "@/lib/firebaseClient";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/event-settings", label: "Event Settings", icon: Settings },
  { href: "/admin/participants", label: "Participants", icon: Users },
  { href: "/admin/mcq", label: "MCQ Question Bank", icon: ListChecks },
  { href: "/admin/problems", label: "Coding Problems", icon: Code2 },
  { href: "/admin/round-control", label: "Round Control", icon: SlidersHorizontal },
  { href: "/admin/round1-results", label: "Round 1 Results", icon: Award },
  { href: "/admin/submissions", label: "Submissions", icon: Activity },
  { href: "/admin/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
  { href: "/admin/audit-logs", label: "Audit Logs", icon: ScrollText },
  { href: "/admin/export", label: "Export Center", icon: Download },
];

export interface AdminSidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onCloseMobile?: () => void;
}

export function AdminSidebar({
  collapsed = false,
  onToggleCollapse,
  onCloseMobile,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await signOut(firebaseAuth);
    router.replace("/login");
  }

  return (
    <nav
      className={cn(
        "flex h-full w-full flex-col gap-1 overflow-y-auto glass-panel border-0 border-r border-white/10 bg-navy-950/85 backdrop-blur-2xl transition-all duration-300",
        collapsed ? "p-3" : "p-4",
      )}
      aria-label="Admin navigation"
    >
      {/* Header with Logo and Open/Close Toggle Button */}
      <div
        className={cn(
          "mb-6 flex items-center justify-between px-1 text-lg font-bold text-white",
          collapsed && "flex-col gap-3 justify-center text-center",
        )}
      >
        <Link href="/admin/dashboard" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-sm font-black text-white shadow-md shadow-purple-500/25">
            TS
          </span>
          {!collapsed && (
            <span className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent font-extrabold">
              Admin Console
            </span>
          )}
        </Link>

        {/* Toggle Button for Desktop */}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
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
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-white/10 hover:text-white md:hidden"
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
              "flex items-center gap-3 rounded-xl py-2 text-sm font-medium transition-all duration-200",
              collapsed ? "justify-center px-0" : "px-3",
              active
                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md shadow-blue-500/20 font-semibold"
                : "text-slate-300 hover:bg-white/10 hover:text-white",
            )}
            aria-current={active ? "page" : undefined}
          >
            <Icon
              className={cn(
                "h-4 w-4 flex-shrink-0 transition-transform duration-200",
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
          "mt-6 flex items-center gap-3 rounded-xl py-2 text-sm font-medium text-slate-400 transition-all duration-200 hover:bg-red-500/20 hover:text-red-300",
          collapsed ? "justify-center px-0" : "px-3",
        )}
      >
        <LogOut className="h-4 w-4 flex-shrink-0 opacity-75" aria-hidden="true" />
        {!collapsed && <span className="truncate">Log out</span>}
      </button>
    </nav>
  );
}
