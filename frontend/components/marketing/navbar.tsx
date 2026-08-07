"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/AuthProvider";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/about", label: "About" },
  { href: "/format", label: "Format" },
  { href: "/rules", label: "Rules" },
  { href: "/schedule", label: "Schedule" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

export function Navbar() {
  const pathname = usePathname();
  const { firebaseUser, role } = useAuth();
  const [open, setOpen] = useState(false);

  const homeHref = role === "admin" ? "/admin/dashboard" : firebaseUser ? "/dashboard" : "/";

  return (
    <header className="sticky top-0 z-40 glass-nav">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6" aria-label="Primary">
        {/* Logo */}
        <Link href={homeHref} className="flex items-center gap-2.5 group">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-sm font-black text-white shadow-md shadow-blue-500/25 transition-shadow group-hover:shadow-lg group-hover:shadow-blue-500/35">
            TS
          </span>
          <span className="bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent font-extrabold text-lg">
            Tech Survivor
          </span>
        </Link>

        {/* Mobile toggle */}
        <button
          className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 transition-colors sm:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        {/* Desktop links */}
        <div className="hidden items-center gap-1 sm:flex">
          {LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all duration-200",
                  active
                    ? "bg-blue-50 text-blue-700 font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Desktop CTA */}
        <div className="hidden items-center gap-3 sm:flex">
          {firebaseUser ? (
            <Link href={homeHref} className={buttonVariants({ variant: "primary", size: "sm" })}>
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                Log in
              </Link>
              <Link href="/register" className={buttonVariants({ variant: "primary", size: "sm" })}>
                Register
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="animate-slide-down border-t border-slate-100 bg-white/95 backdrop-blur-xl px-4 py-4 sm:hidden">
          <div className="flex flex-col gap-1">
            {LINKS.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active ? "bg-blue-50 text-blue-700 font-semibold" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                  )}
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              );
            })}
            <div className="mt-3 flex gap-2 pt-3 border-t border-slate-100">
              {firebaseUser ? (
                <Link href={homeHref} className={cn(buttonVariants({ variant: "primary", size: "sm" }), "flex-1")}>
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link href="/login" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "flex-1")}>
                    Log in
                  </Link>
                  <Link href="/register" className={cn(buttonVariants({ variant: "primary", size: "sm" }), "flex-1")}>
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
