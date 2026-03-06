import { NextResponse } from "next/server";
import { pteroClient } from "@/lib/ptero";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const { id: serverId } = await props.params;
        const { searchParams } = new URL(req.url);
        const file = searchParams.get("file");

        if (!file) return NextResponse.json({ error: "File parameter is required" }, { status: 400 });

        const cookieStore = await cookies();
        const token = cookieStore.get("auth_token")?.value;
        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const payload = await verifyToken(token);
        if (!payload || !payload.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const adminClientToken = process.env.PTERO_ADMIN_CLIENT_TOKEN;
        if (!adminClientToken) return NextResponse.json({ error: "No Admin Client API Token configured." }, { status: 403 });

        // URL format: GET /api/client/servers/{server}/files/contents?file={file}
        const content = await pteroClient(`/api/client/servers/${serverId}/files/contents?file=${encodeURIComponent(file)}`, adminClientToken);

        return new NextResponse(content, {
            headers: { "Content-Type": "text/plain" }
        });

    } catch (error: any) {
        console.error("Get file content error:", error.message);
        return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
    }
}

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const { id: serverId } = await props.params;
        const { searchParams } = new URL(req.url);
        const file = searchParams.get("file");
        const body = await req.text(); // Content to write

        if (!file) return NextResponse.json({ error: "File parameter is required" }, { status: 400 });

        const cookieStore = await cookies();
        const token = cookieStore.get("auth_token")?.value;
        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const payload = await verifyToken(token);
        if (!payload || !payload.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const adminClientToken = process.env.PTERO_ADMIN_CLIENT_TOKEN;
        if (!adminClientToken) return NextResponse.json({ error: "No Admin Client API Token configured." }, { status: 403 });

        // URL format: POST /api/client/servers/{server}/files/write?file={file}
        await pteroClient(`/api/client/servers/${serverId}/files/write?file=${encodeURIComponent(file)}`, adminClientToken, {
            method: "POST",
            body: body,
            headers: { "Content-Type": "text/plain" }
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Write file content error:", error.message);
        return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
    }
}
