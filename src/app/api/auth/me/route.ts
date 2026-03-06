import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("auth_token")?.value;

        if (!token) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const payload = await verifyToken(token);

        if (!payload) {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        }

        const dbUser = await prisma.user.findUnique({
            where: { id: payload.id as string },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                pteroUserId: true,
                createdAt: true,
            }
        });

        if (!dbUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // SYNC: Update role from Pterodactyl
        const { syncUserRole } = await import("@/lib/ptero");
        const user = await syncUserRole(dbUser);

        return NextResponse.json({ 
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                createdAt: user.createdAt
            } 
        }, { status: 200 });
    } catch (error) {
        console.error("Me API Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
