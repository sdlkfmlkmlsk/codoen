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

        const backups = await pteroClient(`/api/client/servers/${serverId}/backups`, adminClientToken);

        return NextResponse.json({
            backups: backups.data.map((b: any) => ({
                uuid: b.attributes.uuid,
                name: b.attributes.name,
                sha1: b.attributes.sha1_hash,
                bytes: b.attributes.bytes,
                created_at: b.attributes.created_at,
                is_locked: b.attributes.is_locked,
                is_successful: b.attributes.is_successful,
            })),
            meta: backups.meta
        });

    } catch (error: any) {
        console.error("Backups list error:", error.message);
        return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
    }
}
