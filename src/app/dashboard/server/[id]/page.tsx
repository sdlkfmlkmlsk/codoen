"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { Play, Square, RotateCw, Terminal, Cpu, HardDrive, MemoryStick, Copy, AlertCircle, Wifi, Database, Zap } from "lucide-react";
import { AlertBanner } from "@/components/AlertBanner";
import AnsiHtml from "ansi-html-community";

AnsiHtml.setColors({
    reset: ['fff', 'transparent'],
    black: '000', red: 'EF4444', green: '22C55E', yellow: 'EAB308',
    blue: '3B82F6', magenta: 'D946EF', cyan: '06B6D4', white: 'fff',
    light_black: '737373', light_red: 'F87171', light_green: '4ADE80',
    light_yellow: 'FDE047', light_blue: '60A5FA', light_magenta: 'F0ABFC',
    light_cyan: '22D3EE', light_white: 'fff'
});

export default function ServerManagePage() {
    const params = useParams();
    const router = useRouter();

    // Server state
    const [serverId, setServerId] = useState<string | null>(null);
    const [server, setServer] = useState<any>(null);
    const [user, setUser] = useState<any>(null); // To show email in header
    const [stats, setStats] = useState<any>(null);
    const [displayUptime, setDisplayUptime] = useState<number>(0);
    const [statsHistory, setStatsHistory] = useState<any[]>([]); // Array to store history for graphs
    const [loading, setLoading] = useState(true);
    const [powering, setPowering] = useState(false);
    const [currentTheme, setCurrentTheme] = useState<'default' | 'minecraft'>('default');

    // Persistence
    useEffect(() => {
        const saved = localStorage.getItem(`theme_${serverId}`);
        if (saved === 'minecraft') setCurrentTheme('minecraft');
    }, [serverId]);

    const toggleTheme = () => {
        const next = currentTheme === 'default' ? 'minecraft' : 'default';
        setCurrentTheme(next);
        localStorage.setItem(`theme_${serverId}`, next);
    };

    useEffect(() => {
        // Fetch User info
        fetch("/api/auth/user")
            .then(res => res.json())
            .then(data => {
                if (data.user) setUser(data.user);
            })
            .catch(() => { });

        if (!params || !params.id) return;
        const extractedId = Array.isArray(params.id) ? params.id[0] : params.id;
        setServerId(extractedId);
    }, [params]);

    // Terminal State
    const [logs, setLogs] = useState<string[]>([
        "Connecting to server console...",
    ]);
    const terminalEndRef = useRef<HTMLDivElement>(null);
    const terminalContainerRef = useRef<HTMLDivElement>(null);

    // Fetch real stats, details, and logs
    useEffect(() => {
        if (!serverId) return;

        const fetchDetails = () => {
            fetch(`/api/panel/servers/${serverId}`)
                .then(res => res.json())
                .then(data => {
                    if (data.server) setServer(data.server);
                })
                .catch(() => { });
        };

        const fetchStats = () => {
            fetch(`/api/panel/servers/${serverId}/resources`)
                .then(res => res.json())
                .then(data => {
                    if (data.stats) {
                        setStats(data.stats);
                        if (data.stats.uptime) setDisplayUptime(data.stats.uptime);
                        // Maintain history of last 60 points for a longer view
                        setStatsHistory(prev => {
                            const combined = [...prev, data.stats];
                            return combined.length > 60 ? combined.slice(-60) : combined;
                        });
                    }
                })
                .catch(() => { });
        };

        const fetchLogsBuffer = () => {
            fetch(`/api/panel/servers/${serverId}/logs`)
                .then(res => res.json())
                .then(data => {
                    if (data.logs) {
                        // Logs arrive as one big string or object, split by newline
                        const logLines = typeof data.logs === 'string'
                            ? data.logs.split('\n')
                            : (data.logs.logs?.split('\n') || []);

                        // Only show last 200 lines to keep UI snappy
                        setLogs(logLines.slice(-200));
                    }
                })
                .catch(() => { });
        }

        fetchDetails();
        fetchStats();
        fetchLogsBuffer();

        // Poll stats/logs every 2.5 seconds for smoother feel
        const interval = setInterval(() => {
            fetchStats();
            fetchLogsBuffer();
        }, 2500);

        setLoading(false);
        return () => clearInterval(interval);
    }, [serverId]);

    // Local Uptime Incrementor (for "smooth" feel)
    useEffect(() => {
        if (stats?.status !== 'running') return;

        const tick = setInterval(() => {
            setDisplayUptime(prev => prev + 1000);
        }, 1000);

        return () => clearInterval(tick);
    }, [stats?.status]);

    // Format Uptime
    const formatUptime = (ms: number) => {
        if (!ms) return "0s";
        const seconds = Math.floor(ms / 1000);
        const d = Math.floor(seconds / (3600 * 24));
        const h = Math.floor((seconds % (3600 * 24)) / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);

        const parts = [];
        if (d > 0) parts.push(`${d}d`);
        if (h > 0) parts.push(`${h}h`);
        if (m > 0) parts.push(`${m}m`);
        if (s > 0 || parts.length === 0) parts.push(`${s}s`);
        return parts.join(" ");
    };

    // Format Bytes
    const formatBytes = (bytes: number) => {
        if (!bytes || bytes === 0) return "0.00 MiB";
        const k = 1024, sizes = ["B", "KiB", "MiB", "GiB", "TiB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    // Helper for reliable SVG path
    const getPathData = (data: any[], key: string) => {
        if (data.length < 2) return "";
        const points = data.map((s, i) => {
            const x = (i / (data.length - 1)) * 100;
            let val = 0;
            if (key === 'cpu') val = s?.cpu_absolute ?? s?.cpu ?? 0;
            else if (key === 'ram') {
                const limit = s?.memory_limit_bytes > 0 ? s.memory_limit_bytes : (s?.memory_bytes * 1.5 || 1);
                val = (s?.memory_bytes / limit) * 100;
            }
            else if (key === 'net_in') val = ((s?.network_rx_bytes || s?.rx_bytes || 0) / (1024 * 1024)) * 20; // 20% per MB
            else if (key === 'net_out') val = ((s?.network_tx_bytes || s?.tx_bytes || 0) / (1024 * 1024)) * 20;

            // Add a tiny floor (0.5%) if there's any value, so it's not perfectly invisible on the axis
            if (val > 0) val = Math.max(val, 1.5);

            const y = 100 - Math.min(val, 100);
            return { x, y };
        });

        return `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`;
    };

    // Auto-scroll terminal
    useEffect(() => {
        if (terminalContainerRef.current) {
            terminalContainerRef.current.scrollTop = terminalContainerRef.current.scrollHeight;
        }
    }, [logs]);

    // Send Power Action
    const sendPowerAction = async (action: "start" | "stop" | "restart" | "kill") => {
        if (!serverId) return;
        setPowering(true);
        setLogs(prev => [...prev, `[Panel] Sending signal: ${action.toUpperCase()}...`]);
        try {
            const res = await fetch(`/api/panel/servers/${serverId}/power`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action })
            });
            const data = await res.json();

            if (!res.ok) {
                setLogs(prev => [...prev, `[Panel] Error: ${data.error || "Failed to send signal"}`]);
            } else if (data.dummy) {
                setLogs(prev => [...prev, `[Panel] [DEMO MODE] Command logged. (Set PTERO_ADMIN_CLIENT_TOKEN to make it real)`]);
            } else {
                setLogs(prev => [...prev, `[Panel] Signal received successfully.`]);
            }
        } catch (e: any) {
            setLogs(prev => [...prev, `[Panel] Network Error: ${e.message}`]);
        } finally {
            setPowering(false);
        }
    };

    if (loading) return null;

    return (
        <div className={`min-h-screen text-white p-4 md:p-6 font-sans w-full flex flex-col items-center transition-all duration-700 relative overflow-hidden ${currentTheme === 'minecraft' ? 'bg-[#0a0a0a]' : ''}`}>
            {/* Minecraft Theme Background Layer */}
            {currentTheme === 'minecraft' && (
                <div
                    className="absolute inset-0 z-0 animate-in fade-in duration-1000"
                    style={{
                        backgroundImage: 'url("/minecraft-bg.png")',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        filter: 'brightness(0.3) contrast(1.2)'
                    }}
                />
            )}

            <div className="w-full max-w-[1600px] relative z-10">
                <AlertBanner />

                <div className="mb-8">
                    <h2 className="text-xl font-bold tracking-tight mb-2 text-white/90">Welcome, {user?.email}</h2>
                    <p className="text-sm text-white/40 font-medium">Managing server instance: <span className="text-blue-400">{serverId}</span></p>
                </div>

                {/* Alert Banner */}
                <div className="bg-[#032014] border border-[#0A3D24] text-[#29D788] px-4 py-3 rounded-lg flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3 text-sm font-medium uppercase tracking-wider">
                        <AlertCircle size={18} />
                        NEW CODEON HOSTING GAMING PANEL V1.0
                    </div>
                    <button className="text-[#29D788] hover:text-white transition-colors"><Square size={14} className="opacity-0" />X</button>
                </div>

                {/* High Usage / Upgrade Alert */}
                {stats && server?.limits && (
                    (stats.cpu_absolute > (server.limits.cpu * 0.8)) ||
                    (server.limits.memory > 0 && stats.memory_bytes > (server.limits.memory * 1024 * 1024 * 0.8))
                ) && (
                        <div className="bg-[#1a120b] border border-[#3d240a] text-[#ffd700] px-5 py-4 rounded-xl flex flex-col md:flex-row justify-between items-center mb-6 gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 bg-[#ffd700]/10 rounded-full flex items-center justify-center text-[#ffd700]">
                                    <AlertCircle size={24} className="animate-pulse" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-[15px]">Update User Server Required</h3>
                                    <p className="text-xs text-[#ffd700]/60">Your server is currently experiencing high resource load. Upgrade now for better performance.</p>
                                </div>
                            </div>
                            <button
                                onClick={() => router.push(`/dashboard/server/${serverId}/upgrade`)}
                                className="bg-[#ffd700] text-black font-bold px-6 py-2 rounded-lg text-xs hover:bg-[#e6c200] transition-all flex items-center gap-2 shadow-lg shadow-[#ffd700]/10 whitespace-nowrap"
                            >
                                <Zap size={14} className="fill-current" /> Upgrade Server
                            </button>
                        </div>
                    )}

                {/* Top Server Header Section */}
                <div className="bg-[#121828] border border-white/5 rounded-xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                    <div className="flex items-center gap-4">
                        <div className={`h-12 w-12 rounded-lg border transition-all flex items-center justify-center ${currentTheme === 'minecraft' ? 'bg-emerald-900/40 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'bg-[#1a233a] border-white/5'}`}>
                            <Database size={24} className={currentTheme === 'minecraft' ? 'text-emerald-400' : 'text-blue-400'} />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-white uppercase tracking-tight">{server?.name || "Loading..."}</h1>
                            <p className="text-xs text-gray-400">{server?.description || "Fetching server info"}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 mt-4 md:mt-0">
                        <button
                            onClick={toggleTheme}
                            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border flex items-center gap-2 ${currentTheme === 'minecraft'
                                ? 'bg-emerald-600 border-emerald-400 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                                : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'}`}
                        >
                            <Zap size={12} className={currentTheme === 'minecraft' ? 'fill-current' : ''} />
                            {currentTheme === 'minecraft' ? 'Minecraft Active' : 'Switch to Minecraft'}
                        </button>
                        <div className="h-6 w-px bg-white/10 mx-1 hidden md:block" />
                        <button
                            onClick={() => sendPowerAction("start")} disabled={powering}
                            className="bg-[#0f3426] text-[#34D399] hover:bg-[#144734] px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2"
                        >
                            <Play size={12} className="fill-current" /> Start
                        </button>
                        <button
                            onClick={() => sendPowerAction("restart")} disabled={powering}
                            className="bg-[#172340] text-blue-400 hover:bg-[#1f2f5c] px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2"
                        >
                            <RotateCw size={12} /> Restart
                        </button>
                        <button
                            onClick={() => sendPowerAction("stop")} disabled={powering}
                            className="bg-[#36151f] text-red-400 hover:bg-[#4d1f2d] px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2"
                        >
                            <Square size={12} className="fill-current" /> Stop
                        </button>
                    </div>
                </div>

                {/* 4 Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    {/* Address Card */}
                    <div className="bg-[#121828] border border-white/5 rounded-xl p-5 flex flex-col">
                        <div className="flex items-center gap-2 text-gray-400 mb-2 text-[11px] font-bold uppercase tracking-wider">
                            <Database size={14} className="text-blue-400" /> Server Address
                            <button className="ml-auto hover:text-white transition-colors" title="Copy Address">
                                <Copy size={14} />
                            </button>
                        </div>
                        <div className="text-[15px] font-bold text-white mb-6 truncate">
                            {server?.allocation ? `${server.allocation.alias || server.allocation.ip || 'Unknown IP'}:${server.allocation.port || ''}` : "Fetching..."}
                        </div>

                        {/* Divider */}
                        <div className="h-px bg-white/5 w-full mb-4 mt-auto" />

                        <div className="flex items-center justify-between text-[11px]">
                            <div className="flex items-center gap-2">
                                <div className={`w-2.5 h-2.5 rounded-full ${stats?.status === 'running' ? 'bg-[#29D788]' : 'bg-gray-600'}`} />
                                <span className="text-gray-400 font-bold uppercase tracking-wider">Uptime:</span>
                            </div>
                            <span className="text-gray-200 font-mono text-xs">{formatUptime(displayUptime)}</span>
                        </div>
                    </div>

                    {/* CPU */}
                    <div className={`border transition-all rounded-xl p-5 flex flex-col ${currentTheme === 'minecraft' ? 'bg-black/60 border-emerald-500/20 shadow-xl' : 'bg-[#121828] border-white/5'}`}>
                        <div className="flex items-center gap-2 text-gray-400 mb-2 text-[11px] font-bold uppercase tracking-wider">
                            <Cpu size={14} className={currentTheme === 'minecraft' ? 'text-emerald-400' : 'text-gray-400'} /> CPU Usage
                        </div>
                        <div className="flex items-baseline gap-2 mb-2">
                            <span className="text-lg font-bold text-white">
                                {stats?.cpu_absolute ? stats.cpu_absolute.toFixed(1) : "0.0"}%
                            </span>
                        </div>
                        <div className={`w-full h-1 rounded-full mt-auto overflow-hidden ${currentTheme === 'minecraft' ? 'bg-emerald-950/50' : 'bg-[#1a233a]'}`}>
                            <div
                                className={`h-full rounded-full transition-all duration-1000 ease-in-out ${stats?.cpu_absolute > (server?.limits?.cpu * 0.8) ? 'bg-amber-500' : (currentTheme === 'minecraft' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-blue-500')}`}
                                style={{ width: `${Math.min(((stats?.cpu_absolute || 0) / (server?.limits?.cpu || 100)) * 100, 100)}%` }}
                            />
                        </div>
                    </div>

                    {/* RAM */}
                    <div className={`border transition-all rounded-xl p-5 flex flex-col ${currentTheme === 'minecraft' ? 'bg-black/60 border-emerald-500/20 shadow-xl' : 'bg-[#121828] border-white/5'}`}>
                        <div className="flex items-center gap-2 text-gray-400 mb-2 text-[11px] font-bold uppercase tracking-wider">
                            <MemoryStick size={14} className={currentTheme === 'minecraft' ? 'text-emerald-400' : 'text-gray-400'} /> Memory Usage
                        </div>
                        <div className="flex items-baseline gap-2 mb-2">
                            <span className="text-lg font-bold text-white">
                                {formatBytes(stats?.memory_bytes)}
                            </span>
                            <span className="text-[11px] text-gray-500 font-bold">
                                / {server?.limits?.memory ? formatBytes(server.limits.memory * 1024 * 1024) : "..."}
                            </span>
                        </div>
                        <div className={`w-full h-1 rounded-full mt-auto overflow-hidden ${currentTheme === 'minecraft' ? 'bg-emerald-950/50' : 'bg-[#1a233a]'}`}>
                            <div
                                className={`h-full rounded-full transition-all duration-1000 ease-in-out ${stats?.memory_bytes > (server?.limits?.memory * 1024 * 1024 * 0.8) ? 'bg-amber-500' : (currentTheme === 'minecraft' ? 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-indigo-500')}`}
                                style={{ width: `${(server?.limits?.memory && stats?.memory_bytes) ? (stats.memory_bytes / (server.limits.memory * 1024 * 1024)) * 100 : 0}%` }}
                            />
                        </div>
                    </div>

                    {/* Disk */}
                    <div className={`border transition-all rounded-xl p-5 flex flex-col ${currentTheme === 'minecraft' ? 'bg-black/60 border-emerald-500/20 shadow-xl' : 'bg-[#121828] border-white/5'}`}>
                        <div className="flex items-center gap-2 text-gray-400 mb-2 text-[11px] font-bold uppercase tracking-wider">
                            <HardDrive size={14} className={currentTheme === 'minecraft' ? 'text-emerald-400' : 'text-gray-400'} /> Disk Usage
                        </div>
                        <div className="flex items-baseline gap-2 mb-2">
                            <span className="text-lg font-bold text-white">
                                {formatBytes(stats?.disk_bytes)}
                            </span>
                            <span className="text-[11px] text-gray-500 font-bold">
                                / {server?.limits?.disk ? formatBytes(server.limits.disk * 1024 * 1024) : "..."}
                            </span>
                        </div>
                        <div className={`w-full h-1 rounded-full mt-auto overflow-hidden ${currentTheme === 'minecraft' ? 'bg-emerald-950/50' : 'bg-[#1a233a]'}`}>
                            <div
                                className={`h-full rounded-full transition-all duration-1000 ease-in-out ${currentTheme === 'minecraft' ? 'bg-amber-600 shadow-[0_0_10px_rgba(217,119,6,0.5)]' : 'bg-orange-500'}`}
                                style={{ width: `${(server?.limits?.disk && stats?.disk_bytes) ? (stats.disk_bytes / (server.limits.disk * 1024 * 1024)) * 100 : 0}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Console */}
                <div className={`border transition-all rounded-xl flex flex-col mb-6 h-[500px] overflow-hidden ${currentTheme === 'minecraft' ? 'bg-black/80 border-emerald-500/20 shadow-2xl' : 'bg-[#121828] border-white/5'}`}>
                    {/* Console Header */}
                    <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-2 font-bold text-sm text-gray-200">
                            <Terminal size={16} className={currentTheme === 'minecraft' ? 'text-emerald-400' : 'text-blue-500'} /> Console
                        </div>
                        <div className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-widest ${currentTheme === 'minecraft' ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-500/30' : 'bg-[#172340] text-blue-400'}`}>
                            {stats?.status || "Running"}
                        </div>
                    </div>

                    {/* Console Body */}
                    <div
                        ref={terminalContainerRef}
                        className="flex-1 p-5 bg-[#0b0e17] font-mono text-[13px] overflow-y-auto w-full break-all whitespace-pre-wrap leading-relaxed custom-scrollbar text-white/90"
                    >
                        {logs.map((log, i) => {
                            if (log.includes("http")) {
                                return (
                                    <div key={i} className="mb-0.5">
                                        <span dangerouslySetInnerHTML={{ __html: AnsiHtml(log) }} className="hover:underline cursor-pointer break-all" />
                                    </div>
                                );
                            }

                            // Apply robust fallback highlight if it's purely text (not ANSI colored) or known error strings
                            let highlightClass = "";
                            const lowerLog = log.toLowerCase();

                            // Check for typical error signatures regardless of ANSI
                            if (
                                log.includes("Error") || log.includes("ERROR]") || log.includes("FAILED") ||
                                log.includes("Exception") || log.includes("Invalid") || log.includes("<--[HERE]") ||
                                lowerLog.includes("nothing changed") || lowerLog.includes("not an operator")
                            ) {
                                highlightClass = "text-red-400 font-bold";
                            } else if (log.includes("WARN]")) {
                                highlightClass = "text-yellow-400 font-bold";
                            } else if (!log.includes("\x1b[")) {
                                if (lowerLog.includes("marked as starting") || log.includes("[Panel]")) {
                                    highlightClass = "text-[#FBBF24]";
                                } else {
                                    highlightClass = "text-white/80";
                                }
                            }

                            return (
                                <div
                                    key={i}
                                    className={`mb-0.5 ${highlightClass}`}
                                    dangerouslySetInnerHTML={{ __html: AnsiHtml(log).replace(/\n/g, '<br/>') }}
                                />
                            );
                        })}
                        <div ref={terminalEndRef} />
                    </div>

                    {/* Console Footer */}
                    <div className="p-4 border-t border-white/5 flex items-center justify-between gap-4">
                        <div className="flex-1 flex items-center bg-[#0b0e17] border border-white/5 rounded-lg overflow-hidden focus-within:border-blue-500/50 transition-colors">
                            <span className="text-gray-500 font-mono pl-4 text-xs font-bold">&gt;</span>
                            <input
                                type="text"
                                id="console-input"
                                placeholder="Enter command..."
                                className="bg-transparent border-none outline-none text-xs font-mono w-full px-3 py-2.5 text-gray-200 placeholder:text-gray-600"
                                onKeyDown={async (e) => {
                                    if (e.key === 'Enter' && e.currentTarget.value) {
                                        const cmd = e.currentTarget.value;
                                        setLogs(prev => [...prev, `> ${cmd}`]);
                                        e.currentTarget.value = '';

                                        try {
                                            await fetch(`/api/panel/servers/${serverId}/command`, {
                                                method: "POST",
                                                headers: { "Content-Type": "application/json" },
                                                body: JSON.stringify({ command: cmd })
                                            });
                                        } catch (err) { }
                                    }
                                }}
                            />
                        </div>
                        <button
                            onClick={() => {
                                const input = document.getElementById('console-input') as HTMLInputElement;
                                if (input && input.value) {
                                    const e = new KeyboardEvent('keydown', { key: 'Enter' });
                                    input.dispatchEvent(e);
                                }
                            }}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-lg text-xs font-semibold transition-colors"
                        >
                            Send
                        </button>
                    </div>
                </div>

                {/* Bottom Graphs */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* CPU Graph */}
                    <div className={`border transition-all rounded-xl p-5 h-48 flex flex-col group ${currentTheme === 'minecraft' ? 'bg-black/60 border-emerald-500/20' : 'bg-[#121828] border-white/5'}`}>
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-4 flex justify-between">
                            CPU Load
                            <span className={`${currentTheme === 'minecraft' ? 'text-emerald-400' : 'text-blue-400'} group-hover:block hidden`}>{stats?.cpu_absolute?.toFixed(1)}%</span>
                        </div>
                        <div className="flex-1 border-b border-l border-white/10 relative overflow-hidden">
                            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                                <path
                                    d={getPathData(statsHistory, 'cpu')}
                                    fill="none"
                                    stroke={currentTheme === 'minecraft' ? '#10b981' : '#3b82f6'}
                                    strokeWidth="2"
                                    className="transition-all duration-700 ease-in-out"
                                />
                            </svg>
                        </div>
                    </div>

                    {/* Memory Graph */}
                    <div className={`border transition-all rounded-xl p-5 h-48 flex flex-col group ${currentTheme === 'minecraft' ? 'bg-black/60 border-emerald-500/20' : 'bg-[#121828] border-white/5'}`}>
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-4 flex justify-between">
                            Memory Usage
                            <span className={`${currentTheme === 'minecraft' ? 'text-emerald-400' : 'text-indigo-400'} group-hover:block hidden`}>{formatBytes(stats?.memory_bytes)}</span>
                        </div>
                        <div className="flex-1 border-b border-l border-white/10 relative overflow-hidden">
                            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                                <path
                                    d={getPathData(statsHistory, 'ram')}
                                    fill="none"
                                    stroke={currentTheme === 'minecraft' ? '#34d399' : '#6366f1'}
                                    strokeWidth="2"
                                    className="transition-all duration-700 ease-in-out"
                                />
                            </svg>
                        </div>
                    </div>

                    {/* Network Graph */}
                    <div className="bg-[#121828] border border-white/5 rounded-xl p-5 h-48 flex flex-col group">
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-4 flex justify-between">
                            Network Traffic
                            <div className="flex gap-3 text-[10px]">
                                <span className="flex items-center gap-1.5 text-blue-400"><div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div> In</span>
                                <span className="flex items-center gap-1.5 text-indigo-400"><div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div> Out</span>
                            </div>
                        </div>
                        <div className="flex-1 border-b border-l border-white/10 relative overflow-hidden">
                            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                                {/* Inbound - Scale to max of 5MB for visibility */}
                                <path
                                    d={getPathData(statsHistory, 'net_in')}
                                    fill="rgba(59, 130, 246, 0.1)"
                                    stroke="#3B82F6"
                                    strokeWidth="1.5"
                                    className="transition-all duration-1000 ease-out"
                                />
                                {/* Outbound */}
                                <path
                                    d={getPathData(statsHistory, 'net_out')}
                                    fill="none"
                                    stroke="#818CF8"
                                    strokeWidth="1.5"
                                    strokeDasharray="4 4"
                                    className="transition-all duration-1000 ease-out"
                                />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="text-center text-white/20 text-xs font-mono font-medium mt-10 mb-4 pb-4">
                    CODEON® © 2024 - 2026
                </div>

            </div>
        </div>
    );
}
