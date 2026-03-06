// DIAGNOSTIC VERSION 1.0 - PLEASE DO NOT REMOVE
import { NextResponse } from "next/server";
import { pteroClient } from "@/lib/ptero";

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const { id: serverId } = await props.params;
        const body = await req.json();
        const softwareId = body.softwareId?.trim();
        const versionId = body.versionId?.trim();

        if (!softwareId || !versionId) {
            return NextResponse.json({ error: "Missing software or version ID" }, { status: 400 });
        }

        const adminClientToken = process.env.PTERO_ADMIN_CLIENT_TOKEN;
        if (!adminClientToken) {
            return NextResponse.json({ error: "Missing Admin Client Token" }, { status: 500 });
        }

        const targetFileName = "server.jar";
        let downloadUrl = "";

        // 1. Determine Download URL (Paper, Purpur, Vanilla, Fabric, Quilt)
        if (["paper", "folia", "waterfall", "velocity"].includes(softwareId)) {
            const paperRes = await fetch(`https://api.papermc.io/v2/projects/${softwareId}/versions/${versionId}/builds`);
            const paperData = await paperRes.json();
            if (!paperData.builds || paperData.builds.length === 0) throw new Error("No builds found for version " + versionId);
            const latestBuildObj = paperData.builds[paperData.builds.length - 1];
            const latestBuild = latestBuildObj.build || latestBuildObj;
            downloadUrl = `https://api.papermc.io/v2/projects/${softwareId}/versions/${versionId}/builds/${latestBuild}/downloads/${softwareId}-${versionId}-${latestBuild}.jar`;
        } else if (softwareId === "purpur") {
            downloadUrl = `https://api.purpurmc.org/v2/purpur/${versionId}/latest/download`;
        } else if (softwareId === "vanilla") {
            const res = await fetch("https://launchermeta.mojang.com/mc/game/version_manifest.json");
            const data = await res.json();
            const version = data.versions.find((v: any) => v.id === versionId);
            if (!version) throw new Error("Vanilla version not found");
            const vRes = await fetch(version.url);
            const vData = await vRes.json();
            downloadUrl = vData.downloads.server.url;
        } else if (softwareId === "fabric") {
            const loaderRes = await fetch("https://meta.fabricmc.net/v2/versions/loader");
            const loaderData = await loaderRes.json();
            const latestLoader = loaderData.find((l: any) => l.stable).version;
            const instRes = await fetch("https://meta.fabricmc.net/v2/versions/installer");
            const instData = await instRes.json();
            const latestInst = instData.find((i: any) => i.stable).version;
            downloadUrl = `https://meta.fabricmc.net/v2/versions/loader/${versionId}/${latestLoader}/${latestInst}/server/jar`;
        } else if (softwareId === "quilt") {
            const loaderRes = await fetch("https://meta.quiltmc.org/v3/versions/loader");
            const loaderData = await loaderRes.json();
            const latestLoader = loaderData.find((l: any) => l.stable).version;
            const instRes = await fetch("https://meta.quiltmc.org/v3/versions/installer");
            const instData = await instRes.json();
            const latestInst = instData.find((i: any) => i.stable).version;
            downloadUrl = `https://meta.quiltmc.org/v3/versions/loader/${versionId}/${latestLoader}/${latestInst}/server/jar`;
        } else {
            return NextResponse.json({ error: "Unsupported software" }, { status: 400 });
        }

        // 2. Link to Pterodactyl Panel (Update Startup Variables)
        const varMapping: Record<string, string[]> = {
            "vanilla": ["VANILLA_VERSION", "MINECRAFT_VERSION"],
            "paper": ["PAPER_VERSION", "MINECRAFT_VERSION"],
            "purpur": ["PURPUR_VERSION", "MINECRAFT_VERSION"],
            "fabric": ["FABRIC_VERSION", "MINECRAFT_VERSION"],
            "quilt": ["QUILT_VERSION", "MINECRAFT_VERSION"]
        };

        const targetVars = varMapping[softwareId] || ["MINECRAFT_VERSION"];
        for (const varName of targetVars) {
            try {
                await pteroClient(`/api/client/servers/${serverId}/startup/variable`, adminClientToken, {
                    method: "PUT",
                    body: JSON.stringify({ key: varName, value: versionId })
                });
            } catch (e) {
                // Ignore errors if variable doesn't exist on this egg
            }
        }

        // 3. Install Attempt (Always try Proxy Download/Upload for reliability)
        try {
            console.log(`[SoftwareInstall] Initiating Proxy Fetch: ${downloadUrl.trim()}`);
            const fetchRes = await fetch(downloadUrl.trim());
            if (!fetchRes.ok) throw new Error(`Download from source failed (Status: ${fetchRes.status})`);
            const buffer = await fetchRes.arrayBuffer();

            await pteroClient(`/api/client/servers/${serverId}/files/write?file=${targetFileName}`, adminClientToken, {
                method: "POST",
                body: buffer,
                headers: { "Content-Type": "application/octet-stream" }
            });

            // Auto-restart
            try {
                await pteroClient(`/api/client/servers/${serverId}/power`, adminClientToken, {
                    method: "POST",
                    body: JSON.stringify({ signal: "restart" })
                });
            } catch (e) {
                console.warn("[SoftwareInstall] Auto-restart failed");
            }

            return NextResponse.json({
                success: true,
                message: "Software Installed & Panel Linked!",
                details: `Updated variables: ${targetVars.join(", ")}`
            });
        } catch (proxyErr: any) {
            console.error("[SoftwareInstall] Proxy Fallback FAILED:", proxyErr.message);

            // Final attempt: Try files/pull as a last resort
            try {
                await pteroClient(`/api/client/servers/${serverId}/files/pull`, adminClientToken, {
                    method: "POST",
                    body: JSON.stringify({ url: downloadUrl.trim(), directory: "", filename: targetFileName })
                });
                return NextResponse.json({
                    success: true,
                    message: "Installation Initialized (Last Resort)! Please check Console.",
                    details: "Proxy upload failed, used standard pull."
                });
            } catch (pullErr: any) {
                return NextResponse.json({
                    error: "All installation methods failed",
                    details: proxyErr.message,
                    url: downloadUrl.trim()
                }, { status: 502 });
            }
        }
    } catch (error: any) {
        console.error("Route Error:", error.message);
        return NextResponse.json({ error: "Server Error", details: error.message }, { status: 500 });
    }
}
