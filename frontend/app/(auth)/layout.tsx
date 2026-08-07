import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50/30 px-4 py-12">
      {/* Decorative ambient blobs */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-blue-500/8 blur-3xl animate-pulse-glow" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-indigo-500/8 blur-3xl animate-pulse-glow [animation-delay:2s]" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-purple-500/4 blur-3xl" />

      <Link href="/" className="mb-8 flex items-center gap-2.5 group">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-base font-black text-white shadow-lg shadow-blue-500/25 transition-shadow group-hover:shadow-xl group-hover:shadow-blue-500/35">
          TS
        </span>
        <span className="bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent font-black text-2xl">
          Tech Survivor
        </span>
      </Link>

      <div className="relative z-10 w-full max-w-md animate-fade-in">{children}</div>
    </div>
  );
}
