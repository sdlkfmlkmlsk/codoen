import { NextResponse } from "next/server";
import { pteroClient, checkServerAccess } from "@/lib/ptero";

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const { id: serverId } = await props.params;
        const { searchParams } = new URL(req.url);
        const directory = searchParams.get("directory") || "/";

        const { errorResponse } = await checkServerAccess(serverId);
        if (errorResponse) return errorResponse;

        const adminClientToken = process.env.PTERO_ADMIN_CLIENT_TOKEN;
        if (!adminClientToken) {
            return NextResponse.json({ error: "Missing Admin Client Token" }, { status: 500 });
        }

        // Pterodactyl Client API: GET /api/client/servers/{server}/files/list?directory={directory}
        const filesData = await pteroClient(`/api/client/servers/${serverId}/files/list?directory=${encodeURIComponent(directory)}`, adminClientToken);

        return NextResponse.json(filesData);

    } catch (error: any) {
        console.error("File List Error:", error.message);
        return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
    }
}
