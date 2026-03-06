"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send, ShieldAlert, Loader2, Clock, CheckCircle2 } from "lucide-react";

export default function TicketViewPage() {
    const params = useParams();
    const router = useRouter();
    const ticketId = params?.id as string;

    const [user, setUser] = useState<any>(null);
    const [ticket, setTicket] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [reply, setReply] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetch("/api/auth/me")
            .then(res => res.json())
            .then(data => {
                if (data.user) {
                    setUser(data.user);
                } else {
                    router.push("/auth");
                }
            })
            .catch(() => router.push("/auth"));
    }, [router]);

    useEffect(() => {
        if (!user || !ticketId) return;
        fetchTicket();
    }, [user, ticketId]);

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
                router.push("/dashboard/support");
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

    if (loading) {
        return (
            <div className="min-h-screen bg-[#060813] flex flex-col items-center justify-center gap-4">
                <Loader2 size={40} className="text-blue-500 animate-spin" />
                <div className="text-xs font-black uppercase tracking-[0.3em] text-white/30">Loading Ticket Data...</div>
            </div>
        );
    }

    if (!ticket) return null;

    return (
        <div className="relative min-h-screen bg-[#060813] flex flex-col font-sans overflow-hidden">
            {/* Nav Header */}
            <div className="border-b border-white/5 bg-black/20 backdrop-blur-md sticky top-0 z-30">
                <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Link
                            href="/dashboard/support"
                            className="h-10 w-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all border border-transparent hover:border-white/10"
                        >
                            <ArrowLeft size={18} />
                        </Link>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${ticket.status === 'OPEN'
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : 'bg-white/5 text-white/40 border border-white/10'
                                    }`}>
                                    {ticket.status}
                                </span>
                                <span className="text-[10px] font-mono text-white/30">#{ticket.id.slice(-8)}</span>
                            </div>
                            <h1 className="text-xl font-bold text-white tracking-tight">{ticket.subject}</h1>
                        </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-white/40 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                        <Clock size={14} />
                        Opened {new Date(ticket.createdAt).toLocaleDateString()}
                    </div>
                </div>
            </div>

            {/* Chat Container */}
            <div className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 flex flex-col">
                <div className="flex-1 space-y-6 pb-6">
                    {ticket.messages.map((msg: any, idx: number) => {
                        const isOwn = msg.userId === user?.id;

                        return (
                            <div key={msg.id} className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-5 duration-500`} style={{ animationFillMode: 'both', animationDelay: `${idx * 50}ms` }}>
                                {/* User Label */}
                                <div className={`flex items-center gap-2 mb-2 px-1 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                                    <div className={`h-6 w-6 rounded-full flex items-center justify-center border ${msg.isAdmin
                                        ? 'bg-red-500/20 border-red-500/30 text-red-400'
                                        : isOwn
                                            ? 'bg-blue-500/20 border-blue-500/30 text-blue-400'
                                            : 'bg-white/10 border-white/10 text-white/50'
                                        }`}>
                                        {msg.isAdmin ? <ShieldAlert size={10} /> : <div className="text-[10px] font-black">{isOwn ? "U" : "?"}</div>}
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40">
                                        {msg.isAdmin ? 'Support Staff' : (isOwn ? 'You' : 'User')}
                                    </span>
                                    <span className="text-[9px] text-white/20 font-mono">
                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>

                                {/* Message Bubble */}
                                <div className={`max-w-[85%] md:max-w-[75%] p-5 rounded-2xl shadow-xl border whitespace-pre-wrap text-sm leading-relaxed ${msg.isAdmin
                                    ? 'bg-gradient-to-br from-red-600/10 to-transparent border-red-500/20 text-white/90 rounded-tl-sm'
                                    : isOwn
                                        ? 'bg-blue-600 border-blue-500 shadow-blue-500/10 text-white rounded-tr-sm'
                                        : 'bg-white/5 border-white/10 text-white/80 rounded-tl-sm'
                                    }`}>
                                    {msg.content}
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                {/* Reply Input */}
                {ticket.status === 'OPEN' ? (
                    <div className="mt-auto sticky bottom-6 z-20">
                        <form
                            onSubmit={handleReply}
                            className="relative flex items-end gap-3 bg-[#060813]/90 backdrop-blur-xl p-3 border border-white/10 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.8)]"
                        >
                            <textarea
                                value={reply}
                                onChange={e => setReply(e.target.value)}
                                placeholder="Type your reply..."
                                rows={1}
                                className="flex-1 bg-transparent text-white placeholder:text-white/20 px-4 py-3 outline-none resize-none custom-scrollbar min-h-[48px] max-h-[200px]"
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
                                className="h-12 w-12 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:bg-white/10 disabled:text-white/30 text-white flex items-center justify-center transition-all shrink-0 border border-blue-400/20 shadow-lg"
                            >
                                {submitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="ml-0.5" />}
                            </button>
                        </form>
                    </div>
                ) : (
                    <div className="mt-auto py-6 border-t border-white/5 flex flex-col items-center justify-center gap-3">
                        <CheckCircle2 size={32} className="text-emerald-500/50" />
                        <p className="text-xs font-black uppercase tracking-widest text-white/30">This ticket has been marked as closed.</p>
                    </div>
                )}
            </div>
        </div >
    );
}
