"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Search, AlertTriangle } from "lucide-react";

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchOrders = () => {
        fetch("/api/admin/orders")
            .then(res => res.json())
            .then(data => {
                if (data.error) setError(data.error);
                else setOrders(data.orders || []);
                setLoading(false);
            })
            .catch(() => {
                setError("Failed to fetch orders");
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const handleAction = async (id: string, status: "APPROVED" | "REJECTED") => {
        if (!confirm(`Are you sure you want to mark this order as ${status}?`)) return;

        try {
            const res = await fetch(`/api/admin/orders/${id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status })
            });
            const data = await res.json();

            if (res.ok) {
                fetchOrders();
            } else {
                alert(`Action failed: ${data.error || 'Unknown error'}`);
            }
        } catch (e) {
            alert("Network error");
        }
    };

    if (loading) return <div className="p-8 flex justify-center"><div className="w-8 h-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" /></div>;

    if (error) {
        return (
            <div className="p-8 max-w-4xl mx-auto h-[50vh] flex flex-col items-center justify-center text-center font-sans">
                <AlertTriangle size={48} className="text-red-500 mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
                <p className="text-white/50">{error}</p>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-6xl mx-auto font-sans text-white">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Manage Orders</h1>
                    <p className="text-white/50 mt-1">Review manual payments and activate subscriptions</p>
                </div>

                <div className="relative w-64">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                    <input
                        type="text"
                        placeholder="Search Transaction ID..."
                        className="w-full bg-[#121935] border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-blue-500/50 transition-all font-mono"
                    />
                </div>
            </div>

            <div className="bg-[#121935] border border-white/5 rounded-xl shadow-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-black/20 border-b border-white/5">
                            <th className="p-4 text-xs font-bold text-white/40 uppercase tracking-widest leading-none">Order / Receipt</th>
                            <th className="p-4 text-xs font-bold text-white/40 uppercase tracking-widest leading-none">Customer</th>
                            <th className="p-4 text-xs font-bold text-white/40 uppercase tracking-widest leading-none">Plan</th>
                            <th className="p-4 text-xs font-bold text-white/40 uppercase tracking-widest leading-none">Date</th>
                            <th className="p-4 text-xs font-bold text-white/40 uppercase tracking-widest leading-none text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {orders.length === 0 ? (
                            <tr><td colSpan={5} className="p-8 text-center text-white/50">No orders found.</td></tr>
                        ) : orders.map((order) => (
                            <tr key={order.id} className="hover:bg-white/5 transition-colors">
                                <td className="p-4">
                                    <div className="text-sm font-mono text-white/80">#{order.id.slice(-8).toUpperCase()}</div>
                                    {order.transactionId && <div className="text-xs font-mono text-blue-400 mt-1">{order.transactionId}</div>}
                                    {order.receiptImage && (
                                        <a href={order.receiptImage} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:text-white mt-1 inline-flex items-center gap-1 border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 rounded">
                                            View Receipt
                                        </a>
                                    )}
                                </td>
                                <td className="p-4">
                                    <div className="text-sm font-semibold">{order.user?.name || "Unknown"}</div>
                                    <div className="text-xs text-white/40">{order.user?.email}</div>
                                </td>
                                <td className="p-4">
                                    <div className="text-sm font-bold">{order.plan?.name}</div>
                                    <div className="text-xs text-emerald-400">${order.plan?.price}</div>
                                </td>
                                <td className="p-4 text-sm text-white/60">{new Date(order.createdAt).toLocaleDateString()}</td>
                                <td className="p-4 text-right">
                                    {order.status === "PENDING" ? (
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleAction(order.id, "APPROVED")}
                                                className="bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-emerald-500/20 px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
                                            >
                                                <CheckCircle2 size={14} /> Approve
                                            </button>
                                            <button
                                                onClick={() => handleAction(order.id, "REJECTED")}
                                                className="bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
                                            >
                                                <XCircle size={14} /> Reject
                                            </button>
                                        </div>
                                    ) : (
                                        <span className={`text-xs font-bold px-3 py-1.5 rounded-lg border ${order.status === "APPROVED" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>
                                            {order.status}
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div >
    );
}
