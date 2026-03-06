export async function pteroApp(path: string, init?: RequestInit) {
    const base = process.env.PTERO_URL;
    const key = process.env.PTERO_API_KEY;

    if (!base || !key) throw new Error("Missing PTERO_URL or PTERO_API_KEY");

    const res = await fetch(`${base.replace(/\/$/, "")}${path}`, {
        ...init,
        headers: {
            "Authorization": `Bearer ${key}`,
            "Accept": "Application/vnd.pterodactyl.v1+json",
            "Content-Type": "application/json",
            ...(init?.headers || {}),
        },
        cache: "no-store",
    });

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        if (text.includes("<!DOCTYPE html>") || text.includes("<html")) {
            throw new Error(`Pterodactyl Panel is currently unavailable (Status: ${res.status}). Please check your server status at control.codeon.codes.`);
        }
        throw new Error(`Ptero API error ${res.status}: ${text.slice(0, 200)}`);
    }

    return res.json();
}

export async function pteroClient(path: string, token: string, init?: RequestInit) {
    const base = process.env.PTERO_URL;

    if (!base || !token) throw new Error("Missing PTERO_URL or Client Token");

    const res = await fetch(`${base.replace(/\/$/, "")}${path}`, {
        ...init,
        headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "Application/vnd.pterodactyl.v1+json",
            "Content-Type": "application/json",
            ...(init?.headers || {}),
        },
        cache: "no-store",
    });

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        if (text.includes("<!DOCTYPE html>") || text.includes("<html")) {
            throw new Error(`Pterodactyl Panel returned an error page (Status: ${res.status}). Your panel is currently unstable or down.`);
        }
        throw new Error(`Ptero Client API error ${res.status}: ${text.slice(0, 200)}`);
    }

    // Handle empty responses (like 204 No Content for power actions)
    if (res.status === 204) return null;

    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
        return res.json();
    }

    return res.text();
}

export async function createPteroUser(params: {
    email: string;
    username: string;
    first_name: string;
    last_name: string;
    password?: string;
}) {
    const base = process.env.PTERO_URL!;
    const key = process.env.PTERO_API_KEY!;
    if (!base || !key) throw new Error("Missing PTERO_URL or PTERO_API_KEY");

    const res = await fetch(`${base.replace(/\/$/, "")}/api/application/users`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${key}`,
            Accept: "Application/vnd.pterodactyl.v1+json",
            "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
    });

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Ptero create user failed: ${res.status} ${text}`);
    }

    const json = await res.json();
    return json.attributes;
}

export async function getPteroUserByEmail(email: string) {
    const base = process.env.PTERO_URL!;
    const key = process.env.PTERO_API_KEY!;
    if (!base || !key) throw new Error("Missing PTERO_URL or PTERO_API_KEY");

    const res = await fetch(`${base.replace(/\/$/, "")}/api/application/users?filter[email]=${encodeURIComponent(email)}`, {
        headers: {
            Authorization: `Bearer ${key}`,
            Accept: "Application/vnd.pterodactyl.v1+json",
            "Content-Type": "application/json",
        },
    });

    if (!res.ok) return null;
    const json = await res.json();
    return json.data?.[0]?.attributes || null;
}

export async function getPteroUsers() {
    const base = process.env.PTERO_URL!;
    const key = process.env.PTERO_API_KEY!;
    if (!base || !key) throw new Error("Missing PTERO_URL or PTERO_API_KEY");

    let allUsers: any[] = [];
    let page = 1;
    let hasNextPage = true;

    while (hasNextPage) {
        const res = await fetch(`${base.replace(/\/$/, "")}/api/application/users?page=${page}`, {
            headers: {
                Authorization: `Bearer ${key}`,
                Accept: "Application/vnd.pterodactyl.v1+json",
                "Content-Type": "application/json",
            },
        });

        if (!res.ok) break;
        const json = await res.json();
        const users = json.data.map((u: any) => u.attributes);
        allUsers = [...allUsers, ...users];

        if (json.meta.pagination.current_page < json.meta.pagination.total_pages) {
            page++;
        } else {
            hasNextPage = false;
        }
    }

    return allUsers;
}

