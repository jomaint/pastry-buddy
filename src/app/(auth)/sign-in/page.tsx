"use client";

import Link from "next/link";

export default function SignInPage() {
	return (
		<div className="w-full px-4">
			<div className="mx-auto w-full max-w-sm rounded-[16px] bg-flour p-8 shadow-sm">
				<div className="flex flex-col gap-6">
					<div className="text-center">
						<h1 className="font-display text-3xl text-espresso">Welcome Back</h1>
						<p className="mt-2 text-sm text-sesame">Sign in to continue your pastry journey</p>
					</div>

					<form className="flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
						<div className="flex flex-col gap-1.5">
							<label htmlFor="email" className="text-sm font-medium text-espresso">
								Email
							</label>
							<input
								id="email"
								type="email"
								placeholder="you@example.com"
								className="h-11 w-full rounded-[12px] border border-parchment bg-flour px-4 text-sm text-espresso placeholder:text-sesame transition-colors focus:border-brioche focus:outline-none focus:ring-2 focus:ring-brioche/30"
							/>
						</div>

						<div className="flex flex-col gap-1.5">
							<label htmlFor="password" className="text-sm font-medium text-espresso">
								Password
							</label>
							<input
								id="password"
								type="password"
								placeholder="••••••••"
								className="h-11 w-full rounded-[12px] border border-parchment bg-flour px-4 text-sm text-espresso placeholder:text-sesame transition-colors focus:border-brioche focus:outline-none focus:ring-2 focus:ring-brioche/30"
							/>
						</div>

						<button
							type="submit"
							className="mt-2 h-11 w-full rounded-[14px] bg-brioche text-sm font-medium text-flour transition-colors hover:bg-brioche/90 active:bg-brioche/80"
						>
							Sign In
						</button>
					</form>

					<p className="text-center text-sm text-sesame">
						Don&apos;t have an account?{" "}
						<Link
							href="/sign-up"
							className="font-medium text-brioche transition-colors hover:text-brioche/80"
						>
							Sign Up
						</Link>
					</p>
				</div>
			</div>
		</div>
	);
}
