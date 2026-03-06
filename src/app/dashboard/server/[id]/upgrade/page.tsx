"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
    ChevronLeft,
    Cpu,
    MemoryStick,
    CreditCard,
    UploadCloud,
    ShieldCheck,
    Building,
    Smartphone,
    FileCheck,
    Zap,
    Plus,
    Minus,
    ArrowRight
} from "lucide-react";
import Link from "next/link";

export default function UpgradePage() {
    const params = useParams();
    const router = useRouter();
    const serverId = params?.id as string;

    const [ramToAdd, setRamToAdd] = useState(0); // GB
    const [cpuToAdd, setCpuToAdd] = useState(0); // Cores
    const [file, setFile] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [serverName, setServerName] = useState("Loading...");

    const RAM_PRICE_PER_GB = 200;
    const CPU_PRICE_PER_CORE = 280;

    const totalPrice = (ramToAdd * RAM_PRICE_PER_GB) + (cpuToAdd * CPU_PRICE_PER_CORE);

    useEffect(() => {
        if (serverId) {
            fetch(`/api/panel/servers/${serverId}`)
                .then(res => res.json())
                .then(data => {
                    if (data.server) setServerName(data.server.name);
                })
                .catch(() => { });
        }
    }, [serverId]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError("");
        }
    };

    const handleCheckout = async () => {
        if (totalPrice === 0) {
            setError("Please select at least one resource to upgrade.");
            return;
        }
        if (!file) {
            setError("Please upload a payment receipt to continue.");
            return;
        }

        setSubmitting(true);
        setError("");

        try {
            const formData = new FormData();
            formData.append("receipt", file);
            formData.append("type", "UPGRADE");
            formData.append("serverId", serverId);
            formData.append("addMemory", (ramToAdd * 1024).toString());
            formData.append("addCpu", (cpuToAdd * 100).toString());

            const res = await fetch("/api/orders", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to submit upgrade order");
            }

            setSuccess(true);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (success) {
        return (
            <div className="p-8 max-w-3xl mx-auto text-center mt-16 animate-in fade-in zoom-in duration-500">
                <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
                    <FileCheck size={40} />
                </div>
                <h1 className="text-3xl font-bold text-white mb-4">Upgrade Order Submitted!</h1>
                <p className="text-white/60 text-lg mb-8">
                    Your resource upgrade request for <span className="text-white font-bold">{serverName}</span> has been received. Our team will verify the payment and apply the extra resources shortly.
                </p>
                <button
                    onClick={() => router.push(`/dashboard/server/${serverId}`)}
                    className="inline-flex bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg active:scale-95"
                >
                    Return to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto font-sans text-white">
            <Link href={`/dashboard/server/${serverId}`} className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors mb-8 font-semibold text-sm group">
                <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Terminal
            </Link>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-3xl font-bold">Resource Upgrade</h1>
                        <div className="bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border border-amber-500/20">
                            Upgrade Mode
                        </div>
                    </div>
                    <p className="text-white/50">Enhance your server performance with additional RAM and CPU cores.</p>
                </div>
                <div className="bg-[#121935] border border-white/5 px-6 py-4 rounded-2xl flex items-center gap-4">
                    <div className="h-10 w-10 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center">
                        <Zap size={20} />
                    </div>
                    <div>
                        <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Target Server</div>
                        <div className="text-sm font-bold truncate max-w-[150px]">{serverName}</div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Resource Selectors */}
                <div className="lg:col-span-2 space-y-6">
                    {/* RAM Selector */}
                    <div className="bg-[#121935] border border-white/5 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <MemoryStick size={120} />
                        </div>
                        <div className="relative z-10">
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 bg-indigo-500/10 text-indigo-400 rounded-xl flex items-center justify-center">
                                        <MemoryStick size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold">Additional RAM</h3>
                                        <p className="text-[11px] text-white/40">RS {RAM_PRICE_PER_GB} per 1GB monthly</p>
                                    </div>
                                </div>
                                <div className="text-2xl font-black text-indigo-400">+{ramToAdd} GB</div>
                            </div>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setRamToAdd(prev => Math.max(0, prev - 1))}
                                    className="h-12 w-full md:w-16 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center transition-all border border-white/5 active:scale-95"
                                >
                                    <Minus size={20} />
                                </button>
                                <div className="flex-1 h-3 bg-black/40 rounded-full relative">
                                    <div
                                        className="absolute inset-y-0 left-0 bg-indigo-500 rounded-full transition-all duration-300"
                                        style={{ width: `${(ramToAdd / 16) * 100}%` }}
                                    />
                                </div>
                                <button
                                    onClick={() => setRamToAdd(prev => Math.min(16, prev + 1))}
                                    className="h-12 w-full md:w-16 bg-indigo-600 hover:bg-indigo-500 rounded-xl flex items-center justify-center transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
                                >
                                    <Plus size={20} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* CPU Selector */}
                    <div className="bg-[#121935] border border-white/5 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <Cpu size={120} />
                        </div>
                        <div className="relative z-10">
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center">
                                        <Cpu size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold">Additional CPU</h3>
                                        <p className="text-[11px] text-white/40">RS {CPU_PRICE_PER_CORE} per 1 Core monthly</p>
                                    </div>
                                </div>
                                <div className="text-2xl font-black text-blue-400">+{cpuToAdd} Core</div>
                            </div>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setCpuToAdd(prev => Math.max(0, prev - 1))}
                                    className="h-12 w-full md:w-16 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center transition-all border border-white/5 active:scale-95"
                                >
                                    <Minus size={20} />
                                </button>
                                <div className="flex-1 h-3 bg-black/40 rounded-full relative">
                                    <div
                                        className="absolute inset-y-0 left-0 bg-blue-500 rounded-full transition-all duration-300"
                                        style={{ width: `${(cpuToAdd / 8) * 100}%` }}
                                    />
                                </div>
                                <button
                                    onClick={() => setCpuToAdd(prev => Math.min(8, prev + 1))}
                                    className="h-12 w-full md:w-16 bg-blue-600 hover:bg-blue-500 rounded-xl flex items-center justify-center transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                                >
                                    <Plus size={20} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Payment Info */}
                    <div className="bg-[#121935] border border-white/5 rounded-2xl p-6 shadow-xl">
                        <h2 className="text-lg font-bold mb-4 border-b border-white/5 pb-4 flex items-center gap-2">
                            <CreditCard size={18} className="text-emerald-400" /> Payment Instructions
                        </h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                            <div className="bg-black/30 border border-white/5 p-4 rounded-xl">
                                <div className="flex items-center gap-2 text-blue-400 mb-3 font-semibold text-sm uppercase tracking-wider">
                                    <Building size={14} /> Bank
                                </div>
                                <div className="text-xs space-y-1.5 text-white/70">
                                    <div><span className="text-white/30">Bank:</span> NDB Bank Gampaha</div>
                                    <div><span className="text-white/30">Name:</span> M.P.W.wijerathna</div>
                                    <div className="font-mono text-white bg-white/5 p-1 rounded mt-1">115512117084</div>
                                </div>
                            </div>

                            <div className="bg-black/30 border border-white/5 p-4 rounded-xl">
                                <div className="flex items-center gap-2 text-orange-400 mb-3 font-semibold text-sm uppercase tracking-wider">
                                    <Smartphone size={14} /> ezCash
                                </div>
                                <div className="text-xs space-y-1.5 text-white/70">
                                    <div><span className="text-white/30">Provider:</span> Dialog ezCash</div>
                                    <div className="font-mono text-white bg-white/5 p-1 rounded mt-1">0762578944</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-[#121935] border border-white/5 rounded-2xl p-6">
                            <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                                <UploadCloud size={16} className="text-blue-400" /> Upload Receipt
                            </h3>
                            <label className="border-2 border-dashed border-white/5 hover:border-blue-500/30 bg-black/20 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all">
                                <UploadCloud size={24} className="text-white/20 mb-2" />
                                <span className="text-xs font-bold mb-0.5">{file ? file.name : "Select Receipt"}</span>
                                <span className="text-[10px] text-white/30">{file ? `(${(file.size / 1024 / 1024).toFixed(2)} MB)` : "JPG/PNG/PDF"}</span>
                                <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileChange} />
                            </label>
                        </div>
                    </div>
                </div>

                {/* Summary & Checkout */}
                <div className="lg:col-span-1">
                    <div className="bg-[#0b0f24] border border-blue-500/20 rounded-2xl p-6 shadow-2xl sticky top-8">
                        <h2 className="text-xl font-bold mb-8">Upgrade Summary</h2>

                        <div className="space-y-6 mb-8">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 bg-indigo-500/10 text-indigo-400 rounded-lg flex items-center justify-center">
                                        <MemoryStick size={16} />
                                    </div>
                                    <span className="text-sm font-medium text-white/60">RAM Add-on</span>
                                </div>
                                <span className="font-bold">RS {ramToAdd * RAM_PRICE_PER_GB}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 bg-blue-500/10 text-blue-400 rounded-lg flex items-center justify-center">
                                        <Cpu size={16} />
                                    </div>
                                    <span className="text-sm font-medium text-white/60">CPU Add-on</span>
                                </div>
                                <span className="font-bold">RS {cpuToAdd * CPU_PRICE_PER_CORE}</span>
                            </div>
                        </div>

                        <div className="h-px bg-white/5 mb-8" />

                        <div className="flex justify-between items-end mb-10">
                            <div>
                                <div className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-1">Total Due</div>
                                <div className="text-sm text-white/40">Monthly Recurring</div>
                            </div>
                            <div className="text-4xl font-black text-emerald-400">RS {totalPrice}</div>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] p-3 rounded-xl mb-6">
                                {error}
                            </div>
                        )}

                        <button
                            onClick={handleCheckout}
                            disabled={submitting || totalPrice === 0}
                            className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-xl active:scale-95 ${submitting || totalPrice === 0
                                    ? "bg-white/5 text-white/20 cursor-not-allowed border border-white/5"
                                    : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/10"
                                }`}
                        >
                            {submitting ? "Processing..." : "Confirm Upgrade"}
                            <ArrowRight size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
