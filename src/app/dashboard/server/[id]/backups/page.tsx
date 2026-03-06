"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Archive, Trash2, Download, Lock, Unlock, MoreVertical, Plus, Info, Clock, CheckCircle2, RotateCcw } from "lucide-react";

export default function BackupsPage() {
    const params = useParams();
    const serverId = params?.id as string;
    const [backups, setBackups] = useState<any[]>([]);
    const [meta, setMeta] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [backupName, setBackupName] = useState("");
    const [activeMenu, setActiveMenu] = useState<string | null>(null);

    useEffect(() => {
        if (serverId) fetchBackups();
    }, [serverId]);

    const fetchBackups = async () => {
        try {
            const res = await fetch(`/api/panel/servers/${serverId}/backups/list`);
            const data = await res.json();
            setBackups(data.backups || []);
            setMeta(data.meta || null);
        } catch (err) {
            console.error("Failed to fetch backups:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!serverId) return;
        setCreating(true);
        try {
            await fetch(`/api/panel/servers/${serverId}/backups/create`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: backupName })
            });
            setIsModalOpen(false);
            setBackupName("");
            fetchBackups();
        } catch (err) {
            alert("Failed to create backup");
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (backupUuid: string) => {
        if (!confirm("Are you sure you want to delete this backup?")) return;
        try {
            await fetch(`/api/panel/servers/${serverId}/backups/${backupUuid}/delete`, {
                method: "DELETE"
            });
            fetchBackups();
        } catch (err) {
            alert("Failed to delete backup");
        } finally {
            setActiveMenu(null);
        }
    };

    const handleDownload = async (backupUuid: string) => {
        try {
            const res = await fetch(`/api/panel/servers/${serverId}/backups/${backupUuid}/download`, {
                method: "POST"
            });
            const data = await res.json();
            if (data.url) {
                window.open(data.url, '_blank');
            }
        } catch (err) {
            alert("Failed to get download URL");
        } finally {
            setActiveMenu(null);
        }
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center bg-[#060813]">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
            </div>
        );
    }

    const availableBackups = meta?.pagination?.total || 0;
    const maxBackups = 3; // Typically from server info, but hardcoding for demo

    return (
        <div className="p-6 md:p-12 flex flex-col h-full bg-[#060813] text-white font-sans max-w-[1400px] mx-auto">
            <h1 className="text-2xl font-bold mb-8">Backups</h1>

            <div className="flex flex-col gap-4 mb-8">
                {backups.length === 0 ? (
                    <div className="bg-[#121935] border border-dashed border-white/10 rounded-2xl p-12 text-center">
                        <Archive size={48} className="mx-auto text-white/10 mb-4" />
                        <p className="text-white/40 font-medium">No backups found for this server.</p>
                    </div>
                ) : (
                    backups.map((b) => (
                        <div key={b.uuid} className="bg-[#121935] border border-white/5 rounded-xl p-5 flex items-center justify-between group hover:bg-[#161d3f] transition-all relative">
                            <div className="flex items-center gap-4 flex-1">
                                <div className={`p-2.5 rounded-full ${b.is_successful ? 'bg-amber-500/20 text-amber-500' : 'bg-red-500/20 text-red-500'}`}>
                                    {b.is_locked ? <Lock size={20} /> : <Archive size={20} />}
                                </div>
                                <div className="min-w-[200px]">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-blue-400">{b.name || 'Automatic Backup'}</span>
                                        <span className="text-[10px] text-white/20 font-bold">{formatBytes(b.bytes)}</span>
                                    </div>
                                    <div className="text-[10px] text-white/30 truncate max-w-[300px] font-mono mt-0.5">sha1:{b.sha1}</div>
                                </div>
                            </div>

                            <div className="flex items-center gap-12 flex-1 justify-center px-8">
                                <div className="flex flex-col items-center">
                                    <div className="text-sm font-bold text-white/90">
                                        {new Date(b.created_at).toLocaleDateString()}
                                    </div>
                                    <div className="text-[10px] text-white/30 uppercase tracking-wider font-bold">Created</div>
                                </div>

                                <div className="flex flex-col items-start min-w-[80px]">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-white/80">
                                        {b.is_successful ? (
                                            <>
                                                <CheckCircle2 size={12} className="text-emerald-500" />
                                                <span>Successful</span>
                                            </>
                                        ) : (
                                            <>
                                                <Info size={12} className="text-red-500" />
                                                <span>Failed</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 pr-2 relative">
                                <button
                                    onClick={() => setActiveMenu(activeMenu === b.uuid ? null : b.uuid)}
                                    className="p-2.5 bg-white/5 text-white/40 hover:bg-white/10 hover:text-white rounded-lg transition-all"
                                >
                                    <MoreVertical size={16} />
                                </button>

                                {activeMenu === b.uuid && (
                                    <div className="absolute right-0 top-12 w-48 bg-[#0a0f25] border border-white/10 rounded-xl shadow-2xl z-50 py-2 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                                        <button onClick={() => handleDownload(b.uuid)} className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-white/60 hover:text-white hover:bg-white/5 transition-colors text-left">
                                            <Download size={14} /> Download
                                        </button>
                                        <button onClick={() => alert("Restore not implemented")} className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-white/60 hover:text-white hover:bg-white/5 transition-colors text-left">
                                            <RotateCcw size={14} /> Restore
                                        </button>
                                        <button onClick={() => alert("Lock not implemented")} className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-white/60 hover:text-white hover:bg-white/5 transition-colors text-left">
                                            {b.is_locked ? <Unlock size={14} /> : <Lock size={14} />} {b.is_locked ? 'Unlock' : 'Lock'}
                                        </button>
                                        <div className="h-px bg-white/5 my-1 mx-2" />
                                        <button onClick={() => handleDelete(b.uuid)} className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-red-500/80 hover:text-red-500 hover:bg-red-500/10 transition-colors text-left">
                                            <Trash2 size={14} /> Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="mt-auto flex flex-col md:flex-row items-center justify-end gap-4 pt-12">
                <p className="text-xs font-bold text-white/30 uppercase tracking-widest">
                    {backups.length} of {maxBackups} backups have been created for this server.
                </p>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-600/20"
                >
                    Create backup
                </button>
            </div>

            {/* Create Backup Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-[#0a0f25] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#0d1430]">
                            <h2 className="text-xl font-bold">Create New Backup</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-white/40 hover:text-white transition-colors p-2">&times;</button>
                        </div>

                        <form onSubmit={handleCreate} className="p-6 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Backup Name (Optional)</label>
                                <input
                                    value={backupName}
                                    onChange={(e) => setBackupName(e.target.value)}
                                    placeholder="Manually Created Backup"
                                    className="w-full bg-[#121935] border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-all font-medium"
                                />
                            </div>

                            <p className="text-[11px] text-white/20 italic pl-1 leading-relaxed">
                                Backups can take a few minutes to complete depending on the size of your server files.
                            </p>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-bold transition-all border border-white/5"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="flex-[2] px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {creating && <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
                                    Create Backup
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
