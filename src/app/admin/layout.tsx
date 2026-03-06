import { ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#070b19] flex flex-col">
       <header className="h-16 flex items-center px-6 border-b border-white/5 bg-[#0a0f25] sticky top-0 z-10">
           <Link href="/dashboard" className="flex items-center gap-2 text-sm font-semibold text-white/50 hover:text-white transition-colors">
               <ChevronLeft size={16} /> Exit Admin Panel
           </Link>
           <div className="ml-auto text-xs font-bold uppercase tracking-widest text-emerald-400 border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 rounded-full">
               Admin Mode
           </div>
       </header>
       <main className="flex-1 overflow-y-auto">
          {children}
       </main>
    </div>
  );
}
