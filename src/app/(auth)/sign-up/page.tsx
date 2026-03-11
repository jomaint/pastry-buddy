"use client";

import { useSignUp } from "@/api/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useTrackEvent } from "@/hooks/use-track-event";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";

const signUpSchema = z.object({
	username: z
		.string()
		.min(3, "Username must be at least 3 characters")
		.max(20, "Username must be 20 characters or less")
		.regex(/^[a-z0-9_]+$/, "Only lowercase letters, numbers, and underscores"),
	email: z.string().email("Please enter a valid email"),
	password: z.string().min(6, "Password must be at least 6 characters"),
});

type SignUpForm = z.infer<typeof signUpSchema>;

export default function SignUpPage() {
	const signUp = useSignUp();
	const trackEvent = useTrackEvent();

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<SignUpForm>({
		resolver: zodResolver(signUpSchema),
	});

	const onSubmit = (data: SignUpForm) => {
		signUp.mutate(data, {
			onSuccess: () => trackEvent("sign_up"),
		});
	};

	return (
		<div className="w-full px-4">
			<div className="mx-auto w-full max-w-sm rounded-[16px] bg-flour p-8 shadow-sm">
				<div className="flex flex-col gap-6">
					<div className="text-center">
						<h1 className="font-display text-3xl text-espresso">Join Pastry Buddy</h1>
						<p className="mt-2 text-sm text-sesame">
							Start discovering and rating your favorite pastries
						</p>
					</div>

					<form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
						<Input
							label="Username"
							type="text"
							placeholder="pastry_lover"
							error={errors.username?.message}
							{...register("username")}
						/>

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

						{signUp.error && (
							<p className="text-xs text-raspberry">
								{signUp.error instanceof Error ? signUp.error.message : "Could not create account"}
							</p>
						)}

						<Button type="submit" size="lg" disabled={signUp.isPending} className="mt-2 w-full">
							{signUp.isPending ? (
								<>
									<Loader2 size={16} className="animate-spin" />
									Creating account…
								</>
							) : (
								"Create Account"
							)}
						</Button>
					</form>

					<p className="text-center text-sm text-sesame">
						Already have an account?{" "}
						<Link
							href="/sign-in"
							className="font-medium text-brioche transition-colors hover:text-brioche/80"
						>
							Sign In
						</Link>
					</p>
				</div>
			</div>
		</div>
	);
}
