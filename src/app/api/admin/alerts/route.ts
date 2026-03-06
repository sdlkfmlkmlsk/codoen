import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { userId, message, type } = await req.json();

        if (!userId || !message) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const alert = await prisma.alert.create({
            data: {
                userId,
                message,
                type: type || "INFO",
            }
        });

        return NextResponse.json({ alert });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const session = await getSession();
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const alerts = await prisma.alert.findMany({
            include: { user: { select: { email: true, name: true } } },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ alerts });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
