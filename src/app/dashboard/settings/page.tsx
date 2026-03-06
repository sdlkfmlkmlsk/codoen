"use client";

import { useState, useEffect } from "react";
import { Save, User, MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";

export default function UserSettingsPage() {
    const [discordId, setDiscordId] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ text: "", type: "" });
    const router = useRouter();

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch("/api/user/settings");
                if (res.ok) {
                    const data = await res.json();
                    if (data.discordId) {
                        setDiscordId(data.discordId);
                    }
                }
            } catch (error) {
                console.error("Failed to load settings:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ text: "", type: "" });

        try {
            const res = await fetch("/api/user/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ discordId }),
            });

            if (res.ok) {
                setMessage({ text: "Settings saved successfully", type: "success" });
                router.refresh();
            } else {
                const data = await res.json();
                setMessage({ text: data.error || "Failed to save settings", type: "error" });
            }
        } catch (error) {
            setMessage({ text: "An error occurred", type: "error" });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-white/50">Loading settings...</div>;
    }

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-white mb-2">Account Settings</h1>
            <p className="text-white/50 mb-8">Manage your account preferences and integrations</p>

            <div className="bg-[#0B1021]/50 border border-white/10 rounded-xl overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-white/5 flex items-center gap-3">
                    <User className="text-blue-400" />
                    <h2 className="text-lg font-semibold text-white">Profile Integrations</h2>
                </div>

                <div className="p-6 text-sm text-white/70 mb-4 bg-blue-500/10 border border-blue-500/20 m-6 rounded-lg flex gap-3">
                    <MessageSquare className="text-blue-400 shrink-0 mt-0.5" size={18} />
                    <div>
                        <strong className="text-white block mb-1">Why connect Discord?</strong>
                        Linking your Discord User ID allows administrators to send you direct messages regarding server expirations, billing updates, or important support notices straight to your Discord account.
                    </div>
                </div>

                <form onSubmit={handleSave} className="p-6 pt-0 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-white/80 mb-2">Discord User ID</label>
                        <input
                            type="text"
                            value={discordId}
                            onChange={(e) => setDiscordId(e.target.value)}
                            placeholder="e.g. 1479143277293867229"
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/30 outline-none focus:border-blue-500/50 transition-all font-mono text-sm"
                        />
                        <p className="text-xs text-white/40 mt-2">
                            You can find your Discord User ID by right-clicking your profile inside Discord (Developer Mode must be enabled).
                        </p>
                    </div>

                    {message.text && (
                        <div className={`p-4 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                            {message.text}
                        </div>
                    )}

                    <div className="flex justify-end pt-4 border-t border-white/5">
                        <button
                            type="submit"
                            disabled={saving}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-lg ${saving ? 'bg-blue-600/50 text-white/50 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white hover:-translate-y-0.5 hover:shadow-blue-500/25'}`}
                        >
                            <Save size={16} />
                            {saving ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
