import { NextResponse } from "next/server";
import { pteroApp } from "@/lib/ptero";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function GET(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("auth_token")?.value;

        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const payload = await verifyToken(token);
        if (!payload || !payload.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Fetch and Sync User Role
        const dbUser = await prisma.user.findUnique({
            where: { id: payload.id as string },
            select: { id: true, pteroUserId: true, email: true, role: true }
        });
        if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const { syncUserRole } = await import("@/lib/ptero");
        const user = await syncUserRole(dbUser);
        const isAdmin = user.role === "ADMIN";

        // Check if user wants ALL servers (Admin View) - ONLY allowed for ADMIN role
        const { searchParams } = new URL(req.url);
        const showAll = searchParams.get("all") === "true" && isAdmin;

        let serverData = [];
        if (showAll) {
            console.log(`[DEBUG] ADMIN VIEW: Fetching all servers for admin ${user.email}...`);
            const allServersData = await pteroApp(`/api/application/servers?include=allocations`);
            serverData = allServersData?.data || [];
        } else {
            // Get servers for this specific user
            if (!user.pteroUserId) {
                return NextResponse.json({ servers: [] });
            }

            const userData = await pteroApp(`/api/application/users/${user.pteroUserId}?include=servers.allocations`);
            serverData = userData?.attributes?.relationships?.servers?.data || [];
        }

        console.log(`[DEBUG] Servers found: ${serverData.length} (AdminView: ${showAll}, IsAdmin: ${isAdmin})`);

        if (serverData.length === 0) {
            return NextResponse.json({ servers: [] });
        }

        // The servers from the user include might not have allocations included deep enough.
        // If we need more details (like allocations), we might need to fetch them individually or check the structure.
        // Usually, the included servers have basic attributes.
        const servers = serverData.map((s: any) => {
            const attr = s.attributes;
            // Note: Allocations might not be in the user->servers include by default.
            // If they are missing, we use placeholder info or fetch more.
            // But let's check if they are there.

            const allocId = attr.allocation;
            const allocs = attr.relationships?.allocations?.data || [];
            const primaryAlloc = allocs.find((a: any) => a.attributes?.id === allocId)?.attributes
                || allocs.find((a: any) => a.attributes?.is_default)?.attributes
                || allocs[0]?.attributes;

            return {
                id: attr.identifier,
                numericId: attr.id,
                name: attr.name,
                description: attr.description,
                suspended: attr.suspended,
                limits: attr.limits,
                allocation: primaryAlloc
                    ? { ip: primaryAlloc.ip, port: primaryAlloc.port, alias: primaryAlloc.alias }
                    : null,
                egg: attr.relationships?.egg?.data?.attributes?.name ?? null,
                nodeId: attr.node,
            };
        });

        return NextResponse.json({ servers });
    } catch (error: any) {
        console.error("Servers API Error:", error.message);
        return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
    }
}
