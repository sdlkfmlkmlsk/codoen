import { NextResponse } from "next/server";

export async function GET(
    req: Request,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const { searchParams } = new URL(req.url);
        const softwareId = searchParams.get("software");

        if (!softwareId) {
            return NextResponse.json({ error: "Missing software parameter" }, { status: 400 });
        }

        let versions: any[] = [];

        if (softwareId === "vanilla") {
            const res = await fetch("https://launchermeta.mojang.com/mc/game/version_manifest.json");
            const data = await res.json();
            versions = data.versions
                .filter((v: any) => v.type === "release")
                .map((v: any) => ({
                    id: v.id,
                    name: v.id,
                    build: "latest",
                    type: "Stable",
                }));
        } else if (["paper", "folia", "waterfall", "velocity"].includes(softwareId)) {
            const res = await fetch(`https://api.papermc.io/v2/projects/${softwareId}`);
            const data = await res.json();
            versions = data.versions.reverse().map((v: string) => ({
                id: v,
                name: v,
                build: "latest",
                type: "Stable",
            }));
        } else if (softwareId === "purpur") {
            const res = await fetch("https://api.purpurmc.org/v2/purpur");
            const data = await res.json();
            versions = data.versions.reverse().map((v: string) => ({
                id: v,
                name: v,
                build: "latest",
                type: "Stable",
            }));
        } else if (softwareId === "fabric") {
            const res = await fetch("https://meta.fabricmc.net/v2/versions/game");
            const data = await res.json();
            versions = data
                .filter((v: any) => v.stable)
                .map((v: any) => ({
                    id: v.version,
                    name: v.version,
                    build: "latest",
                    type: "Stable",
                }));
        } else if (softwareId === "quilt") {
            const res = await fetch("https://meta.quiltmc.org/v3/versions/game");
            const data = await res.json();
            versions = data
                .filter((v: any) => v.stable)
                .map((v: any) => ({
                    id: v.version,
                    name: v.version,
                    build: "latest",
                    type: "Stable",
                }));
        } else {
            versions = [
                { id: "latest", name: "Latest", build: "latest", type: "Stable" },
            ];
        }

        return NextResponse.json({ versions });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
