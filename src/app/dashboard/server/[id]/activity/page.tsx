"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Clock, User, Shield, Info, Activity as ActivityIcon, Settings } from "lucide-react";

export default function ActivityPage() {
    const params = useParams();
    const serverId = params?.id as string;
    const [activities, setActivities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (serverId) fetchActivity();
    }, [serverId]);

    const fetchActivity = async () => {
        try {
            const res = await fetch(`/api/panel/servers/${serverId}/activity/list`);
            const json = await res.json();
            setActivities(json.data || []);
        } catch (err) {
            console.error("Failed to fetch activity logs:", err);
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
        const diffInMinutes = Math.floor(diffInSeconds / 60);
        if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours} hours ago`;
        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) return `${diffInDays} days ago`;

        return date.toLocaleDateString();
    };

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center bg-[#060813]">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
            </div>
        );
    }

    const getEventIcon = (event: string) => {
        if (event.includes('power')) return <ActivityIcon size={14} />;
        if (event.includes('file')) return <Shield size={14} />; // Using generic for now
        if (event.includes('subuser')) return <User size={14} />;
        if (event.includes('settings')) return <Settings size={14} />;
        return <Info size={14} />;
    };

    return (
        <div className="p-6 md:p-12 flex flex-col h-full bg-[#060813] text-white font-sans max-w-[1400px] mx-auto overflow-y-auto">
            <h1 className="text-2xl font-bold mb-8">Activity</h1>

            <div className="space-y-3">
                {activities.length === 0 ? (
                    <div className="bg-[#121935] border border-dashed border-white/10 rounded-2xl p-12 text-center">
                        <ActivityIcon size={48} className="mx-auto text-white/10 mb-4" />
                        <p className="text-white/40 font-medium">No activity logs found for this server.</p>
                    </div>
                ) : (
                    activities.map((a, index) => (
                        <div key={a.id} className="bg-[#121935]/80 border border-white/5 rounded-xl p-5 flex items-start gap-4 hover:border-white/10 transition-all relative group">
                            {/* Orange Avatar Circle */}
                            <div className="shrink-0 pt-0.5">
                                <div className="h-10 w-10 bg-[#FF9800] rounded-full flex items-center justify-center border-4 border-white/5 shadow-lg shadow-orange-500/20">
                                    <div className="text-white/80">
                                        <User size={22} fill="currentColor" strokeWidth={0} />
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1.5">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[13px] font-bold text-white/90">{a.actor.name}</span>
                                        <span className="text-white/20">—</span>
                                        <span className="text-[12px] font-mono text-blue-400 opacity-80">{a.event}</span>
                                    </div>
                                    <div className="bg-white/5 p-1.5 rounded-md text-white/20 group-hover:text-white/40 transition-colors">
                                        {getEventIcon(a.event)}
                                    </div>
                                </div>

                                <p className="text-[13px] text-white/50 leading-relaxed mb-2.5 font-medium">
                                    {a.description ? a.description : 'Performed an action on the server'}
                                </p>

                                <div className="flex items-center gap-2.5 text-[10px] font-bold text-white/15 uppercase tracking-widest">
                                    <span>{a.ip}</span>
                                    <span className="h-1 w-1 bg-white/5 rounded-full" />
                                    <span>{formatTime(a.timestamp)}</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
