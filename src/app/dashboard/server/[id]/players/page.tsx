"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
    Users,
    Shield,
    ShieldAlert,
    Ban,
    Search,
    Gamepad,
    Copy,
    Check,
    Info,
    ChevronRight,
    Loader2,
    RefreshCw,
    RotateCw
} from "lucide-react";

type Player = {
    username: string;
    uuid: string;
    status: 'online' | 'offline';
    lastSeen?: string;
    role?: 'operator' | 'player';
    isWhitelisted: boolean;
    isBanned: boolean;
};

export default function PlayersPage() {
    const params = useParams();
    const serverId = params?.id as string;

    const [activeTab, setActiveTab] = useState<'online' | 'all' | 'banned' | 'whitelist' | 'operators' | 'banned_ips'>('all');
    const [searchTerm, setSearchTerm] = useState("");
    const [players, setPlayers] = useState<Player[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
    const [copied, setCopied] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const serverInfo = {
        name: "A Minecraft Server",
        status: "offline",
        ip: "15.235.162.136:25586",
        version: "Paper 1.21.1",
        playerCount: "0 / 20"
    };

    const [serverStats, setServerStats] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [pRes, sRes] = await Promise.all([
                    fetch(`/api/panel/servers/${serverId}/players`),
                    fetch(`/api/panel/servers/${serverId}/resources`)
                ]);

                const pData = await pRes.json();
                if (pRes.ok && pData.players) setPlayers(pData.players);

                const sData = await sRes.json();
                if (sRes.ok && sData.stats) setServerStats(sData.stats);
            } catch (err) {
                console.error("Fetch error:", err);
            } finally {
                setLoading(false);
            }
        };

        if (serverId) fetchData();
    }, [serverId]);

    const copyIp = () => {
        navigator.clipboard.writeText(serverInfo.ip);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handlePlayerAction = async (player: Player, action: string) => {
        try {
            const res = await fetch(`/api/panel/servers/${serverId}/players/action`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action, username: player.username })
            });
            const data = await res.json();
            if (res.ok) {
                showToast(data.message || "Command sent successfully!", "success");
            } else {
                showToast(data.error || "Action failed", "error");
            }
        } catch (err) {
            showToast("Network error occurred.", "error");
        }
    };

    const filteredPlayers = players.filter(p => {
        const matchesSearch = p.username.toLowerCase().includes(searchTerm.toLowerCase());
        if (activeTab === 'online') return matchesSearch && p.status === 'online';
        if (activeTab === 'banned') return matchesSearch && p.isBanned;
        if (activeTab === 'whitelist') return matchesSearch && p.isWhitelisted;
        if (activeTab === 'operators') return matchesSearch && p.role === 'operator';
        return matchesSearch;
    });

    const categories = [
        { id: 'online', label: 'Online', icon: <Users size={16} />, count: players.filter(p => p.status === 'online').length },
        { id: 'all', label: 'All Entities', icon: <Users size={16} />, count: players.length },
        { id: 'banned', label: 'Banned', icon: <Ban size={16} />, count: players.filter(p => p.isBanned).length },
        { id: 'whitelist', label: 'Whitelist', icon: <Shield size={16} />, count: players.filter(p => p.isWhitelisted).length },
        { id: 'operators', label: 'Commanders', icon: <ShieldAlert size={16} />, count: players.filter(p => p.role === 'operator').length },
    ];

    return (
        <div className="relative h-screen w-full overflow-hidden bg-[#060813]">
            {/* Cinematic Background Layer */}
            <div
                className="absolute inset-0 z-0 opacity-40 mix-blend-overlay pointer-events-none"
                style={{
                    backgroundImage: 'url("/minecraft-bg.png")',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    filter: 'blur(80px) saturate(1.5)'
                }}
            />
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-transparent to-purple-600/20 pointer-events-none z-0" />

            <div className="relative z-10 px-6 py-6 md:px-12 md:py-8 flex flex-col h-full text-white font-sans max-w-[1600px] mx-auto overflow-hidden">
                {/* Tactical Header HUD */}
                <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-2xl p-4 flex items-center justify-between mb-6 group hover:border-blue-500/30 transition-all shadow-2xl relative overflow-hidden shrink-0">
                    <div className="flex items-center gap-5 relative z-10">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-400 p-0.5 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                            <div className="h-full w-full bg-[#060813] rounded-[9px] flex items-center justify-center text-blue-400">
                                <Gamepad size={20} />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-lg font-black tracking-tighter uppercase italic flex items-center gap-2">
                                <span className="text-blue-500">CODEON</span>
                                <span className="text-white/20 font-light">|</span>
                                <span>PLAYER HUD</span>
                            </h1>
                        </div>
                    </div>
                    <div className="hidden md:flex items-center gap-4 relative z-10">
                        <div className="text-right">
                            <div className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-0.5">DATALINK</div>
                            <div className="text-xs font-black text-emerald-400 flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                ESTABLISHED
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-6 flex-1 overflow-hidden min-h-0">
                    {/* Left Intelligence Column */}
                    <div className="w-full lg:w-[350px] flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar min-h-0 shrink-0">
                        <div className="bg-black/40 backdrop-blur-3xl border border-white/5 rounded-3xl p-6 shadow-2xl">
                            <div className="text-[9px] font-black uppercase tracking-[0.4em] text-blue-400/50 mb-4">SERVER OVERVIEW</div>
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <div className="bg-white/5 border border-white/5 p-3 rounded-xl">
                                    <div className="text-[8px] font-black text-white/20 uppercase mb-0.5">POP.</div>
                                    <div className="text-sm font-black text-white">{players.filter(p => p.status === 'online').length} / 20</div>
                                </div>
                                <div className="bg-white/5 border border-white/5 p-3 rounded-xl">
                                    <div className="text-[8px] font-black text-white/20 uppercase mb-0.5">RAM</div>
                                    <div className="text-sm font-black text-white">{serverStats?.memory_bytes ? (serverStats.memory_bytes / 1024 / 1024 / 1024).toFixed(1) : "0.0"}G</div>
                                </div>
                            </div>
                            <div className="bg-black/60 border border-white/5 p-3 rounded-xl flex items-center justify-between">
                                <span className="text-[10px] font-mono text-blue-400/70 truncate mr-2">{serverInfo.ip}</span>
                                <button onClick={copyIp} className="text-white/20 hover:text-white transition-all shrink-0">
                                    {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={12} />}
                                </button>
                            </div>
                        </div>

                        <div className="bg-black/40 backdrop-blur-3xl border border-white/5 rounded-3xl p-5 shadow-2xl flex flex-col gap-4">
                            <div className="relative group/search">
                                <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                                <input
                                    type="text"
                                    placeholder="SCANNING..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-black/60 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-[10px] font-black tracking-widest outline-none transition-all placeholder:text-white/10 uppercase"
                                />
                            </div>
                            <div className="grid grid-cols-1 gap-1.5">
                                {categories.map((cat) => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setActiveTab(cat.id as any)}
                                        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-[10px] font-black transition-all border ${activeTab === cat.id
                                            ? 'bg-blue-600 border-blue-400 text-white shadow-lg'
                                            : 'bg-white/5 border-white/10 text-white/30 hover:bg-white/10 hover:text-white'
                                            }`}
                                    >
                                        <span className="opacity-70">{cat.icon}</span>
                                        <span className="flex-1 text-left uppercase tracking-widest">{cat.label}</span>
                                        <span className={`px-2 py-0.5 rounded-lg text-[9px] ${activeTab === cat.id ? 'bg-white/20' : 'bg-black/60 text-white/20'}`}>
                                            {cat.count}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Main Interaction Deck */}
                    <div className="flex-1 flex flex-col min-h-0">
                        <div className="flex-1 bg-black/40 backdrop-blur-3xl border border-white/5 rounded-[40px] relative overflow-hidden flex flex-col shadow-2xl shadow-blue-500/5">
                            {loading ? (
                                <div className="flex-1 flex flex-col items-center justify-center gap-4">
                                    <Loader2 size={48} className="text-blue-500 animate-spin" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-400/40">SYNCHRONIZING...</span>
                                </div>
                            ) : filteredPlayers.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center gap-6 p-20 text-center animate-in fade-in duration-500">
                                    <div className="h-16 w-16 rounded-full bg-blue-500/5 border border-blue-500/10 flex items-center justify-center text-blue-500/10">
                                        <Info size={32} />
                                    </div>
                                    <div className="max-w-xs">
                                        <h3 className="text-lg font-black mb-1 uppercase tracking-tight text-white/40 italic">ZERO ENTITIES DETECTED</h3>
                                        <p className="text-[10px] text-white/10 font-bold tracking-tight uppercase">NO SIGNAL FOUND IN THE CURRENT SECTOR MATRIX.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 flex min-h-0">
                                    {/* Entity Selection Feed */}
                                    <div className="w-full lg:w-[40%] flex flex-col min-h-0 border-r border-white/5 bg-white/[0.01]">
                                        <div className="p-4 border-b border-white/5 text-[8px] font-black text-white/20 uppercase tracking-[0.4em]">REGISTRY FEED</div>
                                        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2.5 custom-scrollbar">
                                            {filteredPlayers.map((p) => (
                                                <div
                                                    key={p.uuid}
                                                    onClick={() => setSelectedPlayer(p)}
                                                    className={`p-3.5 rounded-2xl flex items-center gap-4 border transition-all cursor-pointer group relative overflow-hidden ${selectedPlayer?.uuid === p.uuid
                                                        ? 'bg-blue-600/20 border-blue-400/40 shadow-xl'
                                                        : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]'
                                                        }`}
                                                >
                                                    <div className="h-10 w-10 rounded-xl bg-[#060813] border border-white/10 overflow-hidden flex-shrink-0 relative">
                                                        <img
                                                            src={`https://mc-heads.net/avatar/${p.username}/64`}
                                                            className="h-full w-full p-1 opacity-90"
                                                            onError={(e) => { (e.target as HTMLImageElement).src = "https://mc-heads.net/avatar/steve/64"; }}
                                                        />
                                                        <div className={`absolute bottom-0 right-0 h-2 w-2 rounded-full border border-[#060813] ${p.status === 'online' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,1)]' : 'bg-white/10'}`} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`text-xs font-black uppercase tracking-tight truncate ${selectedPlayer?.uuid === p.uuid ? 'text-blue-300' : 'text-white'}`}>{p.username}</span>
                                                            {p.role === 'operator' && <ShieldAlert size={12} className="text-amber-400" />}
                                                        </div>
                                                        <span className="text-[9px] text-white/10 font-mono truncate block mt-0.5 uppercase italic">{p.uuid.substring(0, 16)}...</span>
                                                    </div>
                                                    <ChevronRight size={16} className={`text-white/5 transition-all ${selectedPlayer?.uuid === p.uuid ? 'translate-x-1 text-blue-400 opacity-100' : ''}`} />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* High-Fidelity Tactical HUD Details */}
                                    <div className="hidden lg:flex flex-1 items-center justify-center relative bg-gradient-to-b from-blue-500/[0.02] to-transparent min-h-0">
                                        {selectedPlayer ? (
                                            <div className="w-full flex flex-col p-10 overflow-y-auto custom-scrollbar h-full animate-in fade-in zoom-in-95 duration-700">
                                                <div className="flex flex-col items-center text-center mb-8">
                                                    <div className="relative mb-6 group/player">
                                                        <div className="absolute -inset-10 bg-blue-500/10 rounded-full blur-[60px] opacity-0 group-hover/player:opacity-100 transition-opacity" />
                                                        <div className="h-32 w-32 rounded-3xl bg-[#060813] p-3 border border-white/10 shadow-2xl relative z-10 transform group-hover/player:scale-105 transition-transform duration-700">
                                                            <img
                                                                src={`https://mc-heads.net/avatar/${selectedPlayer.username}/128`}
                                                                className="rounded-2xl w-full h-full object-cover shadow-inner"
                                                                onError={(e) => { (e.target as HTMLImageElement).src = "https://mc-heads.net/avatar/steve/128"; }}
                                                            />
                                                        </div>
                                                    </div>
                                                    <h3 className="text-3xl font-black mb-1 uppercase tracking-tighter text-white italic">{selectedPlayer.username}</h3>
                                                    <div className="text-[9px] font-mono text-white/20 uppercase tracking-[0.2em]">{selectedPlayer.uuid}</div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4 mb-8">
                                                    <div className="bg-white/5 border border-white/5 p-4 rounded-2xl">
                                                        <div className="text-[8px] font-black text-white/20 uppercase tracking-[0.4em] mb-1">LAST_SEEN</div>
                                                        <div className="text-xs font-black text-white tracking-widest">{selectedPlayer.lastSeen || 'DISCONNECTED'}</div>
                                                    </div>
                                                    <div className="bg-white/5 border border-white/5 p-4 rounded-2xl">
                                                        <div className="text-[8px] font-black text-white/20 uppercase tracking-[0.4em] mb-1">STATUS</div>
                                                        <div className="text-xs font-black text-emerald-400">{selectedPlayer.status.toUpperCase()}</div>
                                                    </div>
                                                </div>

                                                <div className="space-y-4">
                                                    <div className="text-[9px] font-black text-blue-400/40 uppercase tracking-[0.5em] mb-2 text-center italic">TACTICAL_PROTOCOLS</div>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <button
                                                            onClick={() => handlePlayerAction(selectedPlayer, selectedPlayer.role === 'operator' ? 'deop' : 'op')}
                                                            className="flex items-center justify-center gap-3 bg-white/5 hover:bg-amber-500/10 border border-white/5 hover:border-amber-500/40 px-4 py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] transition-all group active:scale-95"
                                                        >
                                                            <Shield size={16} className="text-amber-500 group-hover:scale-110 transition-transform" />
                                                            <span>{selectedPlayer.role === 'operator' ? 'REVOKE' : 'AUTHORIZE'}</span>
                                                        </button>
                                                        <button
                                                            onClick={() => handlePlayerAction(selectedPlayer, 'whitelist_add')}
                                                            className="flex items-center justify-center gap-3 bg-white/5 hover:bg-emerald-500/10 border border-white/5 hover:border-emerald-500/40 px-4 py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] transition-all group active:scale-95"
                                                        >
                                                            <Check size={16} className="text-emerald-400 group-hover:scale-110 transition-transform" />
                                                            <span>WHITELIST</span>
                                                        </button>
                                                        <button
                                                            onClick={() => handlePlayerAction(selectedPlayer, 'kick')}
                                                            className="flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 border border-white/5 px-4 py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] transition-all group active:scale-95"
                                                        >
                                                            <RotateCw size={16} className="text-white/20 group-hover:rotate-180 transition-transform duration-1000" />
                                                            <span>KICK</span>
                                                        </button>
                                                        <button
                                                            onClick={() => handlePlayerAction(selectedPlayer, 'ban')}
                                                            className="flex items-center justify-center gap-3 bg-red-600/10 hover:bg-red-600/20 border border-red-500/10 hover:border-red-500/40 px-4 py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] text-red-500 transition-all group active:scale-95"
                                                        >
                                                            <Ban size={16} className="text-red-500 group-hover:rotate-12 transition-transform" />
                                                            <span>TERMINATE</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-6 text-center animate-pulse">
                                                <Gamepad size={40} className="text-white/5" />
                                                <p className="text-[9px] font-black uppercase tracking-[0.6em] text-white/5 italic">AWAITING TARGET...</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* Fixed Compact Footer */}
                <div className="mt-6 flex items-center justify-between text-[8px] font-black uppercase tracking-[0.3em] text-white/10 shrink-0">
                    <span>ESTABLISHED: 2024-2026 | CODEON HOSTING MAINFRAME</span>
                    <span className="flex items-center gap-2">
                        <div className="h-1 w-1 rounded-full bg-blue-500/20" />
                        SECURED ACCESS
                    </span>
                </div>
            </div>

            {/* Premium Toast Feed */}
            {toast && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] px-8 py-4 rounded-3xl border bg-[#060813] shadow-2xl backdrop-blur-3xl flex items-center gap-5 animate-in fade-in slide-in-from-bottom-12 duration-700">
                    <div className={`h-10 w-10 rounded-2xl flex items-center justify-center ${toast.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                        {toast.type === 'success' ? <Check size={20} /> : <Info size={20} />}
                    </div>
                    <div>
                        <div className="text-[8px] font-black uppercase opacity-40 mb-0.5">{toast.type === 'success' ? 'EXECUTION SUCCESS' : 'SYSTEM ALERT'}</div>
                        <span className="text-xs font-black uppercase tracking-widest text-white/90">{toast.message}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
