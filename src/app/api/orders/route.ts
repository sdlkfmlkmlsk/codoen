import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

export async function POST(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("auth_token")?.value;
        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const payload = await verifyToken(token);
        if (!payload || !payload.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const formData = await req.formData();
        const type = (formData.get("type") as string) || "NEW_SERVER";
        const planId = formData.get("planId") as string;
        const serverId = formData.get("serverId") as string;
        const addMemory = parseInt(formData.get("addMemory") as string || "0");
        const addCpu = parseInt(formData.get("addCpu") as string || "0");
        const receiptFile = formData.get("receipt") as File;

        if (!receiptFile) {
            return NextResponse.json({ error: "Missing payment receipt" }, { status: 400 });
        }

        let plan = null;
        let totalPrice = 0;
        let orderName = "";

        if (type === "NEW_SERVER") {
            if (!planId) return NextResponse.json({ error: "Missing plan ID" }, { status: 400 });

            // Validate that the plan exists
            plan = await prisma.plan.findUnique({ where: { id: planId } });

            // Auto-seed plan if missing for demo/ease of use
            if (!plan) {
                const plansData: any = {
                    plan_entry_1gb: { name: "1GB RAM", price: 300, memory: 1024, cpu: 100, disk: 10000 },
                    plan_entry_2gb: { name: "2GB RAM", price: 600, memory: 2048, cpu: 100, disk: 10000 },
                    plan_entry_4gb: { name: "4GB RAM", price: 1200, memory: 4096, cpu: 100, disk: 20000 },
                    plan_pro_6gb: { name: "6GB RAM", price: 1600, memory: 6144, cpu: 100, disk: 20000 },
                    plan_pro_8gb: { name: "8GB RAM", price: 1800, memory: 8192, cpu: 100, disk: 30000 },
                    plan_pro_12gb: { name: "12GB RAM", price: 2800, memory: 12288, cpu: 160, disk: 40000 },
                    plan_extreme_16gb: { name: "16GB RAM", price: 3600, memory: 16384, cpu: 160, disk: 60000 },
                    plan_extreme_20gb: { name: "20GB RAM", price: 6800, memory: 20480, cpu: 280, disk: 80000 },
                    plan_extreme_24gb: { name: "24GB RAM", price: 7800, memory: 24576, cpu: 280, disk: 100000 },
                    plan_net_38gb: { name: "38GB RAM", price: 12000, memory: 38912, cpu: 280, disk: 150000 },
                    plan_net_48gb: { name: "48GB RAM", price: 24000, memory: 49152, cpu: 280, disk: 200000 },
                };

                const pData = plansData[planId];
                if (!pData) return NextResponse.json({ error: "Invalid Plan ID" }, { status: 400 });

                plan = await prisma.plan.create({
                    data: {
                        id: planId,
                        name: pData.name,
                        description: "Auto-generated plan",
                        price: pData.price,
                        memory: pData.memory,
                        cpu: pData.cpu,
                        disk: pData.disk,
                        eggId: 1,
                        nestId: 1
                    }
                });
            }
            totalPrice = plan.price;
            orderName = plan.name;
        } else {
            // UPGRADE logic
            if (!serverId) return NextResponse.json({ error: "Missing server ID for upgrade" }, { status: 400 });

            const ramPrice = (addMemory / 1024) * 200;
            const cpuPrice = (addCpu / 100) * 280;
            totalPrice = ramPrice + cpuPrice;
            orderName = `Upgrade: ${addMemory / 1024}GB RAM, ${addCpu / 100} Core CPU`;

            if (totalPrice <= 0) return NextResponse.json({ error: "No resources selected for upgrade" }, { status: 400 });
        }

        // Handle File Save
        const bytes = await receiptFile.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Ensure directory exists
        const uploadDir = path.join(process.cwd(), "public/receipts");
        if (!existsSync(uploadDir)) {
            await mkdir(uploadDir, { recursive: true });
        }

        const fileName = `${Date.now()}-${receiptFile.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
        const filePath = path.join(uploadDir, fileName);
        await writeFile(filePath, buffer);

        const receiptImageUrl = `/receipts/${fileName}`;

        const newOrder = await prisma.order.create({
            data: {
                userId: payload.id as string,
                planId: (plan?.id || undefined) as any,
                type: type as any,
                serverId: serverId || null,
                addMemory: addMemory || null,
                addCpu: addCpu || null,
                receiptImage: receiptImageUrl,
                status: "PENDING"
            } as any,
            include: { user: true, plan: true }
        }) as any;

        // Notify Discord
        try {
            const { notifyOrderUpdate } = await import("@/lib/discord");
            await notifyOrderUpdate(
                newOrder.id,
                orderName,
                newOrder.user.name,
                newOrder.status,
                totalPrice,
                newOrder.receiptImage || undefined
            );
        } catch (discordErr) {
            console.error("Order notification failed:", discordErr);
        }

        return NextResponse.json({ success: true, order: newOrder }, { status: 201 });
    } catch (error: any) {
        console.error("Order submit error:", error.message);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
