import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { sendDirectMessage } from "@/lib/discord";

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { userId, serverName, serverId } = body;

        if (!userId) {
            return NextResponse.json({ error: "User ID is required" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user || !(user as any).discordId) {
            return NextResponse.json({ error: "User does not have a linked Discord ID" }, { status: 400 });
        }

        const embed = {
            title: "⚠️ Server Expired Notice",
            description: `Hello ${user.name}, \n\nYour server ** ${serverName || "Unnamed Server"}** (ID: ${serverId || "Unknown"}) has expired.\n\nPlease renew your subscription to prevent your data from being deleted permanently.If you need any assistance, please open a support ticket.`,
            color: 0xFF4444, // Red
            footer: {
                text: "Codeon Hosting"
            },
            timestamp: new Date().toISOString()
        };

        const success = await sendDirectMessage((user as any).discordId, [embed]);

        if (!success) {
            return NextResponse.json({ error: "Failed to send Discord message via Bot API" }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Error sending expiry notice:", error.message);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
