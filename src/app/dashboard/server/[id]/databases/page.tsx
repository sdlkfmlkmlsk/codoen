"use client";

import { useEffect, useState, use } from "react";
import { useParams, useRouter } from "next/navigation";
import { Database, Eye, EyeOff, Trash2, Plus, Info, Globe, User, Server } from "lucide-react";

export default function DatabasesPage() {
    const params = useParams();
    const serverId = params?.id as string;
    const [databases, setDatabases] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});
    const [creating, setCreating] = useState(false);
    const [newDbName, setNewDbName] = useState("");
    const [newDbRemote, setNewDbRemote] = useState("%");

    useEffect(() => {
        if (serverId) fetchDatabases();
    }, [serverId]);

    const fetchDatabases = async () => {
        try {
            const res = await fetch(`/api/panel/servers/${serverId}/databases/list`);
            const data = await res.json();
            setDatabases(data.databases || []);
        } catch (err) {
            console.error("Failed to fetch databases:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!newDbName || !serverId) return;
        setCreating(true);
        try {
            const res = await fetch(`/api/panel/servers/${serverId}/databases/create`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ database: newDbName, remote: newDbRemote })
            });
            if (res.ok) {
                setNewDbName("");
                setNewDbRemote("%");
                fetchDatabases();
            }
        } catch (err) {
            alert("Failed to create database");
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (dbId: string) => {
        if (!confirm("Are you sure you want to delete this database?")) return;
        try {
            await fetch(`/api/panel/servers/${serverId}/databases/${dbId}/delete`, {
                method: "DELETE"
            });
            fetchDatabases();
        } catch (err) {
            alert("Failed to delete database");
        }
    };

    const togglePassword = (dbId: string) => {
        setShowPassword(prev => ({ ...prev, [dbId]: !prev[dbId] }));
    };

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center bg-[#060813]">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="p-6 md:p-12 flex flex-col h-full bg-[#060813] text-white font-sans max-w-[1400px] mx-auto">
            <h1 className="text-2xl font-bold mb-8">Databases</h1>

            <div className="flex flex-col gap-4 mb-8">
                {databases.length === 0 ? (
                    <div className="bg-[#121935] border border-dashed border-white/10 rounded-2xl p-12 text-center">
                        <Database size={48} className="mx-auto text-white/10 mb-4" />
                        <p className="text-white/40">No databases found for this server.</p>
                    </div>
                ) : (
                    databases.map((db) => (
                        <div key={db.id} className="bg-[#121935] border border-white/5 rounded-xl p-4 flex items-center justify-between group hover:bg-[#161d3f] transition-all">
                            <div className="flex items-center gap-4 flex-1">
                                <div className="bg-blue-600/20 p-2.5 rounded-lg text-blue-400">
                                    <Database size={20} />
                                </div>
                                <div className="min-w-[150px]">
                                    <div className="text-sm font-bold text-white mb-0.5">{db.name}</div>
                                    <div className="text-[10px] text-white/30 uppercase tracking-wider font-bold">Name</div>
                                </div>
                            </div>

                            <div className="flex items-center gap-12 flex-[3] px-8">
                                <div className="min-w-[180px]">
                                    <div className="text-sm font-medium text-white/90 truncate">{db.host.address}:{db.host.port}</div>
                                    <div className="text-[10px] text-white/30 uppercase tracking-wider font-bold">Endpoint</div>
                                </div>
                                <div className="min-w-[100px] text-center">
                                    <div className="text-sm font-medium text-white/90">{db.connections_from}</div>
                                    <div className="text-[10px] text-white/30 uppercase tracking-wider font-bold">Connections From</div>
                                </div>
                                <div className="min-w-[150px]">
                                    <div className="text-sm font-medium text-white/90">{db.username}</div>
                                    <div className="text-[10px] text-white/30 uppercase tracking-wider font-bold">Username</div>
                                </div>
                                {showPassword[db.id] && (
                                    <div className="min-w-[150px] animate-in fade-in slide-in-from-left-1">
                                        <div className="text-sm font-mono text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded">{db.password || "••••••••"}</div>
                                        <div className="text-[10px] text-white/30 uppercase tracking-wider font-bold">Password</div>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-2 pr-2">
                                <button
                                    onClick={() => togglePassword(db.id)}
                                    className={`p-2 rounded-lg transition-colors ${showPassword[db.id] ? 'bg-blue-600 text-white' : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white'}`}
                                >
                                    {showPassword[db.id] ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                                <button
                                    onClick={() => handleDelete(db.id)}
                                    className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="mt-auto flex items-center justify-between border-t border-white/5 pt-8">
                <div className="text-sm text-white/30 font-medium">
                    {databases.length} of 5 databases have been allocated to this server.
                </div>

                <div className="flex items-center gap-3">
                    <input
                        type="text"
                        placeholder="Database Name"
                        value={newDbName}
                        onChange={(e) => setNewDbName(e.target.value)}
                        className="bg-[#121935] border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors w-48"
                    />
                    <button
                        onClick={handleCreate}
                        disabled={creating || !newDbName}
                        className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-600/20"
                    >
                        {creating ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Plus size={18} />}
                        New Database
                    </button>
                </div>
            </div>
        </div>
    );
}
