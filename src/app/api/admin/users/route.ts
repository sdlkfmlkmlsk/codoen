import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET() {
    try {
        const session = await getSession();
        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 1. Fetch Local Users
        const localUsers = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                pteroUserId: true,
            }
        });

        // 2. Fetch Ptero Users
        const { getPteroUsers } = await import("@/lib/ptero");
        let pteroUsers = [];
        try {
            pteroUsers = await getPteroUsers();
        } catch (e) {
            console.error("Failed to fetch Ptero users:", e);
        }

        // 3. Sync Missing Users
        const { hashPassword: hashLocal } = await import("@/lib/password");
        for (const pu of pteroUsers) {
            const exists = localUsers.find(u => u.email.toLowerCase() === pu.email.toLowerCase() || u.pteroUserId === pu.id);
            if (!exists) {
                try {
                    // Create stub user
                    const randomPass = Math.random().toString(36).slice(-12);
                    const hashed = await hashLocal(randomPass);
                    await prisma.user.create({
                        data: {
                            email: pu.email,
                            name: `${pu.first_name} ${pu.last_name}`,
                            password: hashed,
                            pteroUserId: pu.id,
                            role: pu.root_admin ? "ADMIN" : "USER"
                        }
                    });
                } catch (err) {
                    console.error(`Failed to sync Ptero user ${pu.email}`, err);
                }
            }
        }

        // 4. Final list from DB (refetched to include new ones)
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
                discordId: true,
                pteroUserId: true,
                servers: {
                    select: {
                        id: true,
                        pteroServerIdentifier: true
                    }
                }
            },
            orderBy: {
                name: 'asc'
            }
        });

        return NextResponse.json({ users });
    } catch (error: any) {
        console.error("Error fetching admin users:", error.message);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
