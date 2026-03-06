import { NextResponse } from "next/server";
import { pteroClient, checkServerAccess } from "@/lib/ptero";

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const { id: serverId } = await props.params;
        const { action, username } = await req.json();

        if (!action || !username) {
            return NextResponse.json({ error: "Missing action or username" }, { status: 400 });
        }

        // Security Check
        const { errorResponse } = await checkServerAccess(serverId);
        if (errorResponse) return errorResponse;

        const adminClientToken = process.env.PTERO_ADMIN_CLIENT_TOKEN;
        if (!adminClientToken) {
            return NextResponse.json({ error: "Missing Admin Client Token" }, { status: 500 });
        }

        let command = "";
        switch (action) {
            case "op":
                command = `op ${username}`;
                break;
            case "deop":
                command = `deop ${username}`;
                break;
            case "ban":
                command = `ban ${username}`;
                break;
            case "unban":
                command = `pardon ${username}`;
                break;
            case "kick":
                command = `kick ${username}`;
                break;
            case "whitelist_add":
                command = `whitelist add ${username}`;
                break;
            case "whitelist_remove":
                command = `whitelist remove ${username}`;
                break;
            default:
                return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }

        await pteroClient(`/api/client/servers/${serverId}/command`, adminClientToken, {
            method: "POST",
            body: JSON.stringify({ command }),
        });

        return NextResponse.json({ success: true, message: `Command sent: ${command}` });

    } catch (error: any) {
        console.error("Player Action Error:", error.message);
        return NextResponse.json({ error: error.message || "Failed to execute" }, { status: 500 });
    }
}
