"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";

const DiscordIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 127.14 96.36">
        <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.31,60,73.31,53s5-12.74,11.43-12.74S96.2,46,96.12,53,91.08,65.69,84.69,65.69Z" />
    </svg>
);

export default function AuthPage() {
    const [mode, setMode] = useState<"login" | "register">("login");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        if (mode === "register" && password !== confirmPassword) {
            setError("Passwords do not match");
            setLoading(false);
            return;
        }

        try {
            const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
            const payload = mode === "login" ? { email, password } : { name, email, password };

            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok) {
                const errorMessage = data.details ? `${data.error}: ${data.details}` : (data.error || "Something went wrong");
                throw new Error(errorMessage);
            }

            if (mode === "login") {
                router.push("/dashboard");
            } else {
                // Automatically switch to login after successful registration
                setMode("login");
                setError("");
                setPassword("");
                setConfirmPassword("");
                alert("Registration successful! Please login.");
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen relative overflow-hidden bg-slate-950 text-white flex flex-col font-sans">
            {/* Background Effects */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: "url('/bg.png')" }}
            >
                <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px]" />
                {/* Subtle glowing orbs to match the requested premium style */}
                <div className="absolute top-1/4 left-1/4 h-[400px] w-[400px] rounded-full bg-blue-600/10 blur-[100px] animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 h-[500px] w-[500px] rounded-full bg-indigo-600/10 blur-[120px]" />
            </div>

            {/* Top bar */}
            <div className="relative z-10 flex items-center justify-between px-6 py-5">
                <div className="flex items-center gap-3 font-semibold text-lg tracking-wide">
                    <span>CODEON <span className="text-blue-400">HOSTING</span></span>
                </div>

                <div className="flex items-center gap-2">
                    <a className="rounded-lg bg-white/5 px-4 py-2 text-sm font-medium hover:bg-white/10 transition-colors border border-white/5 flex items-center gap-2" href="#">
                        <DiscordIcon />
                        Discord
                    </a>
                    <a className="rounded-lg bg-white/5 px-4 py-2 text-sm font-medium hover:bg-white/10 transition-colors border border-white/5 flex items-center gap-2" href="/status">
                        <Heart size={16} fill="currentColor" className="text-red-500" />
                        Status
                    </a>
                    <button className="rounded-lg bg-white/5 px-4 py-2 text-sm font-medium hover:bg-white/10 transition-colors border border-white/5 ml-2">
                        EN
                    </button>
                </div>
            </div>

            {/* Center card */}
            <div className="relative z-10 flex flex-1 items-center justify-center px-4 py-12">
                <div className="w-full max-w-[420px] rounded-2xl border border-white/10 bg-[#0f1525]/80 p-8 shadow-2xl backdrop-blur-xl">
                    <h1 className="text-center text-2xl font-bold tracking-tight">Login to Continue</h1>

                    {/* Mode switch */}
                    <div className="mt-8 grid grid-cols-2 rounded-xl bg-black/40 p-1 border border-white/5">
                        <button
                            onClick={() => { setMode("login"); setError(""); }}
                            className={`rounded-lg py-2.5 text-sm font-medium transition-all ${mode === "login" ? "bg-white/10 shadow-sm" : "text-white/60 hover:text-white hover:bg-white/5"
                                }`}
                        >
                            Login
                        </button>
                        <button
                            onClick={() => { setMode("register"); setError(""); }}
                            className={`rounded-lg py-2.5 text-sm font-medium transition-all ${mode === "register" ? "bg-white/10 shadow-sm" : "text-white/60 hover:text-white hover:bg-white/5"
                                }`}
                        >
                            Register
                        </button>
                    </div>

                    {error && (
                        <div className="mt-6 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400 text-center">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="mt-6 space-y-4 relative">
                        {mode === "register" && (
                            <div>
                                <label className="text-[11px] font-bold text-white/50 tracking-wider">FULL NAME</label>
                                <input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-blue-500/50 focus:bg-black/60 transition-all text-sm placeholder:text-white/20"
                                    placeholder="John Doe"
                                />
                            </div>
                        )}

                        <div>
                            <label className="text-[11px] font-bold text-white/50 tracking-wider">USERNAME OR EMAIL</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-blue-500/50 focus:bg-black/60 transition-all text-sm placeholder:text-white/20"
                                placeholder="demo@yourdomain.com"
                            />
                        </div>

                        <div>
                            <label className="text-[11px] font-bold text-white/50 tracking-wider">PASSWORD</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-blue-500/50 focus:bg-black/60 transition-all text-sm placeholder:text-white/20"
                                placeholder="••••••••"
                            />
                        </div>

                        {mode === "register" && (
                            <div>
                                <label className="text-[11px] font-bold text-white/50 tracking-wider">CONFIRM PASSWORD</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-blue-500/50 focus:bg-black/60 transition-all text-sm placeholder:text-white/20"
                                    placeholder="••••••••"
                                />
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-6 w-full rounded-xl bg-blue-600/90 hover:bg-blue-500 py-3.5 text-sm font-semibold tracking-wide transition-all shadow-lg shadow-blue-900/40 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? "PLEASE WAIT..." : mode === "login" ? "LOGIN" : "CREATE ACCOUNT"}
                        </button>

                        {mode === "login" && (
                            <div className="pt-4 text-center text-[13px] text-white/50">
                                <a className="hover:text-white transition-colors" href="#">
                                    Forgot password?
                                </a>
                            </div>
                        )}
                    </form>

                    <div className="mt-8 text-center text-[11px] font-medium tracking-wide text-white/30">
                        CODEON® © 2024 - 2026
                    </div>
                </div>
            </div>
        </div>
    );
}
