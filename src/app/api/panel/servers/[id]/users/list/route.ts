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

        const subusers = await pteroClient(`/api/client/servers/${serverId}/users`, adminClientToken);

        return NextResponse.json({
            users: subusers.data.map((u: any) => ({
                uuid: u.attributes.uuid,
                username: u.attributes.username,
                email: u.attributes.email,
                image: u.attributes.image,
                '2fa_enabled': u.attributes['2fa_enabled'],
                permissions: u.attributes.permissions,
            }))
        });

    } catch (error: any) {
        console.error("Subusers list error:", error.message);
        return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
    }
}
