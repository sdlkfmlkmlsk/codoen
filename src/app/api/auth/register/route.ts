import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { createPteroUser, getPteroUserByEmail } from "@/lib/ptero";

export async function POST(req: Request) {
    try {
        const { name, email, password } = await req.json();

        if (!name || !email || !password || password.length < 8) {
            return NextResponse.json({ error: "Missing required fields or password too short (min 8)" }, { status: 400 });
        }

        // Check if user already exists locally
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json({ error: "Email already in use" }, { status: 409 });
        }

        // Hash password
        const hashedPassword = await hashPassword(password);

        // Prepare Pterodactyl Details
        const parts = name ? name.split(" ") : ["User"];
        const first_name = parts[0] || "User";
        const last_name = parts.slice(1).join(" ") || "Account";
        const usernameBase = email.split("@")[0].replace(/[^a-zA-Z0-9_.-]/g, "").slice(0, 20) || "user";
        const username = `${usernameBase}_${Math.floor(Math.random() * 10000)}`;

        let pteroUserId = null;
        try {
            // Check if Pterodactyl user already exists to prevent duplicate failures
            const existingPtero = await getPteroUserByEmail(email);
            if (existingPtero) {
                pteroUserId = existingPtero.id;
            } else {
                // Auto-create in Pterodactyl
                const ptero = await createPteroUser({
                    email,
                    username,
                    first_name,
                    last_name,
                    password, // passing the raw password so it works in the panel too
                });
                pteroUserId = ptero.id;
            }
        } catch (e: any) {
            console.error("Pterodactyl user creation error:", e);
            return NextResponse.json({ error: "Failed to provision Pterodactyl panel account." }, { status: 500 });
        }

        // Create user locally
        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                pteroUserId
            },
        });

        // Send Discord Notification
        try {
            const forwarded = req.headers.get("x-forwarded-for");
            const ip = forwarded ? forwarded.split(",")[0] : "127.0.0.1";

            const { notifyNewUserRegistration } = await import("@/lib/discord");
            await notifyNewUserRegistration(name, email, ip);
        } catch (discordErr) {
            console.error("Failed to send discord notification on register", discordErr);
        }

        return NextResponse.json(
            { message: "User registered successfully", user: { id: newUser.id, name: newUser.name, email: newUser.email } },
            { status: 201 }
        );
    } catch (error) {
        console.error("Register Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
