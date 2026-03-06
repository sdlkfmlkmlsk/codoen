"use client";

import { ReactNode } from "react";
import { Heart } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Settings, Search, Monitor, ShoppingBag, ReceiptText, Terminal, FolderOpen, Database, Calendar, Users, Archive, Network, Power, Activity, ArrowLeft, Package, RotateCw } from "lucide-react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "";
  const isServerPage = pathname.startsWith("/dashboard/server/") && pathname.split("/").length > 3;

  return (
    <div className="flex min-h-screen bg-[#060813] text-white font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/5 bg-[#0B1021] flex flex-col relative z-20 shadow-2xl">
        <div className="p-6 flex items-center gap-3 border-b border-white/5">
          <span className="font-bold tracking-wide text-lg text-white">CODEON <span className="text-blue-400">HOSTING</span></span>
        </div>

        <div className="flex-1 py-6 px-4 space-y-6 overflow-y-auto">
          {isServerPage ? (
            <>
              <div>
                <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/50 hover:bg-white/5 hover:text-white transition-colors mb-4">
                  <ArrowLeft size={16} />
                  <span className="text-sm font-bold uppercase tracking-widest text-[10px]">Back to Servers</span>
                </Link>
                <div className="text-[10px] font-bold text-white/40 tracking-widest pl-3 mb-3 uppercase">Server Management</div>
                <nav className="space-y-1">
                  <Link href={`/dashboard/server/${pathname.split("/")[3]}`} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${pathname === `/dashboard/server/${pathname.split("/")[3]}` ? 'bg-[#141C34] text-blue-400 border-l-2 border-blue-500' : 'text-white/50 hover:bg-white/5 hover:text-white'}`}>
                    <Terminal size={18} />
                    <span className="text-sm font-semibold">Console</span>
                  </Link>
                  {[
                    { icon: <FolderOpen size={18} />, label: "File Manager", href: `/dashboard/server/${pathname.split("/")[3]}/files` },
                    { icon: <Database size={18} />, label: "Databases", href: `/dashboard/server/${pathname.split("/")[3]}/databases` },
                    { icon: <Calendar size={18} />, label: "Schedules", href: `/dashboard/server/${pathname.split("/")[3]}/schedules` },
                    { icon: <Users size={18} />, label: "Users", href: `/dashboard/server/${pathname.split("/")[3]}/users` },
                    { icon: <Archive size={18} />, label: "Backups", href: `/dashboard/server/${pathname.split("/")[3]}/backups` },
                    { icon: <Users size={18} />, label: "Players", href: `/dashboard/server/${pathname.split("/")[3]}/players` },
                    { icon: <Network size={18} />, label: "Network", href: `/dashboard/server/${pathname.split("/")[3]}/network` },
                    { icon: <Power size={18} />, label: "Startup", href: `/dashboard/server/${pathname.split("/")[3]}/startup` },
                    { icon: <Settings size={18} />, label: "Settings", href: `/dashboard/server/${pathname.split("/")[3]}/settings` },
                    { icon: <Activity size={18} />, label: "Activity", href: `/dashboard/server/${pathname.split("/")[3]}/activity` }
                  ].map(tab => (
                    <Link key={tab.label} href={tab.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${pathname === tab.href ? 'bg-[#141C34] text-blue-400 border-l-2 border-blue-500' : 'text-white/50 hover:bg-white/5 hover:text-white'}`}>
                      {tab.icon}
                      <span className="text-sm font-semibold">{tab.label}</span>
                    </Link>
                  ))}

                  <div className="mt-8 mb-3 text-[10px] font-bold text-white/40 tracking-widest pl-3 uppercase">More</div>
                  <Link href={`/dashboard/server/${pathname.split("/")[3]}/plugins`} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${pathname.includes("/plugins") ? 'bg-[#141C34] text-blue-400 border-l-2 border-blue-500' : 'text-white/50 hover:bg-white/5 hover:text-white'}`}>
                    <Package size={18} />
                    <span className="text-sm font-semibold">Plugins</span>
                  </Link>
                  <Link href={`/dashboard/server/${pathname.split("/")[3]}/versions`} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${pathname.includes("/versions") ? 'bg-[#141C34] text-emerald-400 border-l-2 border-emerald-500' : 'text-white/50 hover:bg-white/5 hover:text-white'}`}>
                    <RotateCw size={18} />
                    <span className="text-sm font-semibold">Versions</span>
                  </Link>
                  <div className="my-4 border-t border-white/5"></div>
                  <Link href="/admin/orders" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/50 hover:bg-white/5 hover:text-white transition-colors">
                    <Settings size={18} />
                    <span className="text-sm">Admin view</span>
                  </Link>
                </nav>
              </div>
            </>
          ) : (
            <>
              <div>
                <div className="text-[10px] font-bold text-white/40 tracking-widest pl-3 mb-3 uppercase">Dashboard</div>
                <nav className="space-y-1">
                  <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/50 hover:bg-[#141C34] hover:text-white transition-colors">
                    <Monitor size={18} />
                    <span className="text-sm font-semibold">Servers</span>
                  </Link>
                  <Link href="/dashboard/order" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/50 hover:bg-[#141C34] hover:text-white transition-colors">
                    <ShoppingBag size={18} />
                    <span className="text-sm font-semibold">New Service</span>
                  </Link>
                  <Link href="/dashboard/billing" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/50 hover:bg-[#141C34] hover:text-white transition-colors">
                    <ReceiptText size={18} />
                    <span className="text-sm font-semibold">Billing</span>
                  </Link>
                  <Link href="/dashboard/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/50 hover:bg-[#141C34] hover:text-white transition-colors">
                    <Settings size={18} />
                    <span className="text-sm font-semibold">Settings</span>
                  </Link>
                </nav>
              </div>

              <div>
                <div className="text-[10px] font-bold text-white/40 tracking-widest pl-3 mb-3 uppercase">Admin</div>
                <nav className="space-y-1">
                  <Link href="/admin/orders" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/50 hover:bg-[#141C34] hover:text-white transition-colors">
                    <Settings size={18} />
                    <span className="text-sm font-semibold">Order Approval</span>
                  </Link>
                  <Link href="/admin/users" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/50 hover:bg-[#141C34] hover:text-white transition-colors">
                    <Users size={18} />
                    <span className="text-sm font-semibold">Users</span>
                  </Link>
                </nav>
              </div>
            </>
          )}
        </div>

        <div className="p-4 border-t border-white/5 hover:bg-white/5 transition-colors cursor-pointer group">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-900 grid place-items-center flex-shrink-0">
              <User size={18} className="text-blue-300" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate group-hover:text-blue-400 transition-colors">Account</div>
              <div className="text-[11px] text-white/40 truncate">Logged in</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative h-screen overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 flex items-center justify-end px-6 border-b border-white/5 bg-[#0B1021]/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                placeholder="Search..."
                className="bg-black/40 border border-white/10 rounded-full pl-9 pr-4 py-1.5 text-xs text-white placeholder:text-white/30 outline-none focus:border-blue-500/50 w-56 transition-all"
              />
            </div>
            <Link href="/status" className="flex items-center gap-1.5 bg-white/5 hover:bg-[#141C34] border border-white/5 px-3 py-1.5 rounded-full transition-colors text-white">
              <Heart size={14} className="text-red-500 fill-current" />
              <span className="text-xs font-medium">Status</span>
            </Link>
            <button className="flex items-center gap-1.5 bg-white/5 hover:bg-[#141C34] border border-white/5 px-3 py-1.5 rounded-full transition-colors">
              <span className="text-xs font-medium">EN</span>
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
