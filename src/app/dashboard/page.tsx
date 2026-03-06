"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Info, HelpCircle, PackagePlus, CreditCard, Activity, Target, Bell } from "lucide-react";
import { AlertBanner } from "@/components/AlertBanner";

export default function DashboardPage() {
    const [servers, setServers] = useState<any[]>([]);
    const [liveStats, setLiveStats] = useState<Record<string, any>>({});
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isAdminView, setIsAdminView] = useState(false);
    const router = useRouter();

    const fetchServers = async (showAll: boolean) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/panel/servers${showAll ? '?all=true' : ''}`);
            if (res.status === 401) throw new Error("Unauthorized");
            const data = await res.json();
            const fetchedServers = data.servers || [];
            setServers(fetchedServers);

            // Fetch stats for each server
            fetchedServers.forEach((s: any) => {
                fetchLiveStats(s.id);
            });
        } catch (err) {
            console.error("Fetch error:", err);
            if (!showAll) router.push("/auth");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Fetch user info first
        fetch("/api/auth/me")
            .then(res => res.json())
            .then(data => setUser(data.user))
            .catch(() => { });

        fetchServers(isAdminView);
    }, [isAdminView, router]);

    const fetchLiveStats = async (serverId: string) => {
        try {
            const res = await fetch(`/api/panel/servers/${serverId}/resources`);
            const data = await res.json();
            if (data.stats) {
                setLiveStats(prev => ({
                    ...prev,
                    [serverId]: data.stats
                }));
            }
        } catch (err) {
            console.error(`Failed to fetch stats for ${serverId}:`, err);
        }
    };

    const formatBytes = (bytes: number) => {
        if (!bytes || bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-6xl mx-auto font-sans">
            <AlertBanner />

            {/* Sub Header / Filters */}
            {user?.role === 'ADMIN' && (
                <div className="flex justify-between items-center mb-6">
                    <button
                        onClick={() => router.push('/admin/alerts')}
                        className="bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600/30 transition-all flex items-center gap-2"
                    >
                        <Bell size={12} />
                        Alert Control
                    </button>
                    <div className="flex items-center gap-2 text-[10px] text-white/40 uppercase tracking-[0.2em] font-bold">
                        <span>{isAdminView ? "Showing All Servers" : "Showing Your Servers"}</span>
                        <div
                            onClick={() => setIsAdminView(!isAdminView)}
                            className={`w-9 h-5 rounded-full relative cursor-pointer transition-colors duration-200 ${isAdminView ? 'bg-blue-600' : 'bg-white/10'}`}
                        >
                            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-200 ${isAdminView ? 'right-1' : 'left-1'}`}></div>
                        </div>
                    </div>
                </div>
            )}

            {/* Welcome Banner */}
            <div className="bg-blue-600/10 border border-blue-500/20 rounded-xl p-5 mb-6 flex items-start gap-4 shadow-lg">
                <div className="mt-0.5 text-blue-400"><Info size={20} /></div>
                <div>
                    <h2 className="text-base font-semibold text-white mb-1">Welcome to CODEON HOSTING!</h2>
                    <p className="text-sm text-blue-200/70">Welcome to CODEON HOSTING! Take a look around, try out the features, and experience what we have to offer.</p>
                </div>
                <button className="ml-auto text-blue-400 hover:text-white transition-colors">
                    &times;
                </button>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div onClick={() => router.push('/dashboard/support')} className="bg-[#121935] border border-white/5 rounded-xl p-5 hover:bg-[#161d3f] transition-colors cursor-pointer group flex items-center gap-4">
                    <div className="bg-blue-600/20 p-2.5 rounded-lg text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <HelpCircle size={20} />
                    </div>
                    <div>
                        <div className="font-semibold text-sm mb-0.5 text-white">Support</div>
                        <div className="text-xs text-white/40">Contact us for support</div>
                    </div>
                </div>
                <div className="bg-[#121935] border border-white/5 rounded-xl p-5 hover:bg-[#161d3f] transition-colors cursor-pointer group flex items-center gap-4">
                    <div className="bg-blue-600/20 p-2.5 rounded-lg text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <PackagePlus size={20} />
                    </div>
                    <div>
                        <div className="font-semibold text-sm mb-0.5 text-white">New Service</div>
                        <div className="text-xs text-white/40">Order a new service</div>
                    </div>
                </div>
                <div className="bg-[#121935] border border-white/5 rounded-xl p-5 hover:bg-[#161d3f] transition-colors cursor-pointer group flex items-center gap-4">
                    <div className="bg-blue-600/20 p-2.5 rounded-lg text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <CreditCard size={20} />
                    </div>
                    <div>
                        <div className="font-semibold text-sm mb-0.5 text-white">Billing</div>
                        <div className="text-xs text-white/40">Access the billing area</div>
                    </div>
                </div>
            </div>

            {/* Management Banner */}
            <div className="bg-[#121935] border border-white/5 rounded-xl p-5 mb-8 flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-white mb-1">Welcome to Server Management Panel!</h2>
                    <p className="text-sm text-white/40">Easily access, edit, and manage your servers, monitor performance, and explore all your services.</p>
                    {user && <div className="mt-2 text-[10px] text-blue-400 font-bold uppercase tracking-wider">Logged in as: {user.email}</div>}
                </div>
                <div className="flex items-center gap-3">
                    <button className="bg-[#5865F2] hover:bg-[#4752C4] text-white p-3 rounded-lg transition-colors shadow-lg shadow-indigo-500/20">
                        <Target size={20} />
                    </button>
                    <button className="bg-blue-400 hover:bg-blue-500 text-white p-3 rounded-lg transition-colors shadow-lg shadow-blue-500/20">
                        <Activity size={20} />
                    </button>
                </div>
            </div>

            {/* Servers Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
                {servers.length === 0 ? (
                    <div className="col-span-full py-12 text-center bg-[#121935] border border-dashed border-white/10 rounded-2xl">
                        <div className="text-white/40 text-sm mb-2">No servers found for this account.</div>
                        <div className="text-blue-400 text-xs font-semibold">Are you sure you added the server to this email? {(user?.email)}</div>
                    </div>
                ) : (
                    servers.map((s, i) => {
                        // Decide colors based on status
                        const stats = liveStats[s.id];
                        const status = stats?.status?.toUpperCase() || "OFFLINE";
                        const isOnline = status === "RUNNING";
                        const isStarting = status === "STARTING";
                        const isSuspended = s.suspended;

                        let badgeColor = "bg-slate-700 text-white";
                        if (isOnline) badgeColor = "bg-emerald-500 text-emerald-950 text-shadow-glow-emerald";
                        else if (isStarting) badgeColor = "bg-amber-500 text-amber-950";
                        else if (isSuspended) badgeColor = "bg-red-500 text-red-950";

                        let btnColor = isSuspended ? "bg-red-500/80 hover:bg-red-500 text-white" : "bg-blue-600/90 hover:bg-blue-500 text-white";
                        let btnText = isSuspended ? "Suspended" : "Manage Server";

                        return (
                            <div key={i} className="group relative rounded-2xl overflow-hidden border border-white/10 shadow-xl bg-[#0a0f25] flex flex-col min-h-[180px]">
                                {/* Background Image / Overlay */}
                                <div
                                    className="absolute inset-0 bg-cover bg-center z-0 transition-transform duration-700 group-hover:scale-110"
                                    style={{
                                        backgroundImage: `url('${s.bgImage || '/minecraft-bg.png'}')`,
                                        filter: isSuspended ? 'grayscale(80%) brightness(30%)' : 'brightness(60%) contrast(1.1)'
                                    }}
                                />
                                <div className={`absolute inset-0 z-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent ${isSuspended ? 'bg-red-950/40' : ''}`} />

                                {/* Content */}
                                <div className="relative z-10 flex flex-col h-full p-5">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-lg font-bold text-white drop-shadow-md">{s.name}</h3>
                                            <p className="text-xs text-white/80 drop-shadow-md">{s.description}</p>
                                        </div>
                                        <div className={`px-2.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase shadow-lg ${badgeColor}`}>
                                            {status}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-auto mb-5 text-xs text-white/90 drop-shadow-md font-medium">
                                        <div>
                                            <span className="text-white/60">IP:</span> {s.allocation ? `${s.allocation.alias || s.allocation.ip}:${s.allocation.port}` : "N/A"}
                                        </div>
                                        <div>
                                            <span className="text-white/60">CPU:</span> {stats ? `${stats.cpu_absolute.toFixed(1)}%` : "--"}
                                        </div>
                                        <div>
                                            <span className="text-white/60">RAM:</span> {stats ? formatBytes(stats.memory_bytes) : "--"}
                                        </div>
                                        <div>
                                            <span className="text-white/60">Storage:</span> {stats ? formatBytes(stats.disk_bytes) : "--"}
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => router.push(`/dashboard/server/${s.id}`)}
                                        className={`w-full py-2.5 rounded-lg text-sm font-semibold tracking-wide transition-all shadow-lg backdrop-blur-sm border border-white/10 ${btnColor}`}
                                    >
                                        {btnText}
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

        </div>
    );
}
