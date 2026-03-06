"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Users, Shield, ShieldCheck, ShieldAlert, Trash2, Edit2, Plus, Mail, Lock, UserPlus } from "lucide-react";

export default function UsersPage() {
    const params = useParams();
    const serverId = params?.id as string;
    const [subusers, setSubusers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [creating, setCreating] = useState(false);

    // Form state
    const [email, setEmail] = useState("");
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

    const PERMISSION_GROUPS = {
        "Control": [
            { id: "control.console", label: "Console" },
            { id: "control.start", label: "Start" },
            { id: "control.stop", label: "Stop" },
            { id: "control.restart", label: "Restart" },
        ],
        "Files": [
            { id: "file.create", label: "Create" },
            { id: "file.read", label: "Read" },
            { id: "file.update", label: "Update" },
            { id: "file.delete", label: "Delete" },
            { id: "file.archive", label: "Archive" },
            { id: "file.sftp", label: "SFTP" },
        ],
        "Databases": [
            { id: "database.create", label: "Create" },
            { id: "database.read", label: "Read" },
            { id: "database.update", label: "Update" },
            { id: "database.delete", label: "Delete" },
        ],
        "Schedules": [
            { id: "schedule.create", label: "Create" },
            { id: "schedule.read", label: "Read" },
            { id: "schedule.update", label: "Update" },
            { id: "schedule.delete", label: "Delete" },
        ]
    };

    useEffect(() => {
        if (serverId) fetchSubusers();
    }, [serverId]);

    const fetchSubusers = async () => {
        try {
            const res = await fetch(`/api/panel/servers/${serverId}/users/list`);
            const data = await res.json();
            setSubusers(data.users || []);
        } catch (err) {
            console.error("Failed to fetch subusers:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (userUuid: string) => {
        if (!confirm("Are you sure you want to delete this subuser?")) return;
        try {
            await fetch(`/api/panel/servers/${serverId}/users/${userUuid}/delete`, {
                method: "DELETE"
            });
            fetchSubusers();
        } catch (err) {
            alert("Failed to delete subuser");
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!serverId || !email) return;

        setCreating(true);
        try {
            const res = await fetch(`/api/panel/servers/${serverId}/users/create`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, permissions: selectedPermissions })
            });

            if (res.ok) {
                setIsModalOpen(false);
                setEmail("");
                setSelectedPermissions([]);
                fetchSubusers();
            } else {
                const error = await res.json();
                alert(error.details || "Failed to create subuser");
            }
        } catch (err) {
            console.error(err);
            alert("An error occurred while creating the subuser");
        } finally {
            setCreating(false);
        }
    };

    const togglePermission = (id: string) => {
        setSelectedPermissions(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };

    const selectAll = () => {
        const all = Object.values(PERMISSION_GROUPS).flatMap(g => g.map(p => p.id));
        setSelectedPermissions(all);
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
            <h1 className="text-2xl font-bold mb-8">Users</h1>

            <div className="flex flex-col gap-4 mb-8">
                {subusers.length === 0 ? (
                    <div className="bg-[#121935] border border-dashed border-white/10 rounded-2xl p-12 text-center">
                        <Users size={48} className="mx-auto text-white/10 mb-4" />
                        <p className="text-white/40">No subusers found for this server.</p>
                    </div>
                ) : (
                    subusers.map((u) => (
                        <div key={u.uuid} className="bg-[#121935] border border-white/5 rounded-xl p-5 flex items-center justify-between group hover:bg-[#161d3f] transition-all">
                            <div className="flex items-center gap-4 flex-1">
                                <div className="bg-blue-600/20 p-2.5 rounded-full text-blue-400">
                                    <Users size={20} />
                                </div>
                                <div className="min-w-[200px]">
                                    <div className="text-sm font-bold text-white mb-0.5">{u.email}</div>
                                    <div className="text-[10px] text-white/30 uppercase tracking-wider font-bold">Email Address</div>
                                </div>
                            </div>

                            <div className="flex items-center gap-16 flex-[2] px-8">
                                <div className="flex flex-col items-center">
                                    <div className="mb-1">
                                        {u['2fa_enabled'] ? (
                                            <div className="text-emerald-400 bg-emerald-400/10 p-1 rounded">
                                                <ShieldCheck size={16} />
                                            </div>
                                        ) : (
                                            <div className="text-red-400 bg-red-400/10 p-1 rounded">
                                                <Lock size={16} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-[10px] text-white/30 uppercase tracking-wider font-bold whitespace-nowrap">
                                        2FA {u['2fa_enabled'] ? 'Enabled' : 'Disabled'}
                                    </div>
                                </div>

                                <div className="flex flex-col items-center">
                                    <div className="text-sm font-bold text-white/90">{u.permissions.length}</div>
                                    <div className="text-[10px] text-white/30 uppercase tracking-wider font-bold">Permissions</div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 pr-2">
                                <button
                                    onClick={() => alert("Edit subuser functionality not implemented in this demo")}
                                    className="p-2.5 bg-white/5 text-white/40 hover:bg-white/10 hover:text-white rounded-lg transition-all"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button
                                    onClick={() => handleDelete(u.uuid)}
                                    className="p-2.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="mt-auto flex justify-end pt-8">
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-600/20"
                >
                    <UserPlus size={18} />
                    New User
                </button>
            </div>

            {/* New User Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-[#0a0f25] border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#0d1430]">
                            <div>
                                <h2 className="text-xl font-bold">Add New Subuser</h2>
                                <p className="text-xs text-white/30 mt-1 font-medium">Define access permissions for this user.</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-white/40 hover:text-white transition-colors p-2">&times;</button>
                        </div>

                        <form onSubmit={handleCreate} className="flex flex-col flex-1 overflow-hidden">
                            <div className="p-6 space-y-8 overflow-y-auto flex-1">
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">User Email Address</label>
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-blue-500 transition-colors" size={18} />
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="user@example.com"
                                            className="w-full bg-[#121935] border border-white/5 rounded-xl pl-12 pr-4 py-3.5 text-sm focus:outline-none focus:border-blue-500 transition-all font-medium"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center px-1">
                                        <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Permissions</label>
                                        <button
                                            type="button"
                                            onClick={selectAll}
                                            className="text-[10px] font-black text-blue-500 hover:text-blue-400 uppercase tracking-widest transition-colors"
                                        >
                                            Select All
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {Object.entries(PERMISSION_GROUPS).map(([group, perms]) => (
                                            <div key={group} className="bg-[#121935]/50 border border-white/5 rounded-xl p-4">
                                                <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[2px] mb-4 border-b border-white/5 pb-2">{group}</h3>
                                                <div className="grid grid-cols-2 gap-y-3">
                                                    {perms.map((p) => (
                                                        <label key={p.id} className="flex items-center gap-3 cursor-pointer group hover:opacity-100 opacity-60 transition-opacity">
                                                            <div className="relative flex items-center">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedPermissions.includes(p.id)}
                                                                    onChange={() => togglePermission(p.id)}
                                                                    className="sr-only"
                                                                />
                                                                <div className={`w-4 h-4 rounded border ${selectedPermissions.includes(p.id) ? 'bg-blue-600 border-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.4)]' : 'bg-[#121935] border-white/10 group-hover:border-white/20'} transition-all`}>
                                                                    {selectedPermissions.includes(p.id) && (
                                                                        <svg viewBox="0 0 24 24" className="w-3 h-3 text-white absolute top-0.5 left-0.5" fill="none" stroke="currentColor" strokeWidth="4">
                                                                            <path d="M5 13l4 4L19 7" />
                                                                        </svg>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <span className="text-[13px] font-medium group-hover:text-white transition-colors">{p.label}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t border-white/5 bg-[#0d1430] flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-4 py-3.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-bold transition-all border border-white/5"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating || !email || selectedPermissions.length === 0}
                                    className="flex-[2] px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-2"
                                >
                                    {creating && <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
                                    Create Subuser
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
