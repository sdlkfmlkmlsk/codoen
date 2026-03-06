import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { generateToken } from "@/lib/auth";

export async function POST(req: Request) {
    try {
        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Find user
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }

        // Verify password
        const isPasswordValid = await verifyPassword(password, user.password);

        if (!isPasswordValid) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }

        // Generate token
        const token = await generateToken({ id: user.id, email: user.email, role: user.role });

        // Set cookie
        const response = NextResponse.json(
            { message: "Logged in successfully", user: { id: user.id, name: user.name, email: user.email } },
            { status: 200 }
        );

        response.cookies.set({
            name: "auth_token",
            value: token,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24, // 24 hours
            path: "/",
        });

        // Notify Discord if Admin
        if (user.role === 'ADMIN') {
            try {
                const forwarded = req.headers.get("x-forwarded-for");
                const ip = forwarded ? forwarded.split(",")[0] : "127.0.0.1";
                const { notifyAdminLogin } = await import("@/lib/discord");
                await notifyAdminLogin(user.name, user.email, ip);
            } catch (discordErr) {
                console.error("Admin login notification failed:", discordErr);
            }
        }

        return response;
        console.error("Login Error:", error);
        return NextResponse.json({ 
            error: "Internal server error", 
            details: error instanceof Error ? error.message : String(error) 
        }, { status: 500 });
}
