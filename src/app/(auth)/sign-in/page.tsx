"use client";

import { useSignIn } from "@/api/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useTrackEvent } from "@/hooks/use-track-event";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";

const signInSchema = z.object({
	email: z.string().email("Please enter a valid email"),
	password: z.string().min(6, "Password must be at least 6 characters"),
});

type SignInForm = z.infer<typeof signInSchema>;

export default function SignInPage() {
	const signIn = useSignIn();
	const trackEvent = useTrackEvent();

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<SignInForm>({
		resolver: zodResolver(signInSchema),
	});

	const onSubmit = (data: SignInForm) => {
		signIn.mutate(data, {
			onSuccess: () => trackEvent("sign_in"),
		});
	};

	return (
		<div className="w-full px-4">
			<div className="mx-auto w-full max-w-sm rounded-[16px] bg-flour p-8 shadow-sm">
				<div className="flex flex-col gap-6">
					<div className="text-center">
						<h1 className="font-display text-3xl text-espresso">Welcome Back</h1>
						<p className="mt-2 text-sm text-sesame">Sign in to continue your pastry journey</p>
					</div>

					<form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
						<Input
							label="Email"
							type="email"
							placeholder="you@example.com"
							error={errors.email?.message}
							{...register("email")}
						/>

						<Input
							label="Password"
							type="password"
							placeholder="••••••••"
							error={errors.password?.message}
							{...register("password")}
						/>

						{signIn.error && (
							<p className="text-xs text-raspberry">
								{signIn.error instanceof Error ? signIn.error.message : "Invalid email or password"}
							</p>
						)}

						<Button type="submit" size="lg" disabled={signIn.isPending} className="mt-2 w-full">
							{signIn.isPending ? (
								<>
									<Loader2 size={16} className="animate-spin" />
									Signing in…
								</>
							) : (
								"Sign In"
							)}
						</Button>
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
