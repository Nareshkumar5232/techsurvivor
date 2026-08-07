"use client";

import { useState, useEffect } from "react";
import { ParticipantSidebar } from "@/components/participant/sidebar";
import { RequireAuth, RequireProfileComplete, RequireRole } from "@/lib/auth/guards";
import { Menu, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ParticipantLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("tech_survivor_sidebar_collapsed");
    if (saved !== null) {
      setCollapsed(saved === "true");
    }
  }, []);

  const toggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("tech_survivor_sidebar_collapsed", String(next));
      return next;
    });
  };

  return (
    <RequireAuth>
      <RequireRole role="participant">
        <RequireProfileComplete>
          <div className="relative flex min-h-screen">
            {/* Mobile Header Menu Button */}
            <div className="fixed top-3 left-3 z-30 flex items-center gap-2 md:hidden">
              <button
                onClick={() => setMobileOpen(true)}
                className="flex h-10 w-10 items-center justify-center rounded-xl glass-panel text-navy-900 shadow-md backdrop-blur-md dark:text-white"
                aria-label="Open navigation menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>

            {/* Desktop Collapsible Sidebar */}
            <aside
              className={cn(
                "hidden flex-shrink-0 glass-panel border-0 border-r border-white/60 md:block dark:border-white/10 transition-all duration-300 ease-in-out sticky top-0 h-screen",
                collapsed ? "w-20" : "w-64",
              )}
            >
              <ParticipantSidebar collapsed={collapsed} onToggleCollapse={toggleCollapse} />
            </aside>

            {/* Mobile Drawer Overlay */}
            {mobileOpen && (
              <div className="fixed inset-0 z-50 flex md:hidden">
                <div
                  className="fixed inset-0 bg-navy-950/60 backdrop-blur-sm transition-opacity"
                  onClick={() => setMobileOpen(false)}
                />
                <aside className="relative z-50 h-full w-72 glass-panel bg-white/95 shadow-2xl dark:bg-navy-950/95">
                  <ParticipantSidebar
                    collapsed={false}
                    onCloseMobile={() => setMobileOpen(false)}
                  />
                </aside>
              </div>
            )}

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto overflow-x-hidden">{children}</main>
          </div>
        </RequireProfileComplete>
      </RequireRole>
    </RequireAuth>
  );
}
