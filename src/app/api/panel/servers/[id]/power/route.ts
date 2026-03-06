import { NextResponse } from "next/server";
import { pteroClient, checkServerAccess } from "@/lib/ptero";

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const { id: serverId } = await props.params;
        const { action } = await req.json(); // "start", "stop", "restart", "kill"

        if (!action || !["start", "stop", "restart", "kill"].includes(action)) {
            return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }

        const { errorResponse } = await checkServerAccess(serverId);
        if (errorResponse) return errorResponse;

        // We use an Admin Client Token to control any server on the node
        const adminClientToken = process.env.PTERO_ADMIN_CLIENT_TOKEN;

        if (!adminClientToken) {
            console.log(`[DEMO] Sending power action ${action} to server ${serverId} (Missing Admin Client API token)`);
            return NextResponse.json({ success: true, dummy: true });
        }

        // Real Call
        try {
            await pteroClient(`/api/client/servers/${serverId}/power`, adminClientToken, {
                method: "POST",
                body: JSON.stringify({ signal: action })
            });
            return NextResponse.json({ success: true });
        } catch (err: any) {
            console.error("Ptero Client Power Error:", err.message);
            return NextResponse.json({ error: "Pterodactyl API rejected the request.", details: err.message }, { status: 502 });
        }

    } catch (error: any) {
        console.error("Power action error:", error.message);
        return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
    }
}
