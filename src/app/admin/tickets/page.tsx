"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Loader2, Inbox, MessageSquare, Clock, ArrowRight, User } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AdminTicketsPage() {
    const router = useRouter();
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/auth/me")
            .then(res => res.json())
            .then(data => {
                if (!data.user || data.user.role !== 'ADMIN') {
                    router.push("/auth");
                } else {
                    fetchTickets();
                }
            })
            .catch(() => router.push("/auth"));
    }, [router]);

    const fetchTickets = async () => {
        try {
            const res = await fetch("/api/support/tickets");
            const data = await res.json();
            if (res.ok) setTickets(data.tickets || []);
        } catch (error) {
            console.error("Failed to load tickets", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 md:p-10 font-sans max-w-6xl mx-auto w-full">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase mb-1">
                        SUPPORT <span className="text-blue-500">TICKETS</span>
                    </h1>
                    <p className="text-white/40 text-xs font-bold uppercase tracking-widest">
                        Manage user support requests
                    </p>
                </div>
            </div>

            <div className="grid gap-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4 bg-white/[0.02] border border-white/5 rounded-3xl">
                        <Loader2 size={40} className="text-blue-500 animate-spin" />
                        <div className="text-xs font-black uppercase tracking-[0.3em] text-white/30">Syncing Database...</div>
                    </div>
                ) : tickets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 bg-white/[0.02] border border-dashed border-white/10 rounded-3xl">
                        <Inbox size={48} className="text-white/10 mb-6" />
                        <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight">Inbox Zero</h3>
                        <p className="text-white/40 text-sm">There are no active support tickets right now.</p>
                    </div>
                ) : (
                    tickets.map((ticket) => (
                        <Link href={`/admin/tickets/${ticket.id}`} key={ticket.id}>
                            <div className="group bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 hover:border-blue-500/30 rounded-2xl p-4 transition-all duration-300 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">

                                <div className={`absolute top-0 left-0 w-1.5 h-full ${ticket.status === 'OPEN' ? 'bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)]' : 'bg-white/20'}`} />

                                <div className="pl-4 flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest ${ticket.status === 'OPEN'
                                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                            : 'bg-white/5 text-white/40 border border-white/10'
                                            }`}>
                                            {ticket.status}
                                        </span>
                                        <span className="text-[10px] font-mono text-white/30 truncate">#{ticket.id.slice(-8)}</span>
                                    </div>
                                    <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors truncate">
                                        {ticket.subject}
                                    </h3>
                                </div>

                                <div className="flex flex-col md:flex-row md:items-center gap-6 pl-4 md:pl-0">
                                    <div className="flex items-center gap-2 bg-black/40 border border-white/5 rounded-xl px-4 py-2">
                                        <User size={14} className="text-blue-400" />
                                        <span className="text-xs font-bold text-white/80">{ticket.user?.name || "Unknown"}</span>
                                    </div>

                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/30">
                                        <Clock size={12} />
                                        <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                                    </div>

                                    <div className="h-10 w-10 shrink-0 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/30 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-400 transition-all duration-300">
                                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
}
