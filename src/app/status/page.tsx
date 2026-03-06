"use client";

import { Activity, Globe, Server, Shield, Wifi, Heart } from "lucide-react";
import Link from "next/link";

export default function StatusPage() {
    // Generate mock uptime bars
    const renderUptimeBars = (status: 'perfect' | 'degraded') => {
        const bars = [];
        for (let i = 0; i < 45; i++) {
            let color = "bg-green-500";
            if (status === 'degraded' && i > 30 && i < 35 && Math.random() > 0.5) {
                color = "bg-yellow-500";
            }
            bars.push(
                <div key={i} className={`w-1.5 h-6 rounded-sm ${color} opacity-80 hover:opacity-100 transition-opacity`}></div>
            );
        }
        return (
            <div className="flex items-center gap-1">
                {bars}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[#070b14] text-white font-sans selection:bg-blue-500/30">
            {/* Header Area */}
            <div className="pt-16 pb-12 flex flex-col items-center justify-center text-center">
                <Link href="/" className="mb-6 opacity-80 hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="font-bold tracking-wide text-2xl text-white">CODEON <span className="text-blue-400">HOSTING</span></span>
                </Link>
                <h1 className="text-3xl font-bold tracking-tight mb-2">System Status</h1>
                <p className="text-gray-400 text-sm">Monitor the operational status of all our services</p>

                <div className="mt-8 flex items-center gap-3 text-xs font-medium">
                    <span className="text-gray-400 mr-2">History Period</span>
                    <button className="bg-blue-600/20 text-blue-400 border border-blue-500/30 px-4 py-1.5 rounded-md hover:bg-blue-600/30 transition-colors">Custom</button>
                    <button className="bg-white/5 text-gray-400 border border-white/10 px-4 py-1.5 rounded-md hover:bg-white/10 transition-colors">90 Days</button>
                    <div className="bg-white/5 border border-white/10 px-4 py-1.5 rounded-md text-gray-400">
                        Days: <span className="text-white">31</span>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 pb-24 space-y-6">

                {/* Status Alert */}
                <div className="bg-[#0f172a]/50 border-l-2 border-orange-500 rounded-r-lg p-5 border-y border-r border-[#1e293b]">
                    <h2 className="text-lg font-semibold text-gray-200">Systems Degraded</h2>
                    <p className="text-sm text-gray-400 mt-1">Some services experienced issues recently.</p>
                </div>

                {/* Section 1: Websites & Panels */}
                <div className="bg-[#0b1120] border border-[#1e293b] rounded-lg overflow-hidden">
                    <div className="px-5 py-4 border-b border-[#1e293b] bg-[#0f172a]/40">
                        <h2 className="text-base font-bold text-gray-200">1. Website & Control Panels</h2>
                    </div>
                    <div className="divide-y divide-[#1e293b]/50">
                        {/* Dashboard */}
                        <div className="px-5 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors">
                            <div className="flex items-center gap-4">
                                <span className="text-xs font-mono text-green-400 bg-green-400/10 px-2 py-0.5 rounded border border-green-400/20">100.0%</span>
                                <Globe size={18} className="text-gray-400" />
                                <div>
                                    <div className="text-sm font-semibold text-gray-200">Control Panel</div>
                                    <div className="text-xs text-gray-500">Last checked: 1 minute ago</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 overflow-hidden">
                                {renderUptimeBars('perfect')}
                                <Heart size={14} className="text-green-500 shrink-0 ml-1" />
                            </div>
                        </div>

                        {/* Main Website */}
                        <div className="px-5 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors">
                            <div className="flex items-center gap-4">
                                <span className="text-xs font-mono text-green-400 bg-green-400/10 px-2 py-0.5 rounded border border-green-400/20">99.9%</span>
                                <Globe size={18} className="text-gray-400" />
                                <div>
                                    <div className="text-sm font-semibold text-gray-200">Main Website</div>
                                    <a href="https://www.codeon.codes" target="_blank" rel="noreferrer" className="text-[11px] text-blue-400 hover:underline">https://www.codeon.codes</a>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 overflow-hidden">
                                {renderUptimeBars('degraded')}
                                <Heart size={14} className="text-green-500 shrink-0 ml-1" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section 2: Hosting Nodes */}
                <div className="bg-[#0b1120] border border-[#1e293b] rounded-lg overflow-hidden">
                    <div className="px-5 py-4 border-b border-[#1e293b] bg-[#0f172a]/40">
                        <h2 className="text-base font-bold text-gray-200">2. Hosting Servers</h2>
                    </div>
                    <div className="divide-y divide-[#1e293b]/50">

                        {/* SG1 */}
                        <div className="px-5 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors">
                            <div className="flex items-center gap-4">
                                <span className="text-xs font-mono text-green-400 bg-green-400/10 px-2 py-0.5 rounded border border-green-400/20">99.1%</span>
                                <Server size={18} className="text-gray-400" />
                                <div>
                                    <div className="text-sm font-semibold text-gray-200">SG1 VPS</div>
                                    <div className="text-xs text-gray-500">Singapore Node</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 overflow-hidden">
                                {renderUptimeBars('degraded')}
                                <Heart size={14} className="text-green-500 shrink-0 ml-1" />
                            </div>
                        </div>

                        {/* SG2 */}
                        <div className="px-5 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors">
                            <div className="flex items-center gap-4">
                                <span className="text-xs font-mono text-green-400 bg-green-400/10 px-2 py-0.5 rounded border border-green-400/20">100.0%</span>
                                <Server size={18} className="text-gray-400" />
                                <div>
                                    <div className="text-sm font-semibold text-gray-200">SG2 VPS</div>
                                    <div className="text-xs text-gray-500">Singapore Node</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 overflow-hidden">
                                {renderUptimeBars('perfect')}
                                <Heart size={14} className="text-green-500 shrink-0 ml-1" />
                            </div>
                        </div>

                        {/* SG4 */}
                        <div className="px-5 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors">
                            <div className="flex items-center gap-4">
                                <span className="text-xs font-mono text-green-400 bg-green-400/10 px-2 py-0.5 rounded border border-green-400/20">100.0%</span>
                                <Server size={18} className="text-gray-400" />
                                <div>
                                    <div className="text-sm font-semibold text-gray-200">SG4 (Premium)</div>
                                    <div className="text-xs text-gray-500">Singapore Performance Node</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 overflow-hidden">
                                {renderUptimeBars('perfect')}
                                <Heart size={14} className="text-green-500 shrink-0 ml-1" />
                            </div>
                        </div>

                        {/* Dedicated */}
                        <div className="px-5 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors">
                            <div className="flex items-center gap-4">
                                <span className="text-xs font-mono text-green-400 bg-green-400/10 px-2 py-0.5 rounded border border-green-400/20">100.0%</span>
                                <Server size={18} className="text-gray-400" />
                                <div>
                                    <div className="text-sm font-semibold text-gray-200">Dedicated Server</div>
                                    <div className="text-xs text-gray-500">Bare Metal</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 overflow-hidden">
                                {renderUptimeBars('perfect')}
                                <Heart size={14} className="text-green-500 shrink-0 ml-1" />
                            </div>
                        </div>

                        {/* IN1 */}
                        <div className="px-5 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors">
                            <div className="flex items-center gap-4">
                                <span className="text-xs font-mono text-green-400 bg-green-400/10 px-2 py-0.5 rounded border border-green-400/20">100.0%</span>
                                <Server size={18} className="text-gray-400" />
                                <div>
                                    <div className="text-sm font-semibold text-gray-200">IN1</div>
                                    <div className="text-xs text-gray-500">India Node</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 overflow-hidden">
                                {renderUptimeBars('perfect')}
                                <Heart size={14} className="text-green-500 shrink-0 ml-1" />
                            </div>
                        </div>

                        {/* EU1 */}
                        <div className="px-5 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors">
                            <div className="flex items-center gap-4">
                                <span className="text-xs font-mono text-green-400 bg-green-400/10 px-2 py-0.5 rounded border border-green-400/20">100.0%</span>
                                <Server size={18} className="text-gray-400" />
                                <div>
                                    <div className="text-sm font-semibold text-gray-200">EU1</div>
                                    <div className="text-xs text-gray-500">Europe Node</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 overflow-hidden">
                                {renderUptimeBars('perfect')}
                                <Heart size={14} className="text-green-500 shrink-0 ml-1" />
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
}
