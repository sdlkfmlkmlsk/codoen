import { NextResponse } from "next/server";

export async function GET(req: Request) {
    // Consolidated list of supported softwares with metadata
    const softwares = [
        { id: "vanilla", name: "Vanilla", icon: "/images/vanilla.png", desc: "Official Minecraft server software", versions_count: 802, builds_count: 802 },
        { id: "paper", name: "Paper", icon: "https://assets.papermc.io/brand/papermc_logo.256.png", desc: "High performance Spigot fork", versions_count: 62, builds_count: 5448 },
        { id: "pufferfish", name: "Pufferfish", icon: "/images/pufferfish.png", desc: "Highly optimized server software", versions_count: 18, builds_count: 239 },
        { id: "spigot", name: "Spigot", icon: "https://static.spigotmc.org/img/spigot.png", desc: "The classic plugin server", versions_count: 63, builds_count: 3789 },
        { id: "folia", name: "Folia", icon: "https://raw.githubusercontent.com/PaperMC/Folia/master/folia.png", desc: "Region-based multithreading", versions_count: 10, builds_count: 113 },
        { id: "purpur", name: "Purpur", icon: "https://purpurmc.org/img/purpur.png", desc: "Customizable high-performance", versions_count: 38, builds_count: 2385 },
        { id: "waterfall", name: "Waterfall", icon: "https://raw.githubusercontent.com/PaperMC/Waterfall/master/waterfall.png", desc: "Enhanced BungeeCord proxy", versions_count: 11, builds_count: 479 },
        { id: "velocity", name: "Velocity", icon: "https://raw.githubusercontent.com/PaperMC/Velocity/master/velocity.png", desc: "Modern, high performance proxy", versions_count: 11, builds_count: 459 },
        { id: "fabric", name: "Fabric", icon: "https://fabricmc.net/assets/logo.png", desc: "Lightweight modloader", versions_count: 455, builds_count: 35945 },
        { id: "bungeecord", name: "BungeeCord", icon: "https://static.spigotmc.org/img/bungeecord.png", desc: "Official proxy software", versions_count: 21, builds_count: 1924 },
        { id: "quilt", name: "Quilt", icon: "https://quiltmc.org/assets/img/logo.png", desc: "Community-driven modloader", versions_count: 384, builds_count: 109056 },
        { id: "forge", name: "Forge", icon: "https://files.minecraftforge.net/static/forge-logo.png", desc: "Legacy modloader", versions_count: 55, builds_count: 4265 },
        { id: "neoforge", name: "NeoForge", icon: "https://neoforged.net/img/logo.png", desc: "Modern modloader fork", versions_count: 24, builds_count: 1396 },
        { id: "mohist", name: "Mohist", icon: "https://mohistmc.com/images/logo.png", desc: "Forge + Paper hybrid", versions_count: 9, builds_count: 2209 },
        { id: "arclight", name: "Arclight", icon: "https://raw.githubusercontent.com/IzzelAliz/Arclight/master/arclight.png", desc: "Modern hybrid server", versions_count: 11, builds_count: 1394 },
        { id: "sponge", name: "Sponge", icon: "https://www.spongepowered.org/assets/img/icons/sponge-icon.png", desc: "Unique plugin API for Forge", versions_count: 75, builds_count: 2797 },
        { id: "leaves", name: "Leaves", icon: "https://leavesmc.org/images/logo.png", desc: "Paper fork for technical play", versions_count: 17, builds_count: 457 },
        { id: "canvas", name: "Canvas", icon: "https://raw.githubusercontent.com/Pterodactyl-Eggs/yolks/master/images/canvas.png", desc: "Modern rendering optimization", versions_count: 10, builds_count: 865 }
    ];

    return NextResponse.json({ softwares });
}
