"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Package, Download, Info, Check, Search, Filter, Loader2, ArrowRight, Shield, Zap, BookOpen } from "lucide-react";

export default function VersionsPage() {
    const params = useParams();
    const serverId = params?.id as string;

    const [softwares, setSoftwares] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSoftware, setSelectedSoftware] = useState<any>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [fetchingVersions, setFetchingVersions] = useState(false);
    const [installing, setInstalling] = useState(false);
    const [versions, setVersions] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [alertModal, setAlertModal] = useState<{
        open: boolean;
        type: 'success' | 'error' | 'info' | 'confirm';
        title: string;
        message: string;
        onConfirm?: () => void;
    }>({ open: false, type: 'info', title: '', message: '' });

    useEffect(() => {
        const fetchSoftwares = async () => {
            try {
                const res = await fetch(`/api/panel/servers/${serverId}/versions/list`);
                const data = await res.json();
                setSoftwares(data.softwares || []);
            } catch (err) {
                console.error("Failed to fetch softwares:", err);
            } finally {
                setLoading(false);
            }
        };

        if (serverId) fetchSoftwares();
    }, [serverId]);

    const openSoftwareModal = async (software: any) => {
        setSelectedSoftware(software);
        setModalOpen(true);
        setFetchingVersions(true);
        setVersions([]);

        try {
            const res = await fetch(`/api/panel/servers/${serverId}/versions/get?software=${software.id}`);
            const data = await res.json();
            if (data.versions) {
                setVersions(data.versions);
            } else {
                console.error("No versions found for", software.id);
                setVersions([]);
            }
        } catch (err) {
            console.error("Failed to fetch versions:", err);
            setVersions([]);
        } finally {
            setFetchingVersions(false);
        }
    };

    const installVersion = (version: any) => {
        if (!selectedSoftware || installing) return;
        executeInstallation(version);
    };

    const executeInstallation = async (version: any) => {
        setInstalling(true);
        try {
            const res = await fetch(`/api/panel/servers/${serverId}/versions/install`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ softwareId: selectedSoftware.id, versionId: version.id })
            });
            const data = await res.json();

            setInstalling(false);

            if (res.ok) {
                setModalOpen(false);
                setAlertModal({
                    open: true,
                    type: 'success',
                    title: 'Installation Started',
                    message: data.message || "🚀 Your server is now downloading the software and will restart automatically. Please check the Terminal/Console in a few seconds to see it booting up."
                });
            } else {
                const errorMsg = data.details ? `${data.error}\n\nDetails: ${data.details}` : data.error;
                setAlertModal({
                    open: true,
                    type: 'error',
                    title: 'Installation Failed',
                    message: errorMsg || "Unknown error occurred during installation."
                });
            }
        } catch (err) {
            setInstalling(false);
            setAlertModal({
                open: true,
                type: 'error',
                title: 'Network Error',
                message: "Please check your internet connection and panel reachability."
            });
        }
    };

    const filteredSoftwares = softwares.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.desc.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 md:p-12 flex flex-col h-full bg-[#060813] text-white font-sans max-w-[1400px] mx-auto overflow-hidden">
            <div className="flex flex-col mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl font-bold">Software Versions</h1>
                    <div className="bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border border-emerald-500/20">
                        System
                    </div>
                </div>
                <p className="text-sm text-white/40">Switch between server jars and modloaders. This will reboot your server.</p>
            </div>

            {/* Search Bar */}
            <div className="mb-8 relative group max-w-md">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-emerald-400 transition-colors" />
                <input
                    type="text"
                    placeholder="Search software (Paper, Forge...)"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-[#121935]/80 border border-white/5 rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-emerald-500/40 transition-all placeholder:text-white/10"
                />
            </div>

            {/* Software Grid */}
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {loading ? (
                    <div className="h-64 flex flex-col items-center justify-center gap-4 text-emerald-400/40">
                        <Loader2 size={48} className="animate-spin" />
                        <span className="text-xs font-bold uppercase tracking-widest">Loading Catalog...</span>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-8">
                        {filteredSoftwares.map((s) => (
                            <div
                                key={s.id}
                                onClick={() => openSoftwareModal(s)}
                                className="bg-[#121935]/50 border border-white/5 rounded-xl p-5 flex items-center gap-4 hover:bg-[#161d3f] hover:border-emerald-500/20 transition-all cursor-pointer group relative overflow-hidden active:scale-[0.98]"
                            >
                                <div className="h-12 w-12 rounded-lg bg-[#0a0f25] border border-white/5 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-lg group-hover:shadow-emerald-500/5">
                                    <img
                                        src={s.icon}
                                        alt={s.name}
                                        className="h-8 w-8 object-contain group-hover:scale-110 transition-transform"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = "https://raw.githubusercontent.com/Pterodactyl-Eggs/yolks/master/images/minecraft.png";
                                        }}
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-sm font-bold text-white mb-0.5 flex items-center gap-2">
                                        {s.name}
                                        {s.name === 'Purpur' && <Zap size={10} className="text-yellow-400 fill-yellow-400" />}
                                        {s.name === 'Paper' && <Shield size={10} className="text-blue-400" />}
                                    </h3>
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-white/30 uppercase tracking-tight">
                                        <span>{s.versions_count} Versions</span>
                                        <span className="w-1 h-1 bg-white/10 rounded-full" />
                                        <span>{s.builds_count} Builds</span>
                                    </div>
                                </div>
                                <div className="text-white/10 group-hover:text-emerald-400 transition-colors">
                                    <ArrowRight size={16} />
                                </div>

                                {/* Overlay glow */}
                                <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Versions Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
                    <div className="relative w-full max-w-xl bg-[#0B1021] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[80vh] overflow-hidden">
                        <div className="p-6 border-b border-white/5 flex items-center gap-4">
                            <div className="h-10 w-10 rounded-lg bg-white/5 flex items-center justify-center overflow-hidden">
                                {selectedSoftware?.icon ? (
                                    <img
                                        src={selectedSoftware.icon}
                                        className="h-8 w-8 object-contain"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = "https://raw.githubusercontent.com/Pterodactyl-Eggs/yolks/master/images/minecraft.png";
                                        }}
                                    />
                                ) : (
                                    <Package size={24} className="text-white/20" />
                                )}
                            </div>
                            <div>
                                <h2 className="text-lg font-bold">{selectedSoftware?.name} Versions</h2>
                                <p className="text-xs text-white/40">{selectedSoftware?.desc}</p>
                            </div>
                            <button
                                onClick={() => setModalOpen(false)}
                                className="ml-auto text-white/20 hover:text-white transition-colors"
                            >
                                <Check size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar relative">
                            {fetchingVersions ? (
                                <div className="h-48 flex items-center justify-center text-emerald-400">
                                    <Loader2 size={24} className="animate-spin" />
                                </div>
                            ) : (
                                <>
                                    {versions.map((v) => (
                                        <div
                                            key={v.id}
                                            onClick={() => !installing && installVersion(v)}
                                            className={`flex items-center justify-between p-4 bg-white/5 rounded-xl border border-transparent transition-all group ${installing ? "opacity-50 cursor-not-allowed" : "hover:bg-white/10 hover:border-emerald-500/20 cursor-pointer"
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="text-sm font-bold text-white">{v.name}</div>
                                                <div className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${v.type === 'Stable' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/10 text-white/40'
                                                    }`}>
                                                    {v.type}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-[10px] font-mono text-white/20">Build #{v.build}</div>
                                                {!installing && (
                                                    <div className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5">
                                                        <Download size={10} /> Install
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}

                                    {installing && (
                                        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center gap-3 z-10">
                                            <Loader2 size={32} className="animate-spin text-emerald-400" />
                                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400 animate-pulse">
                                                Processing Installation...
                                            </span>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        <div className="p-4 border-t border-white/5 bg-black/20 text-[10px] text-white/30 text-center font-medium">
                            CAUTION: Changing software might delete incompatible files. Always backup first.
                        </div>
                    </div>
                </div>
            )}
            {/* Premium Alert/Confirm Modal */}
            {alertModal.open && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => alertModal.type !== 'confirm' && setAlertModal(prev => ({ ...prev, open: false }))} />
                    <div className="relative w-full max-w-md bg-[#0B1021] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-8 flex flex-col items-center text-center">
                            <div className={`h-16 w-16 rounded-full flex items-center justify-center mb-6 ${alertModal.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                alertModal.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                    alertModal.type === 'confirm' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                        'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                }`}>
                                {alertModal.type === 'success' && <Check size={32} />}
                                {alertModal.type === 'error' && <Info size={32} />}
                                {alertModal.type === 'confirm' && <Download size={32} />}
                                {alertModal.type === 'info' && <Info size={32} />}
                            </div>

                            <h2 className="text-xl font-bold mb-2">{alertModal.title}</h2>
                            <p className="text-sm text-white/40 leading-relaxed mb-8">{alertModal.message}</p>

                            <div className="flex items-center gap-3 w-full">
                                {alertModal.type === 'confirm' ? (
                                    <>
                                        <button
                                            onClick={() => setAlertModal(prev => ({ ...prev, open: false }))}
                                            className="flex-1 px-6 py-3 rounded-xl bg-white/5 border border-white/5 text-sm font-bold hover:bg-white/10 transition-all"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={() => {
                                                alertModal.onConfirm?.();
                                                setAlertModal(prev => ({ ...prev, open: false }));
                                            }}
                                            className="flex-1 px-6 py-3 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-500 hover:shadow-lg hover:shadow-emerald-500/20 transition-all active:scale-95"
                                        >
                                            Confirm
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={() => setAlertModal(prev => ({ ...prev, open: false }))}
                                        className="w-full px-6 py-3 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-500 transition-all active:scale-95"
                                    >
                                        Dismiss
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
