import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { sendDiscordMessage } from "@/lib/discord";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("auth_token")?.value;
        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const payload = await verifyToken(token);
        if (!payload || !payload.id) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

        const user = await prisma.user.findUnique({ where: { id: payload.id as string } });
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const body = await req.json();
        const { content, status } = body;

        const { id: ticketId } = await params;

        if (!content && !status) {
            return NextResponse.json({ error: "Message or status update is required" }, { status: 400 });
        }

        const ticket = await prisma.ticket.findUnique({
            where: { id: ticketId },
            include: { user: { select: { name: true, email: true } } }
        });

        if (!ticket) {
            return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
        }

        // Check ownership/admin
        if (user.role !== 'ADMIN' && ticket.userId !== user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // If status update
        if (status) {
            if (user.role !== 'ADMIN') {
                return NextResponse.json({ error: "Only admins can change status" }, { status: 403 });
            }
            await prisma.ticket.update({
                where: { id: ticketId },
                data: { status }
            });
        }

        let message = null;

        // If content is provided, create reply
        if (content) {
            message = await prisma.ticketMessage.create({
                data: {
                    ticketId,
                    userId: user.id,
                    content,
                    isAdmin: user.role === 'ADMIN'
                }
            });

            // If user replied to ticket, notify admins in Discord
            if (user.role !== 'ADMIN') {
                try {
                    const hostUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
                    const embed = {
                        title: "🔄 New Reply on Ticket",
                        color: 0x3498db, // Blue
                        fields: [
                            { name: "Ticket Subject", value: ticket.subject, inline: false },
                            { name: "From User", value: `${user.name} (${user.email})`, inline: false },
                            { name: "Reply", value: content.length > 1024 ? content.substring(0, 1020) + "..." : content, inline: false }
                        ],
                        footer: { text: `Ticket ID: ${ticketId}` }
                    };
                    const components = [
                        {
                            type: 1,
                            components: [
                                { type: 2, style: 5, label: "View Reply in Admin", url: `${hostUrl}/admin/tickets/${ticketId}` }
                            ]
                        }
                    ];
                    await sendDiscordMessage([embed], components);
                } catch (discordErr) {
                    console.error("Discord reply notify failed", discordErr);
                }
            }
        }

        return NextResponse.json({ message: "Reply added", reply: message, status: status || ticket.status }, { status: 201 });
    } catch (error: any) {
        console.error("Ticket Reply POST error:", error);
        return NextResponse.json({ error: "Failed to add reply" }, { status: 500 });
    }
}
