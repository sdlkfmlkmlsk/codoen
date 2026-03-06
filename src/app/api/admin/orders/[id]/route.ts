import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: orderId } = await params;
        const { status } = await req.json(); // "APPROVED" or "REJECTED"

        if (!["APPROVED", "REJECTED"].includes(status)) {
            return NextResponse.json({ error: "Invalid status" }, { status: 400 });
        }

        const session = await getSession();
        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const order = await prisma.order.update({
            where: { id: orderId },
            data: { status },
            include: { user: true, plan: true }
        }) as any;

        // Determine Order Details for Notification
        let orderName = order.plan?.name || "Custom Service";
        let orderPrice = order.plan?.price || 0;

        if (order.type === "UPGRADE") {
            const memoryGb = (order.addMemory || 0) / 1024;
            const cpuCores = (order.addCpu || 0) / 100;
            orderName = `Upgrade: ${memoryGb}GB RAM, ${cpuCores} Core CPU`;
            orderPrice = (memoryGb * 200) + (cpuCores * 280);
        }

        // Notify Discord
        try {
            const { notifyOrderUpdate } = await import("@/lib/discord");
            await notifyOrderUpdate(
                order.id,
                orderName,
                order.user.name,
                order.status,
                orderPrice,
                order.receiptImage || undefined
            );
        } catch (discordErr) {
            console.error("Order update notification failed:", discordErr);
        }

        // Auto-provision server if APPROVED
        if (status === "APPROVED") {
            try {
                if (order.type === "UPGRADE") {
                    const { applyPteroUpgrade } = await import("@/lib/ptero");
                    await applyPteroUpgrade(order.id);
                } else {
                    const { createPteroServer } = await import("@/lib/ptero");
                    if (!order.planId) throw new Error("Plan ID missing for new server order");
                    await createPteroServer(order.userId, order.planId);
                }
            } catch (pteroErr: any) {
                console.error("Auto-provisioning failed:", pteroErr.message);
                // Revert status to PENDING so they can try again
                await prisma.order.update({
                    where: { id: orderId },
                    data: { status: "PENDING" }
                });
                return NextResponse.json({ error: `Auto-provisioning failed: ${pteroErr.message}` }, { status: 500 });
            }
        }

        return NextResponse.json({ success: true, order });
    } catch (error: any) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