export async function getPteroUserById(id: number) {
    const base = process.env.PTERO_URL!;
    const key = process.env.PTERO_API_KEY!;
    if (!base || !key) throw new Error("Missing PTERO_URL or PTERO_API_KEY");

    const res = await fetch(`${base.replace(/\/$/, "")}/api/application/users/${id}`, {
        headers: {
            Authorization: `Bearer ${key}`,
            Accept: "Application/vnd.pterodactyl.v1+json",
            "Content-Type": "application/json",
        },
    });

    if (!res.ok) return null;
    const json = await res.json();
    return json.attributes || null;
}

/**
 * Synchronizes a user's role from Pterodactyl to the local database.
 * If the user is a root_admin on Pterodactyl, they become an ADMIN locally.
 */
export async function syncUserRole<T extends { id: string, email: string, pteroUserId?: number | null, role?: string }>(localUser: T): Promise<T> {
    const { prisma } = await import("@/lib/prisma");

    let pteroUser = null;
    if (localUser.pteroUserId) {
        pteroUser = await getPteroUserById(localUser.pteroUserId);
    } else {
        pteroUser = await getPteroUserByEmail(localUser.email);
    }

    if (!pteroUser) return localUser;

    const isRootAdmin = pteroUser.root_admin === true;
    const targetRole = isRootAdmin ? "ADMIN" : "USER";

    if (localUser.role !== targetRole || !localUser.pteroUserId) {
        const updated = await prisma.user.update({
            where: { id: localUser.id },
            data: {
                role: targetRole,
                pteroUserId: pteroUser.id
            }
        });
        return { ...localUser, role: targetRole, pteroUserId: pteroUser.id };
    }

    return localUser;
}

/**
 * Centrally verify if the current user has access to a specific server.
 * Returns { user, server, errorResponse? }
 */
