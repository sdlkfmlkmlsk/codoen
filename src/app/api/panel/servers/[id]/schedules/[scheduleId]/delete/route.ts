import { NextResponse } from "next/server";
import { pteroClient } from "@/lib/ptero";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function DELETE(req: Request, props: { params: Promise<{ id: string, scheduleId: string }> }) {
    try {
        const { id: serverId, scheduleId } = await props.params;

        const cookieStore = await cookies();
        const token = cookieStore.get("auth_token")?.value;

        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const payload = await verifyToken(token);
        if (!payload || !payload.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const adminClientToken = process.env.PTERO_ADMIN_CLIENT_TOKEN;
        if (!adminClientToken) return NextResponse.json({ error: "No Admin Client API Token configured." }, { status: 403 });

        await pteroClient(`/api/client/servers/${serverId}/schedules/${scheduleId}`, adminClientToken, {
            method: "DELETE"
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Schedule delete error:", error.message);
        return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
    }
}
