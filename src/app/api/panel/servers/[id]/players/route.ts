import { NextResponse } from "next/server";
import { pteroClient, checkServerAccess } from "@/lib/ptero";

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const { id: serverId } = await props.params;

        const { errorResponse } = await checkServerAccess(serverId);
        if (errorResponse) return errorResponse;

        const adminClientToken = process.env.PTERO_ADMIN_CLIENT_TOKEN;
        if (!adminClientToken) {
            return NextResponse.json({ error: "Missing Admin Client Token" }, { status: 500 });
        }

        // Helper to fetch file content, returns null if file not found or empty
        const getFileContent = async (filename: string) => {
            try {
                const content = await pteroClient(`/api/client/servers/${serverId}/files/contents?file=${encodeURIComponent(filename)}`, adminClientToken);
                return content ? JSON.parse(content) : null;
            } catch (err) {
                return null;
            }
        };

        // Fetch all relevant player files in parallel
        const [usercache, ops, whitelist, banned] = await Promise.all([
            getFileContent("usercache.json"),
            getFileContent("ops.json"),
            getFileContent("whitelist.json"),
            getFileContent("banned-players.json")
        ]);

        // Map data into a unified Player format
        // We use a Map to merge players by UUID
        const playerMap = new Map();

        // 1. Process Usercache (Base list of known players)
        if (Array.isArray(usercache)) {
            usercache.forEach((p: any) => {
                playerMap.set(p.uuid, {
                    username: p.name,
                    uuid: p.uuid,
                    status: 'offline', // We can't easily know who is 'online' without websockets, but we can show them as known
                    isWhitelisted: false,
                    isBanned: false,
                    role: 'player'
                });
            });
        }

        // 2. Process Ops
        if (Array.isArray(ops)) {
            ops.forEach((p: any) => {
                const existing = playerMap.get(p.uuid) || { username: p.name, uuid: p.uuid, status: 'offline' };
                playerMap.set(p.uuid, {
                    ...existing,
                    role: 'operator'
                });
            });
        }

        // 3. Process Whitelist
        if (Array.isArray(whitelist)) {
            whitelist.forEach((p: any) => {
                const existing = playerMap.get(p.uuid) || { username: p.name, uuid: p.uuid, status: 'offline' };
                playerMap.set(p.uuid, {
                    ...existing,
                    isWhitelisted: true
                });
            });
        }

        // 4. Process Banned
        if (Array.isArray(banned)) {
            banned.forEach((p: any) => {
                const existing = playerMap.get(p.uuid) || { username: p.name, uuid: p.uuid, status: 'offline' };
                playerMap.set(p.uuid, {
                    ...existing,
                    isBanned: true
                });
            });
        }

        const players = Array.from(playerMap.values());

        return NextResponse.json({ players });

    } catch (error: any) {
        console.error("Fetch Players Error:", error.message);
        return NextResponse.json({ error: error.message || "Failed to fetch player data" }, { status: 500 });
    }
}
