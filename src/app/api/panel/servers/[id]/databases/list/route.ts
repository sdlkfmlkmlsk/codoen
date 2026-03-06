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

        const databases = await pteroClient(`/api/client/servers/${serverId}/databases?include=password`, adminClientToken);

        return NextResponse.json({
            databases: databases.data.map((db: any) => ({
                id: db.attributes.id,
                name: db.attributes.name,
                username: db.attributes.username,
                host: db.attributes.host,
                connections_from: db.attributes.connections_from,
                password: db.attributes.relationships?.password?.attributes?.password || null
            }))
        });

    } catch (error: any) {
        console.error("Databases list error:", error.message);
        return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
    }
}