export async function checkServerAccess(serverId: string) {
    const { cookies } = await import("next/headers");
    const { verifyToken } = await import("@/lib/auth");
    const { prisma } = await import("@/lib/prisma");

    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
        return { errorResponse: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
    }

    const payload = await verifyToken(token);
    if (!payload || !payload.id) {
        return { errorResponse: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
    }

    // Fetch and Sync User Role
    const dbUser = await prisma.user.findUnique({
        where: { id: payload.id as string },
        select: { id: true, pteroUserId: true, email: true, role: true }
    });

    if (!dbUser) {
        return { errorResponse: NextResponse.json({ error: "User not found" }, { status: 404 }) };
    }

    const user = await syncUserRole(dbUser);
    const isAdmin = user.role === "ADMIN";

    // Fetch server from Pterodactyl
    const url = `/api/application/servers?filter[uuidShort]=${serverId}&include=allocations`;
    let pteroData;
    try {
        pteroData = await pteroApp(url);
    } catch (e) {
        return { errorResponse: NextResponse.json({ error: "Failed to fetch server info" }, { status: 502 }) };
    }

    if (!pteroData || !pteroData.data || pteroData.data.length === 0) {
        return { errorResponse: NextResponse.json({ error: "Server not found" }, { status: 404 }) };
    }

    const serverAttr = pteroData.data[0].attributes;

    // Authorization Check
    if (!isAdmin && serverAttr.user !== user.pteroUserId) {
        console.warn(`[SECURITY] Access denied to server ${serverId} for user ${user.email}`);
        return { errorResponse: NextResponse.json({ error: "Forbidden: You do not have access to this server" }, { status: 403 }) };
    }

    return { user, server: serverAttr, isAdmin };
}

import { NextResponse } from "next/server";

export async function createPteroServer(userId: string, planId: string) {
    const { prisma } = await import("@/lib/prisma");

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const plan = await prisma.plan.findUnique({ where: { id: planId } });

    if (!user || !user.pteroUserId) throw new Error("User not linked to Pterodactyl");
    if (!plan) throw new Error("Plan not found");

    // Dynamic CPU Logic based on RAM limit as requested
    let cpuLimit = plan.cpu;
    const memoryGb = plan.memory / 1024;

    if (memoryGb <= 8) {
        cpuLimit = 100;
    } else if (memoryGb <= 16) {
        cpuLimit = 160;
    } else {
        cpuLimit = 280;
    }

    // Dynamic Location Lookup - Prioritize node "ASIA-SG-P4-DEDI"
    let locationId = 1;
    let nodeId = 1;
    try {
        const nodesRes = await pteroApp("/api/application/nodes");
        if (nodesRes && nodesRes.data && nodesRes.data.length > 0) {
            const targetNode = nodesRes.data.find((n: any) => n.attributes.name === "ASIA-SG-P4-DEDI") || nodesRes.data[0];
            nodeId = targetNode.attributes.id;
            locationId = targetNode.attributes.location_id;
        }
    } catch (e) { console.error("Could not fetch nodes"); }

    // Dynamic Egg Lookup - Prioritize Paper (ID 2) in Nest 1
    let targetNestId = plan.nestId || 1;
    let targetEggId = plan.eggId || 2;

    // If not specified in DB, try to find a Minecraft Paper egg or use ID 2
    if (!plan.eggId) {
        try {
            const nestsRes = await pteroApp("/api/application/nests");
            const mcNest = nestsRes?.data?.find((n: any) => n.attributes.name.toLowerCase().includes("minecraft") || n.attributes.id === 1);

            if (mcNest) {
                targetNestId = mcNest.attributes.id;
                const eggsRes = await pteroApp(`/api/application/nests/${targetNestId}/eggs`);
                if (eggsRes && eggsRes.data) {
                    const paperEgg = eggsRes.data.find((e: any) => e.attributes.name.toLowerCase().includes("paper") || e.attributes.id === 2);
                    if (paperEgg) {
                        targetEggId = paperEgg.attributes.id;
                    } else {
                        targetEggId = eggsRes.data[0].attributes.id;
                    }
                }
            }
        } catch (e) { console.error("Could not fetch nests/eggs"); }
    }

    const payload = {
        name: `${user.name}'s Minecraft Server`,
        user: user.pteroUserId,
        egg: targetEggId,
        docker_image: "ghcr.io/pterodactyl/yolks:java_17",
        startup: "java -Xms128M -Xmx{{SERVER_MEMORY}}M -jar {{SERVER_JARFILE}}",
        environment: {
            "SERVER_JARFILE": "server.jar",
            "BUILD_NUMBER": "latest",
            "VANILLA_VERSION": "latest",
            "PAPER_VERSION": "latest",
            "MINECRAFT_VERSION": "latest"
        },
        limits: {
            memory: plan.memory,
            swap: 0,
            disk: plan.disk,
            io: 500,
            cpu: cpuLimit
        },
        feature_limits: {
            databases: 1,
            backups: 1,
            allocations: 1
        },
        deploy: {
            locations: [locationId],
            dedicated_ip: false,
            port_range: []
        }
    };

    const res = await pteroApp("/api/application/servers", {
        method: "POST",
        body: JSON.stringify(payload)
    });

    if (res && res.attributes) {
        // Save the mapping
        await prisma.serverMapping.create({
            data: {
                userId: user.id,
                pteroServerNumericId: res.attributes.id,
                pteroServerIdentifier: res.attributes.identifier
            }
        });
        return res.attributes;
    }

    throw new Error("Failed to create server on Pterodactyl");
}

export async function applyPteroUpgrade(orderId: string) {
    const { prisma } = await import("@/lib/prisma");

    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { user: true }
    }) as any;

    if (!order || order.type !== "UPGRADE" || !order.serverId) {
        throw new Error("Invalid upgrade order");
    }

    // 1. Find the server's numeric ID from the short UUID (serverId)
    const serverRes = await pteroApp(`/api/application/servers?filter[uuidShort]=${order.serverId}`);
    if (!serverRes || !serverRes.data || serverRes.data.length === 0) {
        throw new Error("Target server not found on Pterodactyl");
    }

    const pteroServerId = serverRes.data[0].attributes.id;
    const currentLimits = serverRes.data[0].attributes.limits;

    // 2. Calculate new limits
    const newMemory = currentLimits.memory + (order.addMemory || 0);
    const newCpu = currentLimits.cpu + (order.addCpu || 0);
    const newDisk = currentLimits.disk + (order.addDisk || 0);

    // 3. Update the server build configuration (Application API)
    // The build update accepts the limits object as part of the server attributes
    const updatePayload = {
        allocation: serverRes.data[0].attributes.allocation,
        memory: newMemory,
        swap: currentLimits.swap,
        disk: newDisk,
        io: currentLimits.io,
        cpu: newCpu,
        threads: currentLimits.threads,
        feature_limits: serverRes.data[0].attributes.feature_limits
    };

    const updateRes = await pteroApp(`/api/application/servers/${pteroServerId}/build`, {
        method: "PATCH",
        body: JSON.stringify(updatePayload)
    });

    if (!updateRes || !updateRes.attributes) {
        throw new Error("Failed to update server limits on Pterodactyl");
    }

    return updateRes.attributes;
}
