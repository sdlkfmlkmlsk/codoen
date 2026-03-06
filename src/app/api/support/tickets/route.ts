import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { notifyNewTicket } from "@/lib/discord";

export async function GET(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("auth_token")?.value;
        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const payload = await verifyToken(token);
        if (!payload || !payload.id) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

        const user = await prisma.user.findUnique({ where: { id: payload.id as string } });
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        // If admin, return all tickets
        if (user.role === 'ADMIN') {
            const allTickets = await prisma.ticket.findMany({
                include: { user: { select: { name: true, email: true } } },
                orderBy: { updatedAt: 'desc' },
            });
            return NextResponse.json({ tickets: allTickets });
        }

        // Return user's tickets
        const tickets = await prisma.ticket.findMany({
            where: { userId: user.id },
            orderBy: { updatedAt: 'desc' },
            include: { user: { select: { name: true, email: true } } },
        });

        return NextResponse.json({ tickets });
    } catch (error: any) {
        console.error("Tickets GET error:", error);
        return NextResponse.json({ error: "Failed to load tickets" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("auth_token")?.value;
        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const payload = await verifyToken(token);
        if (!payload || !payload.id) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

        const user = await prisma.user.findUnique({ where: { id: payload.id as string } });
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const body = await req.json();
        const { subject, initialMessage } = body;

        if (!subject || !initialMessage) {
            return NextResponse.json({ error: "Subject and message are required" }, { status: 400 });
        }

        const ticket = await prisma.ticket.create({
            data: {
                userId: user.id,
                subject,
                messages: {
                    create: {
                        userId: user.id,
                        content: initialMessage,
                        isAdmin: user.role === 'ADMIN'
                    }
                }
            }
        });

        // Notify Discord
        try {
            const hostUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
            await notifyNewTicket(ticket.id, subject, user.name, user.email, initialMessage, hostUrl);
        } catch (discordErr) {
            console.error("Discord notification failed", discordErr);
        }

        return NextResponse.json({ message: "Ticket created successfully", ticket }, { status: 201 });
    } catch (error: any) {
        console.error("Ticket POST error:", error);
        return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 });
    }
}
