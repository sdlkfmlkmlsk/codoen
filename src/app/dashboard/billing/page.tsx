"use client";

import { useEffect, useState } from "react";
import { Receipt, Clock, CheckCircle2, XCircle } from "lucide-react";

export default function BillingPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/orders/mine")
            .then(res => res.json())
            .then(data => {
                if (data.orders) setOrders(data.orders);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "PENDING":
                return <span className="bg-orange-500/10 text-orange-400 border border-orange-500/20 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 w-max"><Clock size={14} /> Pending Review</span>;
            case "APPROVED":
                return <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 w-max"><CheckCircle2 size={14} /> Active</span>;
            case "REJECTED":
                return <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 w-max"><XCircle size={14} /> Rejected</span>;
            default:
                return null;
        }
    };

    if (loading) return <div className="p-8 flex justify-center"><div className="w-8 h-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" /></div>;

    return (
        <div className="p-8 max-w-6xl mx-auto font-sans text-white">
            <h1 className="text-3xl font-bold mb-8">Billing & Orders</h1>

            {orders.length === 0 ? (
                <div className="bg-[#121935] border border-white/5 rounded-2xl p-12 flex flex-col items-center justify-center text-center shadow-xl">
                    <div className="h-20 w-20 rounded-full bg-white/5 flex items-center justify-center text-white/20 mb-4">
                        <Receipt size={32} />
                    </div>
                    <h2 className="text-xl font-bold mb-2">No active orders</h2>
                    <p className="text-white/50 max-w-sm mb-6">You don't have any pending or active server subscriptions yet.</p>
                    <a href="/dashboard/order" className="bg-blue-600 hover:bg-blue-500 px-6 py-2.5 rounded-lg text-sm font-bold transition-colors">Order a Server</a>
                </div>
            ) : (
                <div className="bg-[#121935] border border-white/5 rounded-xl shadow-xl overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-black/20 border-b border-white/5">
                                <th className="p-4 text-xs font-bold text-white/40 uppercase tracking-widest leading-none">Order ID</th>
                                <th className="p-4 text-xs font-bold text-white/40 uppercase tracking-widest leading-none">Plan</th>
                                <th className="p-4 text-xs font-bold text-white/40 uppercase tracking-widest leading-none">Date</th>
                                <th className="p-4 text-xs font-bold text-white/40 uppercase tracking-widest leading-none">Tx ID</th>
                                <th className="p-4 text-xs font-bold text-white/40 uppercase tracking-widest leading-none">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {orders.map((order) => (
                                <tr key={order.id} className="hover:bg-white/5 transition-colors">
                                    <td className="p-4 font-mono text-sm text-white/60">#{order.id.slice(-8).toUpperCase()}</td>
                                    <td className="p-4">
                                        <div className="font-bold flex items-center gap-2">
                                            {order.plan?.name || "Unknown Plan"} 
                                            <span className="text-xs text-white/40 font-normal">(${order.plan?.price}/mo)</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-sm text-white/60">{new Date(order.createdAt).toLocaleDateString()}</td>
                                    <td className="p-4 font-mono text-sm text-blue-400">{order.transactionId || "N/A"}</td>
                                    <td className="p-4">{getStatusBadge(order.status)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
