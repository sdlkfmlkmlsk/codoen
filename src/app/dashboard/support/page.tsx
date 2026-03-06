"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, MessageSquare, Clock, ArrowRight, Loader2, X, Send } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SupportPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);

    // New Ticket State
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetch("/api/auth/me")
            .then(res => res.json())
            .then(data => {
                if (data.user) {
                    setUser(data.user);
                    fetchTickets();
                } else {
                    router.push("/auth");
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

    const handleCreateTicket = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch("/api/support/tickets", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ subject, initialMessage: message })
            });

            if (res.ok) {
                const data = await res.json();
                router.push(`/dashboard/support/${data.ticket.id}`);
            }
        } catch (err) {
            console.error("Create ticket error", err);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="relative min-h-screen bg-gray-950 p-6 lg:p-12 font-sans overflow-y-auto">
            <div className="relative z-10 max-w-6xl mx-auto flex flex-col gap-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/10">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">
                            Support Center
                        </h1>
                        <p className="text-gray-400 text-sm">Need help? Open a ticket and our team will jump in.</p>
                    </div>
                    <button
                        onClick={() => setShowCreate(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium shrink-0"
                    >
                        <Plus size={16} />
                        <span>New Ticket</span>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 w-full">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 size={40} className="text-blue-500 animate-spin" />
                            <div className="text-xs font-black uppercase tracking-[0.3em] text-white/30">Loading Records...</div>
                        </div>
                    ) : tickets.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-16 border border-dashed border-white/10 rounded-3xl bg-white/[0.02] backdrop-blur-sm">
                            <div className="h-20 w-20 rounded-full bg-blue-500/10 flex items-center justify-center mb-6 border border-blue-500/20 text-blue-400">
                                <MessageSquare size={32} />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">No Tickets Found</h3>
                            <p className="text-gray-400 text-sm mb-8 text-center max-w-md">You haven't opened any support tickets yet. If you need assistance with your server or account, create one now.</p>
                            <button
                                onClick={() => setShowCreate(true)}
                                className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                                Open Ticket
                            </button>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {tickets.map((ticket) => (
                                <Link href={`/dashboard/support/${ticket.id}`} key={ticket.id}>
                                    <div className="bg-[#11131f] hover:bg-[#151724] border border-white/5 rounded-xl p-5 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">

                                        <div className="flex flex-col gap-1.5">
                                            <div className="flex items-center gap-3 mb-1">
                                                <span className={`px-2 py-0.5 rounded text-[11px] font-semibold uppercase ${ticket.status === 'OPEN'
                                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                    : 'bg-white/5 text-gray-400 border border-white/10'
                                                    }`}>
                                                    {ticket.status}
                                                </span>
                                                <span className="text-xs font-mono text-gray-500">#{ticket.id.slice(-8)}</span>
                                            </div>
                                            <h3 className="text-base font-medium text-gray-200">{ticket.subject}</h3>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                                <Clock size={14} />
                                                <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <div className="text-gray-500 hover:text-white transition-colors">
                                                <ArrowRight size={18} />
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Create Ticket Modal Overlay */}
            {showCreate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
                    <div className="relative w-full max-w-xl bg-gray-900 border border-white/10 rounded-xl shadow-2xl p-6 lg:p-8 animate-in fade-in zoom-in-95 duration-200">

                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-semibold text-white">Create New Ticket</h2>
                                <p className="text-sm text-gray-400 mt-1">Open a ticket to get direct support</p>
                            </div>
                            <button
                                onClick={() => setShowCreate(false)}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateTicket} className="relative z-10 space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300">Subject</label>
                                <input
                                    type="text"
                                    value={subject}
                                    onChange={e => setSubject(e.target.value)}
                                    placeholder="Brief summary of your issue"
                                    required
                                    className="w-full bg-gray-950 border border-white/10 hover:border-white/20 focus:border-blue-500 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-gray-600 transition-colors outline-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300">Message</label>
                                <textarea
                                    value={message}
                                    onChange={e => setMessage(e.target.value)}
                                    placeholder="Describe your issue in detail. Include server IDs, error codes, and steps to reproduce..."
                                    required
                                    rows={6}
                                    className="w-full bg-gray-950 border border-white/10 hover:border-white/20 focus:border-blue-500 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-gray-600 transition-colors outline-none resize-none"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowCreate(false)}
                                    className="px-5 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting || !subject || !message}
                                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors border border-blue-500/20"
                                >
                                    {submitting ? (
                                        <Loader2 size={16} className="animate-spin" />
                                    ) : (
                                        <Send size={16} />
                                    )}
                                    Submit
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
