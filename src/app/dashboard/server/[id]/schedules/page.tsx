"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Calendar, Clock, Play, Trash2, Plus, CheckCircle2, XCircle, MoreVertical } from "lucide-react";

export default function SchedulesPage() {
    const params = useParams();
    const serverId = params?.id as string;
    const [schedules, setSchedules] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [creating, setCreating] = useState(false);

    // Form state
    const [name, setName] = useState("");
    const [minute, setMinute] = useState("*");
    const [hour, setHour] = useState("*");
    const [dayOfMonth, setDayOfMonth] = useState("*");
    const [month, setMonth] = useState("*");
    const [dayOfWeek, setDayOfWeek] = useState("*");
    const [isActive, setIsActive] = useState(true);

    useEffect(() => {
        if (serverId) fetchSchedules();
    }, [serverId]);

    const fetchSchedules = async () => {
        try {
            const res = await fetch(`/api/panel/servers/${serverId}/schedules/list`);
            const data = await res.json();
            setSchedules(data.schedules || []);
        } catch (err) {
            console.error("Failed to fetch schedules:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (scheduleId: number) => {
        if (!confirm("Are you sure you want to delete this schedule?")) return;
        try {
            await fetch(`/api/panel/servers/${serverId}/schedules/${scheduleId}/delete`, {
                method: "DELETE"
            });
            fetchSchedules();
        } catch (err) {
            alert("Failed to delete schedule");
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!serverId || !name) return;

        // Cron range validation logic
        const validateRange = (val: string, min: number, max: number, label: string) => {
            if (val === "*") return true;
            const n = parseInt(val);
            if (isNaN(n) || n < min || n > max) {
                alert(`Invalid ${label}: Must be between ${min} and ${max} or *`);
                return false;
            }
            return true;
        };

        if (!validateRange(minute, 0, 59, "Minute")) return;
        if (!validateRange(hour, 0, 23, "Hour")) return;
        if (!validateRange(dayOfMonth, 1, 31, "Day of Month")) return;
        if (!validateRange(month, 1, 12, "Month")) return;
        if (!validateRange(dayOfWeek, 0, 6, "Day of Week")) return;

        setCreating(true);
        try {
            const res = await fetch(`/api/panel/servers/${serverId}/schedules/create`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    is_active: isActive,
                    minute,
                    hour,
                    day_of_month: dayOfMonth,
                    month,
                    day_of_week: dayOfWeek
                })
            });

            if (res.ok) {
                setIsModalOpen(false);
                resetForm();
                fetchSchedules();
            } else {
                const error = await res.json();
                alert(error.details || "Failed to create schedule");
            }
        } catch (err) {
            console.error(err);
            alert("An error occurred while creating the schedule");
        } finally {
            setCreating(false);
        }
    };

    const resetForm = () => {
        setName("");
        setMinute("*");
        setHour("*");
        setDayOfMonth("*");
        setMonth("*");
        setDayOfWeek("*");
        setIsActive(true);
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return "never";
        const date = new Date(dateStr);
        return date.toLocaleString();
    };

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center bg-[#060813]">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="p-6 md:p-12 flex flex-col h-full bg-[#060813] text-white font-sans max-w-[1400px] mx-auto">
            <h1 className="text-2xl font-bold mb-8">Schedules</h1>

            <div className="flex flex-col gap-4 mb-8">
                {schedules.length === 0 ? (
                    <div className="bg-[#121935] border border-dashed border-white/10 rounded-2xl p-12 text-center">
                        <Calendar size={48} className="mx-auto text-white/10 mb-4" />
                        <p className="text-white/40">No schedules found for this server.</p>
                    </div>
                ) : (
                    schedules.map((s) => (
                        <div key={s.id} className="bg-[#121935] border border-white/5 rounded-xl p-5 flex items-center justify-between group hover:bg-[#161d3f] transition-all">
                            <div className="flex items-center gap-4 flex-1">
                                <div className="bg-blue-600/20 p-2.5 rounded-lg text-blue-400">
                                    <Calendar size={20} />
                                </div>
                                <div className="min-w-[150px]">
                                    <div className="text-sm font-bold text-white mb-0.5">{s.name}</div>
                                    <div className="text-[10px] text-white/30 uppercase tracking-wider font-bold">Last run at: {formatDate(s.last_run_at)}</div>
                                </div>
                            </div>

                            <div className="flex items-center gap-10 flex-[2] px-8">
                                <div className="flex flex-col items-center">
                                    <div className="text-sm font-bold text-white/90">{s.cron.minute}</div>
                                    <div className="text-[10px] text-white/30 uppercase tracking-wider font-bold">Minute</div>
                                </div>
                                <div className="flex flex-col items-center">
                                    <div className="text-sm font-bold text-white/90">{s.cron.hour}</div>
                                    <div className="text-[10px] text-white/30 uppercase tracking-wider font-bold">Hour</div>
                                </div>
                                <div className="flex flex-col items-center">
                                    <div className="text-sm font-bold text-white/90">{s.cron.day_of_month}</div>
                                    <div className="text-[10px] text-white/30 uppercase tracking-wider font-bold">Day of Month</div>
                                </div>
                                <div className="flex flex-col items-center">
                                    <div className="text-sm font-bold text-white/90">{s.cron.month}</div>
                                    <div className="text-[10px] text-white/30 uppercase tracking-wider font-bold">Month</div>
                                </div>
                                <div className="flex flex-col items-center">
                                    <div className="text-sm font-bold text-white/90">{s.cron.day_of_week}</div>
                                    <div className="text-[10px] text-white/30 uppercase tracking-wider font-bold">Day of Week</div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${s.is_active ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]' : 'bg-white/5 text-white/40'}`}>
                                    {s.is_active ? 'Active' : 'Inactive'}
                                </div>
                                <button
                                    onClick={() => handleDelete(s.id)}
                                    className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="mt-auto flex justify-end pt-8">
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-600/20"
                >
                    <Plus size={18} />
                    Create schedule
                </button>
            </div>

            {/* Create Schedule Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-[#0a0f25] border border-white/10 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-white/5 flex justify-between items-center">
                            <h2 className="text-xl font-bold">Create New Schedule</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-white/40 hover:text-white transition-colors">&times;</button>
                        </div>

                        <form onSubmit={handleCreate} className="p-6 space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">Schedule Name</label>
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Backup Database"
                                    className="w-full bg-[#121935] border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                                />
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Minute</label>
                                    <input placeholder="0-59" value={minute} onChange={(e) => setMinute(e.target.value)} className="w-full bg-[#121935] border border-white/5 rounded-lg px-3 py-2 text-sm text-center font-mono focus:outline-none focus:border-blue-500" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Hour</label>
                                    <input placeholder="0-23" value={hour} onChange={(e) => setHour(e.target.value)} className="w-full bg-[#121935] border border-white/5 rounded-lg px-3 py-2 text-sm text-center font-mono focus:outline-none focus:border-blue-500" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Day (Mo)</label>
                                    <input placeholder="1-31" value={dayOfMonth} onChange={(e) => setDayOfMonth(e.target.value)} className="w-full bg-[#121935] border border-white/5 rounded-lg px-3 py-2 text-sm text-center font-mono focus:outline-none focus:border-blue-500" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Month</label>
                                    <input placeholder="1-12" value={month} onChange={(e) => setMonth(e.target.value)} className="w-full bg-[#121935] border border-white/5 rounded-lg px-3 py-2 text-sm text-center font-mono focus:outline-none focus:border-blue-500" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Day (Wk)</label>
                                    <input placeholder="0-6" value={dayOfWeek} onChange={(e) => setDayOfWeek(e.target.value)} className="w-full bg-[#121935] border border-white/5 rounded-lg px-3 py-2 text-sm text-center font-mono focus:outline-none focus:border-blue-500" />
                                </div>
                            </div>

                            <p className="text-[10px] text-white/20 italic pl-1 leading-relaxed">
                                Use * for every interval. Range: Minutes (0-59), Hours (0-23), Day of Month (1-31), Month (1-12), Day of Week (0-6).
                            </p>

                            <div className="flex items-center gap-3 bg-[#121935] p-3 rounded-xl border border-white/5 cursor-pointer" onClick={() => setIsActive(!isActive)}>
                                <div className={`w-10 h-5 rounded-full relative transition-colors ${isActive ? 'bg-emerald-500' : 'bg-white/10'}`}>
                                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isActive ? 'right-1' : 'left-1'}`}></div>
                                </div>
                                <span className="text-sm font-semibold">Enable Schedule</span>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-bold transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="flex-3 px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {creating && <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
                                    Create Schedule
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
