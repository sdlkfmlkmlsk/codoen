import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function getSession() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("auth_token")?.value;

        if (!token) return null;

        const payload = await verifyToken(token);
        if (!payload || !payload.id) return null;

        // Fetch from DB to ensure session is current and has correct role
        const dbUser = await prisma.user.findUnique({
            where: { id: payload.id as string },
            select: { id: true, email: true, role: true }
        });

        if (!dbUser) return null;

        return {
            user: {
                id: dbUser.id,
                email: dbUser.email,
                role: dbUser.role
            }
        };
    } catch (error) {
        return null;
    }
}
