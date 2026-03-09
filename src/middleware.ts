import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const PROTECTED_PATHS = ["/log", "/lists", "/profile", "/onboarding"];

export async function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;

	// Only guard protected routes
	const isProtected = PROTECTED_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
	if (!isProtected) return NextResponse.next();

	// Allow /profile/[username] (public profile pages) through
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

	return response;
}

export const config = {
	matcher: ["/log", "/lists", "/profile", "/onboarding"],
};
