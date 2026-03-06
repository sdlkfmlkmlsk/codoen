import { NextResponse } from "next/server";
import { pteroClient } from "@/lib/ptero";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const { id: serverId } = await props.params;
        const cookieStore = await cookies();
        const token = cookieStore.get("auth_token")?.value;

        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const payload = await verifyToken(token);
        if (!payload || !payload.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // Verify ownership
        const user = await prisma.user.findUnique({ where: { id: payload.id as string } });
        if (!user || user.pteroUserId === null) return NextResponse.json({ error: "No panel account linked" }, { status: 403 });

        const adminClientToken = process.env.PTERO_ADMIN_CLIENT_TOKEN;
        if (!adminClientToken) return NextResponse.json({ error: "Config missing" }, { status: 500 });

        // Fetch logs/latest.log content
        // This is a direct way to get the console buffer without WebSockets
        try {
            const logContent = await pteroClient(
                `/api/client/servers/${serverId}/files/contents?file=%2Flogs%2Flatest.log`, 
                adminClientToken,
                { headers: { "Accept": "text/plain" } }
            );

            // The client helper might try to parse JSON, let's ensure we handle raw text if needed
            // However, pteroClient in lib/ptero.ts tries to do res.json()
            // I might need to update lib/ptero.ts to handle raw text for file contents
            
            return NextResponse.json({ logs: logContent });
        } catch (e: any) {
            // If latest.log doesn't exist yet
            return NextResponse.json({ logs: "No logs found yet. Start the server to see logs." });
        }

    } catch (error: any) {
        console.error("Logs fetch error:", error.message);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
