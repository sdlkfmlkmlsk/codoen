"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { UploadCloud, CreditCard, ShieldCheck, ChevronLeft, Building, Smartphone, FileCheck } from "lucide-react";
import Link from "next/link";

const plans = [
    { id: "plan_entry_1gb", category: "Entry Level", name: "1GB RAM", price: 300, memory: 1024, cpu: 100, disk: 10000 },
    { id: "plan_entry_2gb", category: "Entry Level", name: "2GB RAM", price: 600, memory: 2048, cpu: 100, disk: 10000 },
    { id: "plan_entry_4gb", category: "Entry Level", name: "4GB RAM", price: 1200, memory: 4096, cpu: 100, disk: 20000 },
    { id: "plan_pro_6gb", category: "Professional", name: "6GB RAM", price: 1600, memory: 6144, cpu: 100, disk: 20000 },
    { id: "plan_pro_8gb", category: "Professional", name: "8GB RAM", price: 1800, memory: 8192, cpu: 100, disk: 30000 },
    { id: "plan_pro_12gb", category: "Professional", name: "12GB RAM", price: 2800, memory: 12288, cpu: 160, disk: 40000 },
    { id: "plan_extreme_16gb", category: "Extreme", name: "16GB RAM", price: 3600, memory: 16384, cpu: 160, disk: 60000 },
    { id: "plan_extreme_20gb", category: "Extreme", name: "20GB RAM", price: 6800, memory: 20480, cpu: 280, disk: 80000 },
    { id: "plan_extreme_24gb", category: "Extreme", name: "24GB RAM", price: 7800, memory: 24576, cpu: 280, disk: 100000 },
    { id: "plan_net_38gb", category: "Network", name: "38GB RAM", price: 12000, memory: 38912, cpu: 280, disk: 150000 },
    { id: "plan_net_48gb", category: "Network", name: "48GB RAM", price: 24000, memory: 49152, cpu: 280, disk: 200000 },
];

