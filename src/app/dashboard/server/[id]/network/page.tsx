"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Globe, Trash2, CheckCircle2, MoreVertical, Plus, Info, Network, Hash, FileText } from "lucide-react";

export default function NetworkPage() {
    const params = useParams();
    const serverId = params?.id as string;
    const [allocations, setAllocations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [editingNotes, setEditingNotes] = useState<number | null>(null);
    const [tempNotes, setTempNotes] = useState("");

    useEffect(() => {
        if (serverId) fetchAllocations();
    }, [serverId]);

    const fetchAllocations = async () => {
        try {
            const res = await fetch(`/api/panel/servers/${serverId}/network/list`);
            const data = await res.json();
            setAllocations(data.allocations || []);
        } catch (err) {
            console.error("Failed to fetch allocations:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSetPrimary = async (allocationId: number) => {
        try {
            await fetch(`/api/panel/servers/${serverId}/network/allocations/${allocationId}/primary`, {
                method: "POST"
            });
            fetchAllocations();
        } catch (err) {
            alert("Failed to set primary allocation");
        }
    };

    const handleDelete = async (allocationId: number) => {
        if (!confirm("Are you sure you want to delete this allocation?")) return;
        try {
            const res = await fetch(`/api/panel/servers/${serverId}/network/allocations/${allocationId}/delete`, {
                method: "DELETE"
            });
            if (res.ok) fetchAllocations();
            else {
                const error = await res.json();
                alert(error.details || "Failed to delete allocation");
            }
        } catch (err) {
            alert("Failed to delete allocation");
        }
    };

    const handleUpdateNotes = async (allocationId: number) => {
        try {
            await fetch(`/api/panel/servers/${serverId}/network/allocations/${allocationId}/notes`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ notes: tempNotes })
            });
            setEditingNotes(null);
            fetchAllocations();
        } catch (err) {
            alert("Failed to update notes");
        }
    };

    const handleCreate = async () => {
        setCreating(true);
        try {
            const res = await fetch(`/api/panel/servers/${serverId}/network/allocations/create`, {
                method: "POST"
            });
            if (res.ok) fetchAllocations();
            else {
                const error = await res.json();
                alert(error.details || "Failed to create allocation");
            }
        } catch (err) {
            alert("Failed to create allocation");
        } finally {
            setCreating(false);
        }
    };

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center bg-[#060813]">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
            </div>
        );
    }

    const maxAllocations = 5; // Typically from server info

    return (
        <div className="p-6 md:p-12 flex flex-col h-full bg-[#060813] text-white font-sans max-w-[1400px] mx-auto">
            <h1 className="text-2xl font-bold mb-8">Network</h1>

            <div className="flex flex-col gap-4 mb-8">
                {allocations.map((a) => (
                    <div key={a.id} className="bg-[#121935] border border-white/5 rounded-xl p-5 flex flex-col md:flex-row items-center gap-6 group hover:bg-[#161d3f] transition-all relative">
                        <div className="flex items-center gap-8 flex-1 w-full md:w-auto">
                            <div className="flex items-center gap-4 min-w-[180px]">
                                <div className="bg-blue-600/10 p-2.5 rounded-full text-blue-400">
                                    <Network size={20} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-white tracking-tight">{a.ip}</span>
                                    <span className="text-[10px] text-white/30 uppercase tracking-widest font-bold">IP Address</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 min-w-[100px]">
                                <div className="bg-blue-600/10 p-2.5 rounded-full text-blue-400">
                                    <Hash size={20} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-white tracking-tight">{a.port}</span>
                                    <span className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Port</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 w-full md:w-auto">
                            <div className="relative group/notes">
                                {editingNotes === a.id ? (
                                    <input
                                        autoFocus
                                        value={tempNotes}
                                        onChange={(e) => setTempNotes(e.target.value)}
                                        onBlur={() => handleUpdateNotes(a.id)}
                                        onKeyDown={(e) => e.key === "Enter" && handleUpdateNotes(a.id)}
                                        className="w-full bg-[#0a0f25] border border-blue-500/50 rounded-lg px-3 py-2 text-xs font-medium focus:outline-none"
                                    />
                                ) : (
                                    <div
                                        onClick={() => { setEditingNotes(a.id); setTempNotes(a.notes || ""); }}
                                        className="w-full bg-[#0a0f25] border border-white/5 rounded-lg px-4 py-2.5 text-xs text-white/40 font-medium cursor-pointer hover:border-white/10 transition-all flex items-center justify-between"
                                    >
                                        <span className="truncate">{a.notes || "Notes"}</span>
                                        <FileText size={14} className="opacity-0 group-hover/notes:opacity-100 transition-opacity" />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                            {a.is_default ? (
                                <div className="bg-blue-600/20 text-blue-400 px-4 py-2 rounded-lg text-xs font-bold border border-blue-600/20 flex items-center gap-2">
                                    <CheckCircle2 size={14} />
                                    Primary
                                </div>
                            ) : (
                                <>
                                    <button
                                        onClick={() => handleDelete(a.id)}
                                        className="p-2.5 bg-red-500/10 text-red-500/60 hover:text-red-500 hover:bg-red-500/20 rounded-lg transition-all"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleSetPrimary(a.id)}
                                        className="px-4 py-2 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white rounded-lg text-xs font-bold transition-all border border-white/5"
                                    >
                                        Make Primary
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-auto flex flex-col md:flex-row items-center justify-end gap-6 pt-12">
                <p className="text-xs font-bold text-white/30 uppercase tracking-widest">
                    You are currently using {allocations.length} of {maxAllocations} allowed allocations for this server.
                </p>
                <button
                    onClick={handleCreate}
                    disabled={creating || allocations.length >= maxAllocations}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
                >
                    {creating && <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
                    Create Allocation
                </button>
            </div>
        </div>
    );
}
