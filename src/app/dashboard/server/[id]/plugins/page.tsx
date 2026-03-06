"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { Search, Download, ExternalLink, Filter, Loader2, Package, Check, Info } from "lucide-react";

export default function PluginsPage() {
    const params = useParams();
    const serverId = params?.id as string;

    const [query, setQuery] = useState("");
    const [loader, setLoader] = useState("paper");
    const [version, setVersion] = useState("1.20.1");
    const [plugins, setPlugins] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);

    const fetchPlugins = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/panel/servers/${serverId}/plugins/search?query=${encodeURIComponent(query)}&loader=${loader}&version=${version}`);
            const data = await res.json();
            setPlugins(data.plugins || []);
        } catch (err) {
            console.error("Failed to fetch plugins:", err);
        } finally {
            setLoading(false);
        }
    }, [serverId, query, loader, version]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (serverId) fetchPlugins();
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [fetchPlugins, serverId]);

    const formatDownloads = (num: number) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    };

    const [installing, setInstalling] = useState<string | null>(null);
    const [installed, setInstalled] = useState<string[]>([]);

    const installPlugin = async (plugin: any) => {
        setInstalling(plugin.id);
        try {
            const res = await fetch(`/api/panel/servers/${serverId}/plugins/install`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ projectId: plugin.id, fileName: `${plugin.slug}.jar` })
            });
            const data = await res.json();
            if (res.ok) {
                setInstalled(prev => [...prev, plugin.id]);
                alert(`Successfully queued ${plugin.name} for installation! Check your console/file manager.`);
            } else {
                alert(`Failed to install: ${data.error}`);
            }
        } catch (err) {
            alert("Network error during installation.");
        } finally {
            setInstalling(null);
        }
    };

    return (
        <div className="p-6 md:p-12 flex flex-col h-full bg-[#060813] text-white font-sans max-w-[1400px] mx-auto overflow-hidden">
            <div className="flex flex-col mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl font-bold">Plugins</h1>
                    <div className="bg-blue-500/10 text-blue-400 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border border-blue-500/20">
                        Modrinth
                    </div>
                </div>
                <p className="text-sm text-white/40">Find and install plugins for your server instantly. Requires server restart after installation.</p>
            </div>

            {/* Filters Bar */}
            <div className="grid grid-cols-1 md:grid-cols-[1fr_200px_200px] gap-4 mb-8">
                <div className="relative group">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-blue-400 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search for plugins (e.g. WorldEdit, EssentialsX...)"
                        value={query}
                        onChange={(e) => { setQuery(e.target.value); setPlugins([]); }}
                        className="w-full bg-[#121935]/80 border border-white/5 rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-blue-500/40 transition-all placeholder:text-white/10"
                    />
                </div>

                <div className="relative">
                    <Filter size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                    <select
                        value={loader}
                        onChange={(e) => { setLoader(e.target.value); setPlugins([]); }}
                        className="w-full bg-[#121935]/80 border border-white/5 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-blue-500/40 appearance-none cursor-pointer"
                    >
                        <option value="paper">PaperMC</option>
                        <option value="spigot">Spigot</option>
                        <option value="bukkit">Bukit</option>
                        <option value="purpur">Purpur</option>
                        <option value="velocity">Velocity</option>
                        <option value="bungeecord">BungeeCord</option>
                    </select>
                </div>

                <div className="relative">
                    <Package size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                    <select
                        value={version}
                        onChange={(e) => { setVersion(e.target.value); setPlugins([]); }}
                        className="w-full bg-[#121935]/80 border border-white/5 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-blue-500/40 appearance-none cursor-pointer"
                    >
                        {["1.21", "1.20.4", "1.20.1", "1.19.4", "1.18.2", "1.17.1", "1.16.5", "1.12.2", "1.8.8"].map(v => (
                            <option key={v} value={v}>{v}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Plugins Grid */}
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {loading && plugins.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center gap-4 text-blue-400/40">
                        <Loader2 size={48} className="animate-spin" />
                        <span className="text-xs font-bold uppercase tracking-widest">Searching Modrinth...</span>
                    </div>
                ) : plugins.length === 0 && !loading ? (
                    <div className="h-64 flex flex-col items-center justify-center gap-4 text-white/10">
                        <Package size={48} />
                        <p className="text-sm font-medium">No plugins found matching your search.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-8">
                        {plugins.map((plugin) => (
                            <div key={plugin.id} className="bg-[#121935]/80 border border-white/5 rounded-2xl p-6 flex flex-col hover:border-blue-500/20 transition-all group relative overflow-hidden">
                                {/* Glow Effect on Hover */}
                                <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                
                                <div className="flex items-start gap-4 mb-4 relative z-10">
                                    <div className="h-16 w-16 bg-[#0a0f25] rounded-2xl border border-white/5 overflow-hidden flex-shrink-0 flex items-center justify-center shadow-lg group-hover:shadow-blue-500/10 transition-shadow">
                                        {plugin.icon_url ? (
                                            <img src={plugin.icon_url} alt={plugin.name} className="h-full w-full object-cover" />
                                        ) : (
                                            <Package size={32} className="text-white/10" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors truncate">{plugin.name}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] font-bold text-white/20 uppercase tracking-tighter truncate max-w-[100px]">{plugin.author}</span>
                                            <span className="h-1 w-1 bg-white/10 rounded-full" />
                                            <div className="flex items-center gap-1 text-[10px] font-bold text-blue-400/80">
                                                <Download size={10} /> {formatDownloads(plugin.downloads)}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <p className="text-xs text-white/40 leading-relaxed mb-6 line-clamp-3 font-medium flex-1 relative z-10">
                                    {plugin.description}
                                </p>

                                <div className="flex items-center gap-3 relative z-10">
                                    <button 
                                        onClick={() => installPlugin(plugin)}
                                        disabled={installing === plugin.id || installed.includes(plugin.id)}
                                        className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:active:scale-100 ${
                                            installed.includes(plugin.id) 
                                            ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/20' 
                                            : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20'
                                        }`}
                                    >
                                        {installing === plugin.id ? (
                                            <><Loader2 size={14} className="animate-spin" /> Installing...</>
                                        ) : installed.includes(plugin.id) ? (
                                            <><Check size={14} /> Installed</>
                                        ) : (
                                            <><Download size={14} /> Install Plugin</>
                                        )}
                                    </button>
                                    <button className="p-2.5 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white rounded-xl transition-all">
                                        <Info size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Pagination / Stats (Optional) */}
            <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center text-[10px] font-bold text-white/20 uppercase tracking-widest">
                <span>Showing {plugins.length} results from Modrinth</span>
                <div className="flex gap-2">
                    <div className="px-2 py-1 bg-white/5 rounded hover:bg-white/10 transition-colors cursor-pointer text-white/60">1</div>
                    <div className="px-2 py-1 bg-white/5 rounded hover:bg-white/10 transition-colors cursor-pointer">2</div>
                    <div className="px-2 py-1 bg-white/5 rounded hover:bg-white/10 transition-colors cursor-pointer">3</div>
                    <div className="px-2 py-1 bg-white/5 rounded hover:bg-white/10 transition-colors cursor-pointer">&raquo;</div>
                </div>
            </div>
        </div>
    );
}
