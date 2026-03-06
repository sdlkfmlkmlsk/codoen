import { NextResponse } from "next/server";
import { pteroClient } from "@/lib/ptero";

export async function GET() {
    try {
        const id = "8294e0a0"; // From user screenshot
        const token = process.env.PTERO_ADMIN_CLIENT_TOKEN;
        const stats = await pteroClient(`/api/client/servers/${id}/resources`, token!);
        return NextResponse.json(stats);
    } catch (e: any) {
        return NextResponse.json({ error: e.message });
    }
}
