import { NextResponse } from "next/server";

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const { searchParams } = new URL(req.url);
        const query = searchParams.get("query") || "";
        const version = searchParams.get("version") || "";
        const loader = searchParams.get("loader") || "paper"; // default to paper

        // Modrinth Search API
        // project_type:plugin
        // categories:loader
        // versions:version

        const facets = [["project_type:plugin"]];
        if (loader) facets.push([`categories:${loader.toLowerCase()}`]);
        if (version) facets.push([`versions:${version}`]);

        const url = new URL("https://api.modrinth.com/v2/search");
        url.searchParams.set("query", query);
        url.searchParams.set("facets", JSON.stringify(facets));
        url.searchParams.set("limit", "20");

        const res = await fetch(url.toString(), {
            headers: {
                "User-Agent": "RivionDashboard/1.0 (contact@rivion.gg)"
            }
        });

        if (!res.ok) {
            const error = await res.text();
            return NextResponse.json({ error: "Modrinth API error", details: error }, { status: res.status });
        }

        const data = await res.json();

        return NextResponse.json({
            plugins: data.hits.map((hit: any) => ({
                id: hit.project_id,
                slug: hit.slug,
                name: hit.title,
                description: hit.description,
                author: hit.author,
                icon_url: hit.icon_url,
                downloads: hit.downloads,
                follows: hit.follows,
                latest_version: hit.latest_version,
                categories: hit.categories,
                client_side: hit.client_side,
                server_side: hit.server_side,
                gallery: hit.gallery
            })),
            total: data.total_hits
        });

    } catch (error: any) {
        console.error("Plugin Search Error:", error.message);
        return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
    }
}
