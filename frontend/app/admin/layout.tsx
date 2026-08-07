"use client";

import { useState, useEffect } from "react";
import { AdminSidebar } from "@/components/admin/sidebar";
import { RequireAuth, RequireRole } from "@/lib/auth/guards";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("tech_survivor_admin_sidebar_collapsed");
    if (saved !== null) {
      setCollapsed(saved === "true");
    }
  }, []);

  const toggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("tech_survivor_admin_sidebar_collapsed", String(next));
      return next;
    });
  };

  return (
    <RequireAuth>
      <RequireRole role="admin">
        <div className="relative flex min-h-screen bg-navy-950">
          {/* Mobile Header Menu Button */}
          <div className="fixed top-3 left-3 z-30 flex items-center gap-2 md:hidden">
            <button
              onClick={() => setMobileOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-xl glass-panel text-white shadow-md backdrop-blur-md"
              aria-label="Open admin navigation menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>

          {/* Desktop Collapsible Sidebar */}
          <aside
            className={cn(
              "hidden flex-shrink-0 md:block transition-all duration-300 ease-in-out sticky top-0 h-screen",
              collapsed ? "w-20" : "w-64",
            )}
          >
            <AdminSidebar collapsed={collapsed} onToggleCollapse={toggleCollapse} />
          </aside>

          {/* Mobile Drawer Overlay */}
          {mobileOpen && (
            <div className="fixed inset-0 z-50 flex md:hidden">
              <div
                className="fixed inset-0 bg-navy-950/80 backdrop-blur-sm transition-opacity"
                onClick={() => setMobileOpen(false)}
              />
              <aside className="relative z-50 h-full w-72 bg-navy-950 shadow-2xl">
                <AdminSidebar
                  collapsed={false}
                  onCloseMobile={() => setMobileOpen(false)}
                />
              </aside>
            </div>
          )}

          {/* Main Content Area */}
          <main className="flex-1 p-4 sm:p-8 overflow-x-hidden">{children}</main>
        </div>
      </RequireRole>
    </RequireAuth>
  );
}
