import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "./lib/auth";

export async function middleware(request: NextRequest) {
    const token = request.cookies.get("auth_token")?.value;

    // Protect /dashboard routes
    if (request.nextUrl.pathname.startsWith("/dashboard")) {
        if (!token) {
            return NextResponse.redirect(new URL("/auth", request.url));
        }

        const payload = await verifyToken(token);

        if (!payload) {
            // Invalid token, clear cookie and redirect
            const response = NextResponse.redirect(new URL("/auth", request.url));
            response.cookies.delete("auth_token");
            return response;
        }
    }

    // Redirect authenticated users away from /auth securely
    if (request.nextUrl.pathname.startsWith("/auth")) {
        if (token) {
            const payload = await verifyToken(token);
            if (payload) {
                return NextResponse.redirect(new URL("/dashboard", request.url));
            }
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/dashboard/:path*", "/auth"],
};
