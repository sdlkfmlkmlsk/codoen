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

        const [startup, server] = await Promise.all([
            pteroClient(`/api/client/servers/${serverId}/startup`, adminClientToken),
            pteroClient(`/api/client/servers/${serverId}`, adminClientToken)
        ]);

        return NextResponse.json({
            startup_command: startup.meta.startup_command,
            raw_startup_command: startup.meta.raw_startup_command,
            docker_image: server.attributes.docker_image,
            docker_images: startup.meta.docker_images,
            variables: startup.data.map((v: any) => ({
                name: v.attributes.name,
                description: v.attributes.description,
                env_variable: v.attributes.env_variable,
                default_value: v.attributes.default_value,
                server_value: v.attributes.server_value,
                is_editable: v.attributes.is_editable,
                rules: v.attributes.rules,
            }))
        });

    } catch (error: any) {
        console.error("Startup fetch error:", error.message);
        return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
    }
}
