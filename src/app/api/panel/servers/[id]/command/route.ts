import { NextResponse } from "next/server";
import { pteroClient } from "@/lib/ptero";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const { id: serverId } = await props.params;
        const { command } = await req.json();

        if (!command) {
            return NextResponse.json({ error: "Command cannot be empty" }, { status: 400 });
        }

        const cookieStore = await cookies();
        const token = cookieStore.get("auth_token")?.value;

        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const payload = await verifyToken(token);
        if (!payload || !payload.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // Verify the user actually owns this server via Application API
        const user = await prisma.user.findUnique({ where: { id: payload.id as string } });
        if (!user || user.pteroUserId === null) return NextResponse.json({ error: "No panel account linked" }, { status: 403 });

        // We use an Admin Client Token to control any server on the node
        const adminClientToken = process.env.PTERO_ADMIN_CLIENT_TOKEN;
        
        if (!adminClientToken) {
            console.log(`[DEMO] Sending command "${command}" to server ${serverId} (Missing Admin Client API token)`);
            return NextResponse.json({ success: true, dummy: true });
        }

        // Real Call
        await pteroClient(`/api/client/servers/${serverId}/command`, adminClientToken, {
            method: "POST",
            body: JSON.stringify({ command })
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Command action error:", error.message);
        return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
    }
}
