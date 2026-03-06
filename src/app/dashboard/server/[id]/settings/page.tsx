"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Settings, Shield, Info, Copy, CheckCircle2, RotateCcw, Save, Globe, Server, Hash } from "lucide-react";

export default function SettingsPage() {
    const params = useParams();
    const serverId = params?.id as string;
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [reinstalling, setReinstalling] = useState(false);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [copied, setCopied] = useState<string | null>(null);

    useEffect(() => {
        if (serverId) fetchSettings();
    }, [serverId]);

    const fetchSettings = async () => {
        try {
            const res = await fetch(`/api/panel/servers/${serverId}/settings/get`);
            const settingsData = await res.json();
            setData(settingsData);
            setName(settingsData.name || "");
            setDescription(settingsData.description || "");
        } catch (err) {
            console.error("Failed to fetch settings:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch(`/api/panel/servers/${serverId}/settings/rename`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, description })
            });
            if (res.ok) fetchSettings();
            else alert("Failed to save changes");
        } catch (err) {
            alert("Failed to save changes");
        } finally {
            setSaving(false);
        }
    };

    const handleReinstall = async () => {
        if (!confirm("Your server will stop, and the installation script will be rerun. Some files may be deleted or modified. Are you sure you want to continue?")) return;
        setReinstalling(true);
        try {
            const res = await fetch(`/api/panel/servers/${serverId}/settings/reinstall`, {
                method: "POST"
            });
            if (res.ok) alert("Reinstallation started!");
            else alert("Failed to start reinstallation");
        } catch (err) {
            alert("Failed to start reinstallation");
        } finally {
            setReinstalling(false);
        }
    };

    const copyToClipboard = (text: string, type: string) => {
        navigator.clipboard.writeText(text);
        setCopied(type);
        setTimeout(() => setCopied(null), 2000);
    };

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center bg-[#060813]">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
            </div>
        );
    }

    const sftpUrl = `sftp://${data?.sftp?.ip}:${data?.sftp?.port}`;

    return (
        <div className="p-6 md:p-12 flex flex-col h-full bg-[#060813] text-white font-sans max-w-[1400px] mx-auto overflow-y-auto">
            <h1 className="text-2xl font-bold mb-8">Settings</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* SFTP Details Card */}
                <div className="bg-[#121935] border border-white/5 rounded-2xl p-6 flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                        <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">SFTP Details</div>
                        <Globe size={14} className="text-white/20" />
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Server Address</label>
                            <div className="relative group">
                                <input
                                    readOnly
                                    value={sftpUrl}
                                    className="w-full bg-[#0a0f25] border border-white/5 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none"
                                />
                                <button
                                    onClick={() => copyToClipboard(sftpUrl, 'address')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-white/5 rounded-lg transition-colors text-white/40 hover:text-white"
                                >
                                    {copied === 'address' ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Copy size={16} />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Username</label>
                            <div className="relative group">
                                <input
                                    readOnly
                                    value={`${data?.identifier}.${data?.identifier}`} // SFTP usernames are usually this format or data.identifier
                                    className="w-full bg-[#0a0f25] border border-white/5 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none"
                                />
                                <button
                                    onClick={() => copyToClipboard(`${data?.identifier}.${data?.identifier}`, 'user')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-white/5 rounded-lg transition-colors text-white/40 hover:text-white"
                                >
                                    {copied === 'user' ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Copy size={16} />}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-blue-600/5 border border-blue-600/10 rounded-xl p-4 flex items-start gap-3">
                        <Info size={16} className="text-blue-400 mt-0.5 shrink-0" />
                        <p className="text-[11px] text-white/40 leading-relaxed italic">
                            Your SFTP password is the same as the password you use to access this panel.
                        </p>
                    </div>

                    <button className="w-fit px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2">
                        Launch SFTP
                    </button>
                </div>

                {/* Change Server Details Card */}
                <form onSubmit={handleSave} className="bg-[#121935] border border-white/5 rounded-2xl p-6 flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                        <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Change Server Details</div>
                        <Settings size={14} className="text-white/20" />
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Server Name</label>
                            <input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="My Amazing Server"
                                className="w-full bg-[#0a0f25] border border-white/5 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-blue-500 transition-all font-sans"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Server Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Write something about your server..."
                                rows={4}
                                className="w-full bg-[#0a0f25] border border-white/5 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-blue-500 transition-all resize-none"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-8 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 flex items-center gap-2"
                        >
                            {saving ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Save size={14} />}
                            Save
                        </button>
                    </div>
                </form>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-12">
                {/* Debug Information Card */}
                <div className="bg-[#121935] border border-white/5 rounded-2xl p-6 flex flex-col gap-6 h-fit">
                    <div className="flex items-center justify-between">
                        <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Debug Information</div>
                        <Info size={14} className="text-white/20" />
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-[#0a0f25] rounded-xl border border-white/5">
                            <span className="text-xs font-bold text-white/60">Node</span>
                            <span className="text-[10px] font-bold bg-white/5 px-3 py-1 rounded-full text-white/80 uppercase tracking-widest">{data?.node}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-[#0a0f25] rounded-xl border border-white/5">
                            <span className="text-xs font-bold text-white/60">Server ID</span>
                            <span className="text-[10px] font-mono text-white/40">{data?.uuid}</span>
                        </div>
                    </div>
                </div>

                {/* Reinstall Server Card */}
                <div className="bg-[#121935] border border-white/5 rounded-2xl p-6 flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                        <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Reinstall Server</div>
                        <RotateCcw size={14} className="text-white/20" />
                    </div>

                    <div className="space-y-4">
                        <p className="text-xs text-white/40 leading-relaxed italic">
                            Reinstalling your server will stop it, and then re-run the installation script that initially set it up. <span className="text-red-500 font-bold">Some files may be deleted or modified during this process, please back up your data before continuing.</span>
                        </p>

                        <div className="flex justify-end pt-2">
                            <button
                                onClick={handleReinstall}
                                disabled={reinstalling}
                                className="px-8 py-2.5 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white rounded-lg text-xs font-bold transition-all border border-red-500/20 flex items-center gap-2"
                            >
                                {reinstalling ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-500 border-t-transparent" /> : <RotateCcw size={14} />}
                                Reinstall Server
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
