"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Server, Cpu, HardDrive, MemoryStick, ChevronRight, Check, Shield, Headset } from "lucide-react";

const plans = [
    // Entry Level
    { id: "plan_entry_1gb", category: "Entry Level", name: "1GB RAM", price: 300, memory: 1024, cpu: 100, disk: 10000 },
    { id: "plan_entry_2gb", category: "Entry Level", name: "2GB RAM", price: 600, memory: 2048, cpu: 100, disk: 10000 },
    { id: "plan_entry_4gb", category: "Entry Level", name: "4GB RAM", price: 1200, memory: 4096, cpu: 100, disk: 20000 },
    // Professional
    { id: "plan_pro_6gb", category: "Professional", name: "6GB RAM", price: 1600, memory: 6144, cpu: 100, disk: 20000 },
    { id: "plan_pro_8gb", category: "Professional", name: "8GB RAM", price: 1800, memory: 8192, cpu: 100, disk: 30000 },
    { id: "plan_pro_12gb", category: "Professional", name: "12GB RAM", price: 2800, memory: 12288, cpu: 160, disk: 40000 },
    // Extreme
    { id: "plan_extreme_16gb", category: "Extreme", name: "16GB RAM", price: 3600, memory: 16384, cpu: 160, disk: 60000 },
    { id: "plan_extreme_20gb", category: "Extreme", name: "20GB RAM", price: 6800, memory: 20480, cpu: 280, disk: 80000 },
    { id: "plan_extreme_24gb", category: "Extreme", name: "24GB RAM", price: 7800, memory: 24576, cpu: 280, disk: 100000 },
    // Network
    { id: "plan_net_38gb", category: "Network", name: "38GB RAM", price: 12000, memory: 38912, cpu: 280, disk: 150000 },
    { id: "plan_net_48gb", category: "Network", name: "48GB RAM", price: 24000, memory: 49152, cpu: 280, disk: 200000 },
];

export default function OrderPage() {
    const router = useRouter();

    const groupedPlans = plans.reduce((acc, plan) => {
        if (!acc[plan.category]) acc[plan.category] = [];
        acc[plan.category].push(plan);
        return acc;
    }, {} as Record<string, typeof plans>);

    return (
        <div className="p-8 max-w-7xl mx-auto font-sans text-white">
            <div className="mb-12 text-center">
                <h1 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
                    <span className="text-4xl">🎮</span> CODEON HOSTING <span className="text-blue-400">|</span> Minecraft Solutions
                </h1>
                <p className="text-white/60 max-w-2xl mx-auto text-lg">
                    Experience lag-free gaming with our high-performance Minecraft hosting. Powered by AMD processors and protected by enterprise-grade DDoS protection!
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16 max-w-5xl mx-auto bg-blue-900/10 p-6 rounded-2xl border border-blue-500/20">
                <div className="flex flex-col items-center text-center gap-2">
                    <div className="h-10 w-10 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center"><Cpu size={20} /></div>
                    <span className="font-semibold text-sm">AMD CPU</span>
                    <span className="text-xs text-white/50">High Clock Speeds</span>
                </div>
                <div className="flex flex-col items-center text-center gap-2">
                    <div className="h-10 w-10 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center"><Shield size={20} /></div>
                    <span className="font-semibold text-sm">4TB DDoS Protection</span>
                    <span className="text-xs text-white/50">Stay Online Always</span>
                </div>
                <div className="flex flex-col items-center text-center gap-2">
                    <div className="h-10 w-10 bg-orange-500/20 text-orange-400 rounded-full flex items-center justify-center"><HardDrive size={20} /></div>
                    <span className="font-semibold text-sm">NVMe Storage</span>
                    <span className="text-xs text-white/50">Lightning Fast Loads</span>
                </div>
                <div className="flex flex-col items-center text-center gap-2">
                    <div className="h-10 w-10 bg-purple-500/20 text-purple-400 rounded-full flex items-center justify-center"><Headset size={20} /></div>
                    <span className="font-semibold text-sm">24/7 Support</span>
                    <span className="text-xs text-white/50">Sri Lankan Based Staff</span>
                </div>
            </div>

            {Object.entries(groupedPlans).map(([category, categoryPlans]) => (
                <div key={category} className="mb-16">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="h-px bg-white/10 flex-1"></div>
                        <h2 className="text-2xl font-bold tracking-wider uppercase text-white/80">
                            {category === "Entry Level" && "📦"}
                            {category === "Professional" && "🚀"}
                            {category === "Extreme" && "⚡"}
                            {category === "Network" && "🌐"}
                            <span className="ml-3">{category} Plans</span>
                        </h2>
                        <div className="h-px bg-white/10 flex-1"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {categoryPlans.map((p) => (
                            <div key={p.id} className="bg-[#121935] border border-white/5 hover:border-blue-500/50 rounded-2xl p-6 shadow-xl relative overflow-hidden group transition-all">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all">
                                    <Server size={100} />
                                </div>

                                <h3 className="text-xl font-bold mb-6 text-white">{p.name}</h3>

                                <div className="flex items-baseline gap-1 mb-8">
                                    <span className="text-sm font-semibold text-white/40 uppercase tracking-widest mr-1">RS</span>
                                    <span className="text-4xl font-black text-blue-400">{p.price}</span>
                                    <span className="text-sm font-semibold text-white/40 uppercase tracking-widest ml-1">/mo</span>
                                </div>

                                <div className="space-y-4 mb-8">
                                    <div className="flex items-center gap-3 text-sm font-medium text-white/80">
                                        <MemoryStick size={16} className="text-emerald-400" />
                                        {p.memory / 1024} GB RAM
                                    </div>
                                    <div className="flex items-center gap-3 text-sm font-medium text-white/80">
                                        <Cpu size={16} className="text-blue-400" />
                                        AMD Processors
                                    </div>
                                    <div className="flex items-center gap-3 text-sm font-medium text-white/80">
                                        <HardDrive size={16} className="text-orange-400" />
                                        NVMe Storage
                                    </div>
                                    <div className="flex items-center gap-3 text-sm font-medium text-white/80">
                                        <Check size={16} className="text-blue-400" />
                                        4TB DDoS Protection
                                    </div>
                                </div>

                                <button
                                    onClick={() => router.push(`/dashboard/order/${p.id}`)}
                                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg flex justify-center items-center gap-2"
                                >
                                    Select Plan <ChevronRight size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