export default function CheckoutPage() {
    const params = useParams();
    const router = useRouter();
    const planId = typeof params?.id === "string" ? params.id : "";
    const selectedPlan = plans.find(p => p.id === planId);

    const [file, setFile] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    if (!selectedPlan) {
        return (
            <div className="p-8 text-center">
                <h1 className="text-2xl font-bold text-white mb-4">Plan not found</h1>
                <Link href="/dashboard/order" className="text-blue-400 hover:underline">Return to pricing</Link>
            </div>
        );
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError("");
        }
    };

    const handleCheckout = async () => {
        if (!file) {
            setError("Please upload a payment receipt to continue.");
            return;
        }

        setSubmitting(true);
        setError("");

        try {
            const formData = new FormData();
            formData.append("receipt", file);
            formData.append("planId", selectedPlan.id);

            const res = await fetch("/api/orders", {
                method: "POST",
                body: formData, // Sending as multipart/form-data
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to submit order");
            }

            setSuccess(true);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (success) {
        return (
            <div className="p-8 max-w-3xl mx-auto text-center mt-16">
                <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FileCheck size={40} />
                </div>
                <h1 className="text-3xl font-bold text-white mb-4">Order Submitted Successfully!</h1>
                <p className="text-white/60 text-lg mb-8">
                    Your payment receipt has been received. Our team will verify your payment and automatically provision your Minecraft server shortly. You will get a Discord notification once your server is ready.
                </p>
                <Link href="/dashboard" className="inline-flex bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg">
                    Return to Dashboard
                </Link>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-4xl mx-auto font-sans text-white">
            <Link href="/dashboard/order" className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors mb-8 font-semibold text-sm">
                <ChevronLeft size={16} /> Back to Plans
            </Link>

            <div className="flex items-center gap-4 mb-8">
                <div className="h-12 w-12 bg-blue-600/20 text-blue-400 rounded-xl flex items-center justify-center">
                    <CreditCard size={24} />
                </div>
                <div>
                    <h1 className="text-3xl font-bold">Manual Checkout</h1>
                    <p className="text-white/50">Complete your payment to activate this service.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Left Column: Instructions & Upload */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="bg-[#121935] border border-white/5 rounded-2xl p-6 shadow-xl">
                        <h2 className="text-lg font-bold mb-4 border-b border-white/5 pb-4">Payment Instructions</h2>
                        <p className="text-white/70 text-sm mb-6 leading-relaxed">
                            Please transfer the exact amount of <span className="font-bold text-emerald-400">RS {selectedPlan.price}</span> to one of the following accounts. Add your email as the transaction reference if possible.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                            <div className="bg-black/30 border border-white/5 p-4 rounded-xl">
                                <div className="flex items-center gap-2 text-blue-400 mb-3 font-semibold">
                                    <Building size={16} /> Bank Transfer
                                </div>
                                <div className="text-sm space-y-2 text-white/80">
                                    <div><span className="text-white/40 block text-xs">Bank Name:</span> NDB Bank Gampaha</div>
                                    <div><span className="text-white/40 block text-xs">Account Name:</span> M.P.W.wijerathna</div>
                                    <div><span className="text-white/40 block text-xs">Account No:</span> <span className="font-mono text-white bg-white/10 px-1 py-0.5 rounded">115512117084</span></div>
                                </div>
                            </div>

                            <div className="bg-black/30 border border-white/5 p-4 rounded-xl">
                                <div className="flex items-center gap-2 text-orange-400 mb-3 font-semibold">
                                    <Smartphone size={16} /> ezCash Transfer
                                </div>
                                <div className="text-sm space-y-2 text-white/80">
                                    <div><span className="text-white/40 block text-xs">Provider:</span> Dialog ezCash</div>
                                    <div><span className="text-white/40 block text-xs">Mobile No:</span> <span className="font-mono text-white bg-white/10 px-1 py-0.5 rounded">0762578944</span></div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400/90 text-sm p-4 rounded-xl flex items-start gap-3">
                            <ShieldCheck size={20} className="shrink-0 mt-0.5" />
                            <p>After paying, take a screenshot or download the payment receipt. Upload it below, and an Admin will verify and activate your server within minutes.</p>
                        </div>
                    </div>

                    <div className="bg-[#121935] border border-white/5 rounded-2xl p-6 shadow-xl">
                        <h2 className="text-lg font-bold mb-4 border-b border-white/5 pb-4 flex items-center gap-2">
                            <UploadCloud size={18} className="text-blue-400" />
                            Upload Payment Receipt
                        </h2>

                        <label className="border-2 border-dashed border-white/10 hover:border-blue-500/50 bg-black/20 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all text-center">
                            <UploadCloud size={32} className="text-white/30 mb-3" />
                            <span className="text-sm font-semibold mb-1">{file ? file.name : "Click to select receipt image"}</span>
                            <span className="text-xs text-white/40">{file ? `Size: ${(file.size / 1024 / 1024).toFixed(2)} MB` : "JPG, PNG, PDF allowed (Max 5MB)"}</span>
                            <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileChange} />
                        </label>
                    </div>
                </div>

                {/* Right Column: Order Summary */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-[#0A0F25] border border-blue-500/30 rounded-2xl p-6 shadow-xl sticky top-24">
                        <h2 className="text-xl font-bold mb-6">Order Summary</h2>

                        <div className="space-y-4 mb-6 pb-6 border-b border-white/10">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="font-semibold text-white">{selectedPlan.name} Server</div>
                                    <div className="text-xs text-white/50">{selectedPlan.category} Minecraft Plan</div>
                                </div>
                                <div className="font-bold text-white">RS {selectedPlan.price}</div>
                            </div>
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="font-medium text-white/80 text-sm">Setup Fee</div>
                                </div>
                                <div className="font-medium text-emerald-400 text-sm">Free</div>
                            </div>
                        </div>

                        <div className="flex justify-between items-center mb-8">
                            <div className="font-bold text-lg text-white">Total Due</div>
                            <div className="text-3xl font-black text-blue-400">RS {selectedPlan.price}</div>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-4 rounded-xl mb-6">
                                {error}
                            </div>
                        )}

                        <button
                            onClick={handleCheckout}
                            disabled={submitting}
                            className={`w-full font-bold py-3.5 rounded-xl transition-all shadow-lg flex justify-center items-center gap-2 ${submitting ? 'bg-blue-600/50 cursor-not-allowed text-white/50' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
                        >
                            {submitting ? "Uploading Receipt..." : "Submit Order"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
