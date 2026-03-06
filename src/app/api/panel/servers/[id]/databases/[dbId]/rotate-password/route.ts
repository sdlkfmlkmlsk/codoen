import { NextResponse } from "next/server";
import { pteroClient } from "@/lib/ptero";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(req: Request, props: { params: Promise<{ id: string, dbId: string }> }) {
    try {
        const { id: serverId, dbId } = await props.params;

        const cookieStore = await cookies();
        const token = cookieStore.get("auth_token")?.value;

        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const payload = await verifyToken(token);
        if (!payload || !payload.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const adminClientToken = process.env.PTERO_ADMIN_CLIENT_TOKEN;
        if (!adminClientToken) return NextResponse.json({ error: "No Admin Client API Token configured." }, { status: 403 });

        const data = await pteroClient(`/api/client/servers/${serverId}/databases/${dbId}/rotate-password`, adminClientToken, {
            method: "POST"
        });

        return NextResponse.json({ password: data.attributes.relationships?.password?.attributes?.password });

    } catch (error: any) {
        console.error("Database rotate password error:", error.message);
        return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
    }
}
