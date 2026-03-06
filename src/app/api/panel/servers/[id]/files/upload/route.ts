import { NextResponse } from "next/server";
import { pteroClient } from "@/lib/ptero";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const { id: serverId } = await props.params;
        const { searchParams } = new URL(req.url);
        const directory = searchParams.get("directory") || "/";

        const cookieStore = await cookies();
        const token = cookieStore.get("auth_token")?.value;

        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const payload = await verifyToken(token);
        if (!payload || !payload.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const adminClientToken = process.env.PTERO_ADMIN_CLIENT_TOKEN;
        if (!adminClientToken) return NextResponse.json({ error: "No Admin Client API Token configured." }, { status: 403 });

        // 1. Get signed upload URL from Pterodactyl
        const signUrl = `/api/client/servers/${serverId}/files/upload`;
        const signData = await pteroClient(signUrl, adminClientToken);
        const uploadUrl = signData.attributes?.url;

        if (!uploadUrl) {
            throw new Error("Failed to get upload URL from Pterodactyl");
        }

        // 2. Receive the file from the frontend request
        const formData = await req.formData();
        const file = formData.get("files") as File;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        // 3. Proxy the upload to Wings (the node)
        // We use the same FormData structure Pterodactyl expects
        const wingsFormData = new FormData();
        wingsFormData.append("files", file);

        const uploadRes = await fetch(`${uploadUrl}&directory=${encodeURIComponent(directory)}`, {
            method: "POST",
            body: wingsFormData,
            headers: {
                // Do not set Content-Type, let fetch handle boundary for FormData
            }
        });

        if (!uploadRes.ok) {
            const errorText = await uploadRes.text();
            throw new Error(`Wings upload failed: ${uploadRes.status} ${errorText}`);
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Proxy upload error:", error.message);
        return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
    }
}
