import { NextResponse } from "next/server";
import { pteroClient } from "@/lib/ptero";

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const { id: serverId } = await props.params;
        const { projectId, versionId, fileName } = await req.json();

        if (!projectId) {
            return NextResponse.json({ error: "Missing project ID" }, { status: 400 });
        }

        const adminClientToken = process.env.PTERO_ADMIN_CLIENT_TOKEN;
        if (!adminClientToken) {
            return NextResponse.json({ error: "Missing Admin Client Token" }, { status: 500 });
        }

        // 1. Get Project/Version details from Modrinth to find the download URL
        let downloadUrl = "";
        let actualFileName = fileName || `${projectId}.jar`;

        // We'll target the latest version if versionId is not provided
        const modrinthUrl = versionId
            ? `https://api.modrinth.com/v2/version/${versionId}`
            : `https://api.modrinth.com/v2/project/${projectId}/version`;

        const modResponse = await fetch(modrinthUrl, {
            headers: { "User-Agent": "RivionDashboard/1.0" }
        });

        if (!modResponse.ok) {
            return NextResponse.json({ error: "Modrinth version lookup failed" }, { status: 502 });
        }

        const modData = await modResponse.json();
        const primaryVersion = Array.isArray(modData) ? modData[0] : modData;

        if (!primaryVersion || !primaryVersion.files || primaryVersion.files.length === 0) {
            return NextResponse.json({ error: "No files found for this plugin version" }, { status: 404 });
        }

        // Find primary file (not hash/signature)
        const primaryFile = primaryVersion.files.find((f: any) => f.primary) || primaryVersion.files[0];
        downloadUrl = primaryFile.url;
        actualFileName = primaryFile.filename;

        // 2. Use Pterodactyl to Pull the file
        // Ensure directory has leading slash for compatibility on some panel/wings versions
        await pteroClient(`/api/client/servers/${serverId}/files/pull`, adminClientToken, {
            method: "POST",
            body: JSON.stringify({
                url: downloadUrl,
                directory: "/plugins",
                filename: actualFileName
            })
        });

        return NextResponse.json({ success: true, fileName: actualFileName });

    } catch (error: any) {
        console.error("Plugin Install Error:", error.message);
        return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
    }
}
