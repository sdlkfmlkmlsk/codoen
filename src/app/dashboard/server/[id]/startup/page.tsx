"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Power, Terminal, Box, Save, CheckCircle2, ChevronDown } from "lucide-react";

export default function StartupPage() {
    const params = useParams();
    const serverId = params?.id as string;
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [saved, setSaved] = useState<string | null>(null);

    useEffect(() => {
        if (serverId) fetchStartup();
    }, [serverId]);

    const fetchStartup = async () => {
        try {
            const res = await fetch(`/api/panel/servers/${serverId}/startup/get`);
            const startupData = await res.json();
            setData(startupData);
        } catch (err) {
            console.error("Failed to fetch startup settings:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleVariableUpdate = async (key: string, value: string) => {
        setSaving(key);
        try {
            const res = await fetch(`/api/panel/servers/${serverId}/startup/variable`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ key, value })
            });
            if (res.ok) {
                setSaved(key);
                setTimeout(() => setSaved(null), 3000);
                fetchStartup();
            } else {
                const error = await res.json();
                alert(error.details || "Failed to update variable");
            }
        } catch (err) {
            alert("Failed to update variable");
        } finally {
            setSaving(null);
        }
    };

    const handleImageUpdate = async (image: string) => {
        setSaving("docker_image");
        try {
            const res = await fetch(`/api/panel/servers/${serverId}/startup/image`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ docker_image: image })
            });
            if (res.ok) {
                setSaved("docker_image");
                setTimeout(() => setSaved(null), 3000);
                fetchStartup();
            } else {
                const error = await res.json();
                alert(error.details || "Failed to update docker image");
            }
        } catch (err) {
            alert("Failed to update docker image");
        } finally {
            setSaving(null);
        }
    };

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center bg-[#060813]">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="p-6 md:p-12 flex flex-col h-full bg-[#060813] text-white font-sans max-w-[1400px] mx-auto overflow-y-auto">
            <h1 className="text-2xl font-bold mb-8">Startup</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Startup Command Card */}
                <div className="bg-[#121935] border border-white/5 rounded-2xl p-6 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Startup Command</div>
                        <Terminal size={14} className="text-white/20" />
                    </div>
                    <div className="bg-[#0a0f25] border border-white/5 rounded-xl p-4 font-mono text-xs text-blue-400 leading-relaxed min-h-[100px] break-all">
                        {data?.startup_command}
                    </div>
                </div>

                {/* Docker Image Card */}
                <div className="bg-[#121935] border border-white/5 rounded-2xl p-6 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Docker Image</div>
                        <Box size={14} className="text-white/20" />
                    </div>
                    <div className="relative group">
                        <select
                            value={data?.docker_image || (data?.docker_images ? Object.values(data.docker_images)[0] : "")}
                            onChange={(e) => handleImageUpdate(e.target.value)}
                            className="w-full bg-[#0a0f25] border border-white/5 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-blue-500 transition-all appearance-none cursor-pointer"
                        >
                            {Object.entries(data?.docker_images || {}).map(([name, url]) => (
                                <option key={name} value={url as string}>{name}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" size={16} />
                    </div>
                    <p className="text-[10px] text-white/20 italic pl-1 leading-relaxed">
                        This is an advanced feature allowing you to select a Docker image to use when running this server instance.
                    </p>
                    {saved === "docker_image" && (
                        <div className="flex items-center gap-1.5 text-emerald-500 text-[10px] font-bold mt-2">
                            <CheckCircle2 size={12} /> Changes saved successfully!
                        </div>
                    )}
                </div>
            </div>

            <h2 className="text-xl font-bold mb-6 mt-4">Variables</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
                {data?.variables?.map((v: any) => (
                    <div key={v.env_variable} className="bg-[#121935] border border-white/5 rounded-2xl p-6 flex flex-col gap-4 group hover:border-white/10 transition-all">
                        <div className="flex items-center justify-between">
                            <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">{v.name}</div>
                            {saving === v.env_variable ? (
                                <div className="h-3 w-3 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                            ) : saved === v.env_variable ? (
                                <CheckCircle2 size={14} className="text-emerald-500" />
                            ) : null}
                        </div>
                        <input
                            defaultValue={v.server_value}
                            onBlur={(e) => {
                                if (e.target.value !== v.server_value) {
                                    handleVariableUpdate(v.env_variable, e.target.value);
                                }
                            }}
                            className="w-full bg-[#0a0f25] border border-white/5 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-blue-500 transition-all"
                        />
                        <p className="text-[10px] text-white/30 italic pl-1 leading-relaxed opacity-60 group-hover:opacity-100 transition-opacity">
                            {v.description}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}
