"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Info, X, AlertTriangle } from "lucide-react";

export function AlertBanner() {
    const [alerts, setAlerts] = useState<any[]>([]);

    useEffect(() => {
        const fetchAlerts = async () => {
            try {
                const res = await fetch("/api/user/alerts");
                const data = await res.json();
                if (data.alerts) setAlerts(data.alerts);
            } catch (e) { }
        };

        fetchAlerts();
        // Poll every 10 seconds for new warnings
        const interval = setInterval(fetchAlerts, 10000);
        return () => clearInterval(interval);
    }, []);

    const dismissAlert = async (id: string) => {
        try {
            await fetch("/api/user/alerts", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ alertId: id })
            });
            setAlerts(prev => prev.filter(a => a.id !== id));
        } catch (e) { }
    };

    if (alerts.length === 0) return null;

    return (
        <div className="w-full flex flex-col gap-3 mb-6 animate-in slide-in-from-top duration-500 relative z-[100]">
            {alerts.map((alert) => {
                let styles = "bg-blue-600/10 border-blue-500/20 text-blue-400";
                let Icon = Info;

                if (alert.type === 'CRITICAL') {
                    styles = "bg-red-600/20 border-red-500/30 text-red-500 animate-pulse";
                    Icon = AlertCircle;
                } else if (alert.type === 'WARNING') {
                    styles = "bg-amber-600/10 border-amber-500/20 text-amber-500";
                    Icon = AlertTriangle;
                }

                return (
                    <div
                        key={alert.id}
                        className={`p-4 rounded-xl border flex items-start gap-4 shadow-lg backdrop-blur-md ${styles}`}
                    >
                        <div className="mt-0.5"><Icon size={20} /></div>
                        <div className="flex-1">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-0.5">ADMIN MESSAGE</h4>
                            <p className="text-sm font-semibold">{alert.message}</p>
                        </div>
                        <button
                            onClick={() => dismissAlert(alert.id)}
                            className="text-current opacity-40 hover:opacity-100 transition-opacity"
                        >
                            <X size={18} />
                        </button>
                    </div>
                );
            })}
        </div>
    );
}
