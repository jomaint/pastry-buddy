import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

// Only hard-protect routes that truly need auth — guest can browse everything else
const PROTECTED_PATHS = ["/lists", "/onboarding", "/admin"];

export async function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;

	// Skip auth guard in demo mode (no Supabase configured)
	if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return NextResponse.next();

	// Only guard protected routes
	const isProtected = PROTECTED_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
	if (!isProtected) return NextResponse.next();

	// Allow public profile pages and soft-gated routes through
	if (pathname.startsWith("/profile/")) return NextResponse.next();

	const response = NextResponse.next();

	const supabase = createServerClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL || "http://localhost:54321",
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key",
		{
			cookies: {
				getAll() {
					return request.cookies.getAll();
				},
				setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
					for (const { name, value, options } of cookiesToSet) {
						response.cookies.set(name, value, options);
					}
				},
			},
		},
	);

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		const signInUrl = new URL("/sign-in", request.url);
		signInUrl.searchParams.set("redirect", pathname);
		return NextResponse.redirect(signInUrl);
	}

	// Admin routes require admin role
	if (pathname.startsWith("/admin")) {
		const { data: profile } = await supabase
			.from("profiles")
			.select("role")
			.eq("id", user.id)
			.single();

		if (profile?.role !== "admin") {
			return NextResponse.redirect(new URL("/", request.url));
		}
	}

	return response;
}

export const config = {
	matcher: ["/lists", "/onboarding", "/admin/:path*"],
};
