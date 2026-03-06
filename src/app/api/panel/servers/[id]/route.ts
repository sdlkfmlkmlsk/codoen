import { NextResponse } from "next/server";
import { pteroApp, pteroClient, checkServerAccess } from "@/lib/ptero";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const { id: serverId } = await props.params;

        const { server: attr, errorResponse } = await checkServerAccess(serverId);
        if (errorResponse) return errorResponse;

        // Fetch client details to get the correct allocation data
        const clientToken = process.env.PTERO_ADMIN_CLIENT_TOKEN || "";
        let clientServer = null;
        if (clientToken) {
            try {
                const clientData = await pteroClient(`/api/client/servers/${serverId}`, clientToken);
                clientServer = clientData.attributes;
            } catch (e) {
                console.error("Failed to fetch client server details:", e);
            }
        }

        const allocs = clientServer?.relationships?.allocations?.data || attr.relationships?.allocations?.data || [];
        const primaryAlloc = allocs.find((a: any) => a.attributes?.is_default)?.attributes
            || allocs[0]?.attributes;

        const server = {
            id: attr.identifier,
            numericId: attr.id,
            uuid: attr.uuid,
            name: attr.name,
            description: attr.description,
            suspended: attr.suspended,
            allocation: primaryAlloc
                ? { ip: primaryAlloc.ip || primaryAlloc.ip_alias, port: primaryAlloc.port, alias: primaryAlloc.ip_alias }
                : null,
            egg: attr.relationships?.egg?.data?.attributes?.name ?? null,
            limits: attr.limits // Add this to provide memory, cpu, disk limits
        };

        return NextResponse.json({ server });
    } catch (error: any) {
        console.error("Server Details API Error:", error.message);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
