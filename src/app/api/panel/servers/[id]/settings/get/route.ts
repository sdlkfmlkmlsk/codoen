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

        const server = await pteroClient(`/api/client/servers/${serverId}`, adminClientToken);

        return NextResponse.json({
            name: server.attributes.name,
            description: server.attributes.description,
            uuid: server.attributes.uuid,
            node: server.attributes.node,
            sftp: {
                ip: server.attributes.sftp_details.ip,
                port: server.attributes.sftp_details.port,
                user: server.attributes.relationships.variables?.data?.[0]?.attributes?.env_variable === "SFTP_USER" ? server.attributes.relationships.variables.data[0].attributes.server_value : server.attributes.identifier // Defaulting or fetching username
            },
            // Pterodactyl usually provides current user's sftp username in the response or it's server_identifier
            identifier: server.attributes.identifier
        });

    } catch (error: any) {
        console.error("Settings fetch error:", error.message);
        return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
    }
}
