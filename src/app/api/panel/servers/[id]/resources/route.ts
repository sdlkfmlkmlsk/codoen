import { NextResponse } from "next/server";
import { pteroClient, checkServerAccess } from "@/lib/ptero";

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const { id: serverId } = await props.params;

        const { errorResponse } = await checkServerAccess(serverId);
        if (errorResponse) return errorResponse;

        // We use an Admin Client Token to fetch stats for any server
        const adminClientToken = process.env.PTERO_ADMIN_CLIENT_TOKEN;
        
        if (!adminClientToken) {
            return NextResponse.json({
                error: "No Admin Client API Token configured. Cannot fetch real stats/console."
            }, { status: 403 });
        }

        // Fetch Server Status & Stats (Client API)
        const stats = await pteroClient(`/api/client/servers/${serverId}/resources`, adminClientToken);
        const attr = stats.attributes;

        return NextResponse.json({ 
            stats: {
                status: attr.current_state,
                ...attr.resources
            } 
        });

    } catch (error: any) {
        console.error("Resources fetch error:", error.message);
        return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
    }
}
