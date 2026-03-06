import { NextResponse } from "next/server";
import { pteroClient } from "@/lib/ptero";
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

        const adminClientToken = process.env.PTERO_ADMIN_CLIENT_TOKEN;
        if (!adminClientToken) return NextResponse.json({ error: "No Admin Client API Token configured." }, { status: 403 });

        const activity = await pteroClient(`/api/client/servers/${serverId}/activity?include=actor`, adminClientToken);

        return NextResponse.json({
            data: activity.data.map((a: any) => ({
                id: a.attributes.id,
                batch: a.attributes.batch,
                event: a.attributes.event,
                ip: a.attributes.ip,
                description: a.attributes.description,
                timestamp: a.attributes.timestamp,
                actor: {
                    name: a.attributes.relationships?.actor?.attributes?.username || "System",
                    email: a.attributes.relationships?.actor?.attributes?.email || ""
                }
            })),
            meta: activity.meta
        });

    } catch (error: any) {
        console.error("Activity fetch error:", error.message);
        return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
    }
}
