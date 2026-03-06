import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("auth_token")?.value;
        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const decoded = await verifyToken(token);
        if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

        const user = await prisma.user.findUnique({
            where: { id: (decoded as any).id },
            select: { discordId: true } as any
        });

        return NextResponse.json({ discordId: (user as any)?.discordId || "" });
    } catch (error) {
        console.error("Error fetching user settings:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("auth_token")?.value;
        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const decoded = await verifyToken(token);
        if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

        const body = await req.json();

        // Validate that Discord ID is numeric and has reasonable length if provided
        if (body.discordId && !/^\d{17,20}$/.test(body.discordId)) {
            return NextResponse.json({ error: "Invalid Discord ID format" }, { status: 400 });
        }

        await prisma.user.update({
            where: { id: (decoded as any).id },
            data: { discordId: body.discordId || null } as any
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error updating user settings:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
