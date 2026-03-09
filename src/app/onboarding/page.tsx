"use client";

import { useAuth } from "@/api/auth";
import { useCompleteOnboarding, useSkipOnboarding } from "@/api/onboarding";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { PASTRY_CATEGORIES } from "@/config/pastry-categories";
import { useTrackEvent } from "@/hooks/use-track-event";
import { ChevronRight, Croissant, Loader2, MapPin, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

type Step = "welcome" | "categories" | "ready";

export default function OnboardingPage() {
	const { data: auth, isLoading } = useAuth();
	const router = useRouter();
	const completeOnboarding = useCompleteOnboarding();
	const skipOnboarding = useSkipOnboarding();
	const trackEvent = useTrackEvent();
	const [step, setStep] = useState<Step>("welcome");
	const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

	const toggleCategory = useCallback((name: string) => {
		setSelectedCategories((prev) =>
			prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name],
		);
	}, []);

	const handleComplete = useCallback(() => {
		completeOnboarding.mutate(selectedCategories, {
			onSuccess: () => {
				trackEvent("page_view", { pagePath: "/onboarding/complete" });
				router.push("/");
			},
		});
	}, [completeOnboarding, selectedCategories, trackEvent, router]);

	const handleSkip = useCallback(() => {
		skipOnboarding.mutate(undefined, {
			onSuccess: () => router.push("/"),
		});
	}, [skipOnboarding, router]);

	if (isLoading) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<Loader2 size={24} className="animate-spin text-sesame" />
			</div>
		);
	}

	// If already onboarded or not authenticated, redirect
	if (!auth?.isAuthenticated) {
		router.push("/sign-in");
		return null;
	}

	if (auth?.user?.onboarding_completed) {
		router.push("/");
		return null;
	}

	return (
		<div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
			<div className="mx-auto w-full max-w-md">
				{/* Step indicator */}
				<div className="mb-8 flex items-center justify-center gap-2">
					{(["welcome", "categories", "ready"] as Step[]).map((s, i) => (
						<div
							key={s}
							className={`h-1.5 rounded-full transition-all duration-300 ${
								step === s
									? "w-8 bg-brioche"
									: i < ["welcome", "categories", "ready"].indexOf(step)
										? "w-6 bg-brioche/40"
										: "w-6 bg-parchment"
							}`}
						/>
					))}
				</div>

				{/* Step: Welcome */}
				{step === "welcome" && (
					<div className="flex flex-col items-center gap-6 text-center">
						<div className="flex h-24 w-24 items-center justify-center rounded-full bg-brioche/10">
							<Croissant size={40} className="text-brioche" />
						</div>

						<div>
							<h1 className="font-display text-3xl text-espresso">Welcome to Pastry Buddy</h1>
							<p className="mt-3 text-sm leading-relaxed text-sesame">
								Your personal pastry journal. Log the pastries you love, discover new favorites, and
								connect with fellow pastry lovers.
							</p>
						</div>

						<div className="flex w-full flex-col gap-3 pt-2">
							<div className="flex items-center gap-3 rounded-[14px] bg-parchment/60 p-4 text-left">
								<Sparkles size={20} className="shrink-0 text-brioche" />
								<div>
									<p className="text-sm font-medium text-espresso">Personalized Recommendations</p>
									<p className="text-xs text-sesame">
										The more you log, the smarter your suggestions get
									</p>
								</div>
							</div>
							<div className="flex items-center gap-3 rounded-[14px] bg-parchment/60 p-4 text-left">
								<MapPin size={20} className="shrink-0 text-brioche" />
								<div>
									<p className="text-sm font-medium text-espresso">Discover Local Bakeries</p>
									<p className="text-xs text-sesame">
										Find the best pastries near you in California
									</p>
								</div>
							</div>
						</div>

						<Button size="lg" className="mt-2 w-full" onClick={() => setStep("categories")}>
							Get Started
							<ChevronRight size={16} />
						</Button>

						<button
							type="button"
							onClick={handleSkip}
							className="text-sm text-sesame transition-colors hover:text-espresso"
						>
							Skip for now
						</button>
					</div>
				)}

				{/* Step: Pick Categories */}
				{step === "categories" && (
					<div className="flex flex-col gap-6">
						<div className="text-center">
							<h1 className="font-display text-2xl text-espresso">What pastries do you love?</h1>
							<p className="mt-2 text-sm text-sesame">
								Pick at least 3 to personalize your experience
							</p>
						</div>

						<div className="flex flex-wrap justify-center gap-2">
							{PASTRY_CATEGORIES.map((cat) => (
								<Chip
									key={cat.name}
									selected={selectedCategories.includes(cat.name)}
									onToggle={() => toggleCategory(cat.name)}
								>
									{cat.name}
								</Chip>
							))}
						</div>

						<div className="flex flex-col gap-2 pt-2">
							<Button
								size="lg"
								className="w-full"
								disabled={selectedCategories.length < 3}
								onClick={() => setStep("ready")}
							>
								Continue ({selectedCategories.length} selected)
								<ChevronRight size={16} />
							</Button>
							<button
								type="button"
								onClick={() => setStep("ready")}
								className="text-sm text-sesame transition-colors hover:text-espresso"
							>
								Skip this step
							</button>
						</div>
					</div>
				)}

				{/* Step: Ready */}
				{step === "ready" && (
					<div className="flex flex-col items-center gap-6 text-center">
						<div className="flex h-24 w-24 items-center justify-center rounded-full bg-brioche/10">
							<span className="text-4xl">🎉</span>
						</div>

						<div>
							<h1 className="font-display text-2xl text-espresso">You&apos;re all set!</h1>
							<p className="mt-2 text-sm leading-relaxed text-sesame">
								Time to log your first pastry. We&apos;ll help you get started with a quick
								checklist on the home page.
							</p>
						</div>

						<div className="w-full rounded-[16px] bg-parchment/60 p-4">
							<p className="mb-3 text-xs font-medium uppercase tracking-wide text-sesame">
								Your first steps
							</p>
							<div className="flex flex-col gap-2.5">
								{[
									{ label: "Log your first pastry", done: false },
									{ label: "Follow a friend", done: false },
									{ label: "Create a pastry list", done: false },
									{ label: "Reach 5 check-ins", done: false },
								].map((item) => (
									<div key={item.label} className="flex items-center gap-2.5">
										<div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-sesame/30">
											{item.done && <span className="text-xs text-brioche">✓</span>}
										</div>
										<span className="text-sm text-espresso">{item.label}</span>
									</div>
								))}
							</div>
						</div>

						<Button
							size="lg"
							className="mt-2 w-full"
							disabled={completeOnboarding.isPending}
							onClick={handleComplete}
						>
							{completeOnboarding.isPending ? (
								<>
									<Loader2 size={16} className="animate-spin" />
									Setting up…
								</>
							) : (
								<>
									Start Exploring
									<ChevronRight size={16} />
								</>
							)}
						</Button>
					</div>
				)}
			</div>
		</div>
	);
}
