"use client";

import { useState, useEffect } from "react";
import { AlertCircle, Bell, Send, User, MessageSquare, AlertTriangle, Info, CheckCircle } from "lucide-react";

export default function AdminAlertsPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [selectedUserId, setSelectedUserId] = useState("");
    const [message, setMessage] = useState("");
    const [type, setType] = useState("INFO");
    const [loading, setLoading] = useState(false);
    const [fetchingUsers, setFetchingUsers] = useState(true);
    const [status, setStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [userError, setUserError] = useState<string | null>(null);
    const [history, setHistory] = useState<any[]>([]);

    useEffect(() => {
        const fetchUsers = async () => {
            setFetchingUsers(true);
            try {
                const res = await fetch("/api/admin/users");
                const data = await res.json();
                if (data.users) {
                    setUsers(data.users);
                } else if (data.error) {
                    setUserError(data.error);
                }
            } catch (e) {
                setUserError("Network error fetching users");
            } finally {
                setFetchingUsers(false);
            }
        };

        const fetchHistory = async () => {
            try {
                const res = await fetch("/api/admin/alerts");
                const data = await res.json();
                if (data.alerts) setHistory(data.alerts);
            } catch (e) { }
        };

        fetchUsers();
        fetchHistory();
    }, []);

    const sendAlert = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUserId || !message) return;

        setLoading(true);
        setStatus(null);

        try {
            const res = await fetch("/api/admin/alerts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: selectedUserId, message, type })
            });

            if (res.ok) {
                setStatus({ message: "Alert sent successfully!", type: "success" });
                setMessage("");
                // Refresh history
                const hRes = await fetch("/api/admin/alerts");
                const hData = await hRes.json();
                if (hData.alerts) setHistory(hData.alerts);
            } else {
                const data = await res.json();
                setStatus({ message: data.error || "Failed to send alert", type: "error" });
            }
        } catch (e) {
            setStatus({ message: "Network error", type: "error" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-5xl mx-auto font-sans text-white">
            <header className="mb-10 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black italic tracking-tighter uppercase flex items-center gap-3">
                        <Bell className="text-emerald-400" size={32} />
                        Alert <span className="text-emerald-400">Control</span>
                    </h1>
                    <p className="text-white/40 text-sm font-bold uppercase tracking-widest mt-1">Send warnings and direct messages to users</p>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Send Alert Form */}
                <div className="bg-[#0a0f25] border border-white/5 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Send size={80} />
                    </div>

                    <h2 className="text-sm font-black uppercase tracking-[0.3em] text-white/20 mb-6 flex items-center gap-2">
                        <MessageSquare size={16} /> New Broadcast
                    </h2>

                    <form onSubmit={sendAlert} className="space-y-6">
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 px-1">Target User</label>
                            <select
                                value={selectedUserId}
                                onChange={(e) => setSelectedUserId(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-emerald-500/50 outline-none transition-all appearance-none cursor-pointer"
                            >
                                <option value="">{fetchingUsers ? "Loading users..." : "Select a user..."}</option>
                                {users.map(u => (
                                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                                ))}
                            </select>
                            {userError && <p className="text-red-500 text-[10px] mt-1 italic">{userError}</p>}
                            {!fetchingUsers && users.length === 0 && !userError && <p className="text-white/20 text-[10px] mt-1 italic">No users found in database</p>}
                        </div>

                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 px-1">Alert Category</label>
                            <div className="flex gap-2">
                                {['INFO', 'WARNING', 'CRITICAL'].map(t => (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => setType(t)}
                                        className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border ${type === t
                                            ? t === 'CRITICAL' ? 'bg-red-500/20 border-red-500/50 text-red-400' : t === 'WARNING' ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' : 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                                            : 'bg-white/5 border-white/5 text-white/20 hover:bg-white/10'}`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 px-1">Dispatch Message</label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="TYPE MESSAGE HERE..."
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-emerald-500/50 outline-none transition-all h-32 resize-none placeholder:text-white/10 uppercase font-bold"
                            />
                        </div>

                        {status && (
                            <div className={`p-4 rounded-xl text-xs font-bold flex items-center gap-3 animate-in fade-in zoom-in-95 duration-300 ${status.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                {status.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                                {status.message}
                            </div>
                        )}

                        <button
                            disabled={loading || !selectedUserId || !message}
                            className={`w-full py-4 rounded-xl text-xs font-black uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 shadow-xl ${loading || !selectedUserId || !message ? 'bg-white/5 text-white/20 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20 active:scale-[0.98]'}`}
                        >
                            <Send size={18} />
                            {loading ? 'Dispatching...' : 'Dispatch Alert'}
                        </button>
                    </form>
                </div>

                {/* Dispatch History */}
                <div className="flex flex-col gap-6">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20 px-4">Dispatch History</h2>
                    <div className="flex flex-col gap-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                        {history.length === 0 ? (
                            <div className="py-20 text-center bg-white/[0.02] border border-dashed border-white/10 rounded-3xl">
                                <p className="text-white/20 text-xs font-black uppercase">No active dispatches found</p>
                            </div>
                        ) : (
                            history.map((alert) => (
                                <div key={alert.id} className="bg-[#0a0f25] border border-white/5 rounded-2xl p-4 flex items-start gap-4 hover:border-white/10 transition-colors">
                                    <div className={`mt-1 h-2 w-2 rounded-full ${alert.type === 'CRITICAL' ? 'bg-red-500' : alert.type === 'WARNING' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{alert.user?.name || "Unknown"}</span>
                                            <span className="text-[9px] font-mono text-white/20">{new Date(alert.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-xs text-white/60 mb-2">{alert.message}</p>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded shadow-sm ${alert.isRead ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-white/5 text-white/30 border border-white/5'}`}>
                                                {alert.isRead ? 'SEEN' : 'UNSEEN'}
                                            </span>
                                            <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-white/5 text-white/30 border border-white/5 uppercase">
                                                {alert.type}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
