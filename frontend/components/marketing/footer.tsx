import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-slate-100 bg-slate-50/80 backdrop-blur-sm">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3 sm:px-6">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-xs font-black text-white shadow-sm">
              TS
            </span>
            <p className="text-base font-bold text-slate-900">Tech Survivor</p>
          </div>
          <p className="mt-3 text-sm text-slate-500 leading-relaxed">
            An individual-participation technical event: an MCQ qualification round followed by a
            live coding challenge.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Event</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-500">
            <li><Link href="/format" className="hover:text-blue-600 transition-colors">Format</Link></li>
            <li><Link href="/rules" className="hover:text-blue-600 transition-colors">Rules</Link></li>
            <li><Link href="/schedule" className="hover:text-blue-600 transition-colors">Schedule</Link></li>
            <li><Link href="/faq" className="hover:text-blue-600 transition-colors">FAQ</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Get started</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-500">
            <li><Link href="/register" className="hover:text-blue-600 transition-colors">Register</Link></li>
            <li><Link href="/login" className="hover:text-blue-600 transition-colors">Log in</Link></li>
            <li><Link href="/contact" className="hover:text-blue-600 transition-colors">Contact organizers</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-100 px-4 py-4 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} Tech Survivor Organizing Committee. All rights reserved.
      </div>
    </footer>
  );
}
