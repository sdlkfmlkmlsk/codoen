"use client";

import { useState, useEffect } from "react";
import { Users, Search, Bell, AlertCircle, Shield, Key, User } from "lucide-react";
import { format } from "date-fns";

type Server = {
    id: string;
    pteroServerIdentifier: string;
};

type UserData = {
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
    discordId: string | null;
    pteroUserId: number | null;
    servers: Server[];
};

export default function AdminUsersPage() {
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [sendingNotice, setSendingNotice] = useState<string | null>(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await fetch("/api/admin/users");
            if (res.ok) {
                const data = await res.json();
                setUsers(data.users || []);
            }
        } catch (error) {
            console.error("Failed to fetch users:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSendExpiryNotice = async (userId: string, serverIdentifier: string) => {
        if (!confirm("Are you sure you want to send an expiry notice to this user via Discord DM?")) return;

        setSendingNotice(userId);
        try {
            const res = await fetch("/api/admin/notify-expiry", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId,
                    serverName: "Your Server", // In a more complex app, we'd fetch the actual server name from Ptero
                    serverId: serverIdentifier || "Unknown"
                })
            });

            if (res.ok) {
                alert("Discord Expiry Notice sent successfully!");
            } else {
                const data = await res.json();
                alert(`Failed to send: ${data.error}`);
            }
        } catch (error) {
            alert("An error occurred while sending the notice.");
        } finally {
            setSendingNotice(null);
        }
    };

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.discordId && u.discordId.includes(searchTerm))
    );

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                        <Users className="text-blue-400" size={32} />
                        User Management
                    </h1>
                    <p className="text-white/50">Manage registered users and send Discord notifications.</p>
                </div>

                <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={16} />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-[#0A0F25] border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-blue-500/50 transition-all"
                    />
                </div>
            </div>

            <div className="bg-[#0A0F25] border border-white/5 rounded-xl overflow-hidden shadow-2xl">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-black/20 border-b border-white/5 text-xs font-semibold text-white/50 uppercase tracking-widest">
                            <th className="p-4 pl-6">User</th>
                            <th className="p-4">Role</th>
                            <th className="p-4">Joined</th>
                            <th className="p-4">Discord ID</th>
                            <th className="p-4 pr-6 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-white/5">
                        {loading ? (
                            <tr><td colSpan={5} className="p-8 text-center text-white/50">Loading users...</td></tr>
                        ) : filteredUsers.length === 0 ? (
                            <tr><td colSpan={5} className="p-8 text-center text-white/50">No users found.</td></tr>
                        ) : (
                            filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="p-4 pl-6">
                                        <div className="font-semibold text-white">{user.name}</div>
                                        <div className="text-xs text-white/40">{user.email}</div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase ${user.role === 'ADMIN' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-white/5 text-white/50 border border-white/10'}`}>
                                            {user.role === "ADMIN" ? <Shield size={12} /> : <User size={12} />}
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="p-4 text-white/70">
                                        {format(new Date(user.createdAt), 'MMM d, yyyy')}
                                    </td>
                                    <td className="p-4">
                                        {user.discordId ? (
                                            <span className="font-mono text-xs text-blue-400 bg-blue-400/10 px-2 py-1 rounded">
                                                {user.discordId}
                                            </span>
                                        ) : (
                                            <span className="text-xs text-white/30 italic">Not linked</span>
                                        )}
                                    </td>
                                    <td className="p-4 pr-6 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {user.discordId && user.servers.length > 0 ? (
                                                <button
                                                    onClick={() => handleSendExpiryNotice(user.id, user.servers[0].pteroServerIdentifier || "")}
                                                    disabled={sendingNotice === user.id}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors text-xs font-semibold disabled:opacity-50"
                                                >
                                                    <Bell size={14} />
                                                    {sendingNotice === user.id ? "Sending..." : "Send Expiry Notice"}
                                                </button>
                                            ) : user.discordId ? (
                                                <span className="text-xs text-yellow-400 flex items-center gap-1 opacity-70">
                                                    <AlertCircle size={14} /> No Servers
                                                </span>
                                            ) : (
                                                <span className="text-xs text-white/30 flex items-center gap-1">
                                                    No Discord
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
