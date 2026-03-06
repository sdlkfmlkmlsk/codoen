"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send, ShieldAlert, Loader2, User, Clock, CheckCircle, Ticket } from "lucide-react";

export default function AdminTicketViewPage() {
    const params = useParams();
    const router = useRouter();
    const ticketId = params?.id as string;

    const [ticket, setTicket] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [reply, setReply] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetch("/api/auth/me")
            .then(res => res.json())
            .then(data => {
                if (!data.user || data.user.role !== 'ADMIN') {
                    router.push("/auth");
                }
            })
            .catch(() => router.push("/auth"));
    }, [router]);

    useEffect(() => {
        if (!ticketId) return;
        fetchTicket();
    }, [ticketId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [ticket?.messages]);

    const fetchTicket = async () => {
        try {
            const res = await fetch(`/api/support/tickets/${ticketId}`);
            if (res.ok) {
                const data = await res.json();
                setTicket(data.ticket);
            } else {
                router.push("/admin/tickets");
            }
        } catch (error) {
            console.error("Failed to fetch ticket", error);
        } finally {
            setLoading(false);
        }
    };

    const handleReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reply.trim()) return;
        setSubmitting(true);

        try {
            const res = await fetch(`/api/support/tickets/${ticketId}/reply`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: reply })
            });

            if (res.ok) {
                const data = await res.json();
                setTicket((prev: any) => ({
                    ...prev,
                    messages: [...prev.messages, data.reply]
                }));
                setReply("");
            }
        } catch (error) {
            console.error("Reply failed", error);
        } finally {
            setSubmitting(false);
        }
    };

    const closeTicket = async () => {
        if (!confirm("Are you sure you want to close this ticket?")) return;
        try {
            const res = await fetch(`/api/support/tickets/${ticketId}/reply`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: 'CLOSED' })
            });

            if (res.ok) {
                setTicket((prev: any) => ({ ...prev, status: 'CLOSED' }));
            }
        } catch (error) {
            console.error("Close ticket failed", error);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 size={40} className="text-blue-500 animate-spin" />
                <div className="text-xs font-black uppercase tracking-[0.3em] text-white/30">Loading Ticket...</div>
            </div>
        );
    }

    if (!ticket) return null;

    return (
        <div className="p-6 md:p-10 font-sans max-w-7xl mx-auto w-full flex flex-col h-[calc(100vh-80px)]">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 shrink-0">
                <div className="flex items-center gap-6">
                    <Link
                        href="/admin/tickets"
                        className="h-12 w-12 rounded-2xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all border border-transparent hover:border-white/10 shadow-lg"
                    >
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest ${ticket.status === 'OPEN'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-red-500/10 text-red-500 border border-red-500/20'
                                }`}>
                                {ticket.status}
                            </span>
                            <span className="text-xs font-mono text-white/30 truncate">ID: {ticket.id.slice(-8)}</span>
                        </div>
                        <h1 className="text-2xl font-black text-white italic tracking-tighter">{ticket.subject}</h1>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 flex items-center gap-4 shadow-xl">
                        <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                            <User size={18} />
                        </div>
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-0.5">Reported By</div>
                            <div className="text-sm font-bold text-white">{ticket.user.name}</div>
                            <div className="text-xs text-white/50">{ticket.user.email}</div>
                        </div>
                    </div>

                    {ticket.status === 'OPEN' && (
                        <button
                            onClick={closeTicket}
                            className="h-14 px-6 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 hover:border-red-500/40 font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2"
                        >
                            <CheckCircle size={16} /> Close Ticket
                        </button>
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden flex flex-col shadow-2xl relative">

                {/* Background Details */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 blur-[100px] rounded-full pointer-events-none" />

                <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 custom-scrollbar relative z-10">
                    {ticket.messages.map((msg: any, idx: number) => {
                        const isAdminMsg = msg.isAdmin;

                        return (
                            <div key={msg.id} className={`flex flex-col ${isAdminMsg ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-5 duration-500`} style={{ animationFillMode: 'both', animationDelay: `${idx * 50}ms` }}>
                                {/* Label */}
                                <div className={`flex items-center gap-2 mb-2 px-1 ${isAdminMsg ? 'flex-row-reverse' : 'flex-row'}`}>
                                    <div className={`h-6 w-6 rounded-full flex items-center justify-center border ${isAdminMsg
                                        ? 'bg-red-500/20 border-red-500/30 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.3)]'
                                        : 'bg-blue-500/20 border-blue-500/30 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.3)]'
                                        }`}>
                                        {isAdminMsg ? <ShieldAlert size={10} /> : <User size={10} />}
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40">
                                        {isAdminMsg ? 'Support Team (You)' : ticket.user.name}
                                    </span>
                                    <span className="text-[9px] text-white/20 font-mono">
                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>

                                {/* Bubble */}
                                <div className={`max-w-[85%] md:max-w-[70%] p-5 rounded-2xl shadow-xl border whitespace-pre-wrap text-sm leading-relaxed ${isAdminMsg
                                    ? 'bg-red-600/10 border-red-500/20 text-white/90 rounded-tr-sm'
                                    : 'bg-blue-600/10 border-blue-500/20 text-white/90 rounded-tl-sm'
                                    }`}>
                                    {msg.content}
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                {ticket.status === 'OPEN' ? (
                    <div className="p-4 border-t border-white/5 bg-black/40 backdrop-blur-md shrink-0 relative z-20">
                        <form
                            onSubmit={handleReply}
                            className="relative flex items-end gap-3 bg-white/[0.03] border border-white/10 rounded-2xl p-2 focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/50 transition-all shadow-inner"
                        >
                            <textarea
                                value={reply}
                                onChange={e => setReply(e.target.value)}
                                placeholder="Type your response to the user..."
                                rows={1}
                                className="flex-1 bg-transparent text-white placeholder:text-white/20 px-4 py-3 outline-none resize-none custom-scrollbar min-h-[48px] max-h-[200px] font-sans"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleReply(e);
                                    }
                                }}
                            />
                            <button
                                type="submit"
                                disabled={submitting || !reply.trim()}
                                className="h-12 w-12 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:bg-white/10 disabled:text-white/30 text-white flex items-center justify-center transition-all shrink-0 border border-blue-400/20 shadow-lg"
                            >
                                {submitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="ml-0.5" />}
                            </button>
                        </form>
                    </div>
                ) : (
                    <div className="p-6 border-t border-white/5 bg-black/20 shrink-0 text-center">
                        <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/5 border border-white/10">
                            <Ticket size={18} className="text-white/30" />
                            <span className="text-xs font-black uppercase tracking-widest text-white/50">Ticket Closed</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
