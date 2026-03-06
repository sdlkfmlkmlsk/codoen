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

        const schedules = await pteroClient(`/api/client/servers/${serverId}/schedules`, adminClientToken);

        return NextResponse.json({
            schedules: schedules.data.map((s: any) => ({
                id: s.attributes.id,
                name: s.attributes.name,
                is_active: s.attributes.is_active,
                is_processing: s.attributes.is_processing,
                last_run_at: s.attributes.last_run_at,
                next_run_at: s.attributes.next_run_at,
                cron: s.attributes.cron,
            }))
        });

    } catch (error: any) {
        console.error("Schedules list error:", error.message);
        return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
    }
}
