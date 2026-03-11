"use client";

import { useAuth } from "@/api/auth";
import { useCompleteOnboarding, useSkipOnboarding } from "@/api/onboarding";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { PASTRY_CATEGORIES } from "@/config/pastry-categories";
import { useTrackEvent } from "@/hooks/use-track-event";
import { AnimatePresence, type Variants, motion } from "framer-motion";
import { ChevronRight, Loader2, MapPin, Plus, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

type Step = "welcome" | "categories";

const fadeSlideUp: Variants = {
	hidden: { opacity: 0, y: 20 },
	visible: (delay: number) => ({
		opacity: 1,
		y: 0,
		transition: { duration: 0.5, delay, ease: [0.25, 1, 0.5, 1] },
	}),
};

const staggerContainer: Variants = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: { staggerChildren: 0.08, delayChildren: 0.6 },
	},
};

const staggerItem: Variants = {
	hidden: { opacity: 0, y: 12 },
	visible: {
		opacity: 1,
		y: 0,
		transition: { duration: 0.4, ease: [0.25, 1, 0.5, 1] },
	},
};

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

	if (!auth?.isAuthenticated) {
		router.push("/sign-in");
		return null;
	}

	if (auth?.user?.onboarding_completed) {
		router.push("/");
		return null;
	}

	return (
		<AnimatePresence mode="wait">
			{step === "welcome" && (
				<WelcomeStep key="welcome" onNext={() => setStep("categories")} onSkip={handleSkip} />
			)}
			{step === "categories" && (
				<CategoriesStep
					key="categories"
					selectedCategories={selectedCategories}
					toggleCategory={toggleCategory}
					isPending={completeOnboarding.isPending}
					onComplete={handleComplete}
				/>
			)}
		</AnimatePresence>
	);
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Welcome Step — Immersive hero screen
 * ────────────────────────────────────────────────────────────────────────── */

function WelcomeStep({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
	return (
		<motion.div
			className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-creme"
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0, transition: { duration: 0.2 } }}
		>
			{/* Pastry photo placeholder — rich warm gradient background */}
			<div className="absolute inset-0 h-[65%]">
				<div
					className="absolute inset-0"
					style={{
						background: [
							"radial-gradient(ellipse 80% 60% at 30% 20%, rgba(212, 160, 83, 0.6) 0%, transparent 60%)",
							"radial-gradient(ellipse 60% 50% at 75% 35%, rgba(196, 80, 110, 0.35) 0%, transparent 55%)",
							"radial-gradient(ellipse 50% 40% at 50% 55%, rgba(232, 168, 56, 0.4) 0%, transparent 50%)",
							"radial-gradient(ellipse 70% 45% at 20% 60%, rgba(123, 153, 113, 0.2) 0%, transparent 50%)",
							"linear-gradient(175deg, #d4a24e 0%, #c4506e 30%, #e8a838 55%, #d4a053 75%, #fdf8f0 100%)",
						].join(", "),
					}}
				/>
				{/* Floating decorative shapes to simulate pastry textures */}
				<div className="absolute inset-0 overflow-hidden opacity-20">
					<div className="absolute left-[10%] top-[15%] h-32 w-32 rounded-full bg-flour/30 blur-xl" />
					<div className="absolute right-[15%] top-[25%] h-24 w-24 rounded-full bg-honey/40 blur-lg" />
					<div className="absolute left-[40%] top-[10%] h-20 w-20 rounded-full bg-raspberry/20 blur-lg" />
					<div className="absolute left-[60%] top-[40%] h-28 w-28 rounded-full bg-brioche/30 blur-xl" />
					<div className="absolute left-[20%] top-[45%] h-16 w-16 rounded-full bg-flour/20 blur-md" />
				</div>
				{/* Gradient fade to creme at the bottom */}
				<div
					className="absolute inset-x-0 bottom-0 h-[45%]"
					style={{
						background:
							"linear-gradient(to bottom, transparent 0%, rgba(253,248,240,0.6) 40%, #fdf8f0 100%)",
					}}
				/>
			</div>

			{/* Content layer */}
			<div className="relative z-10 flex flex-1 flex-col">
				{/* Top pill badge */}
				<div className="flex justify-center pt-16">
					<motion.div
						className="inline-flex items-center gap-1.5 rounded-full bg-flour/80 px-4 py-2 text-xs font-medium text-espresso shadow-sm backdrop-blur-sm"
						custom={0.2}
						variants={fadeSlideUp}
						initial="hidden"
						animate="visible"
					>
						<Sparkles size={14} className="text-brioche" />
						Your pastry adventure starts here
					</motion.div>
				</div>

				{/* Spacer to push content down past the gradient */}
				<div className="flex-1" />

				{/* Main content area — sits in the faded-to-creme zone */}
				<div className="px-6 pb-6">
					{/* Heading */}
					<motion.h1
						className="font-display text-[2.25rem] leading-[1.15] tracking-tight text-espresso"
						custom={0.3}
						variants={fadeSlideUp}
						initial="hidden"
						animate="visible"
					>
						Discover. <span className="text-raspberry">Taste.</span> Share.
					</motion.h1>

					{/* Body text */}
					<motion.p
						className="mt-3 max-w-sm text-[0.9375rem] leading-relaxed text-sesame"
						custom={0.4}
						variants={fadeSlideUp}
						initial="hidden"
						animate="visible"
					>
						Find hidden pastry gems, save your sweetest moments, and share secret spots with
						friends. Every bite is an adventure.
					</motion.p>

					{/* CTAs */}
					<motion.div
						className="mt-8 flex flex-col gap-3"
						custom={0.5}
						variants={fadeSlideUp}
						initial="hidden"
						animate="visible"
					>
						<button
							type="button"
							onClick={onNext}
							className="golden-gradient inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full text-base font-medium text-flour shadow-md transition-all duration-150 hover:opacity-90 active:scale-[0.97] active:opacity-80"
						>
							<MapPin size={18} />
							Start Exploring
						</button>
						<button
							type="button"
							onClick={onSkip}
							className="glass-card inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full text-sm font-medium text-espresso transition-all duration-150 hover:bg-flour/90 active:scale-[0.97]"
						>
							How it Works
						</button>
					</motion.div>
				</div>
			</div>

			{/* Golden FAB */}
			<motion.button
				type="button"
				className="golden-gradient fixed bottom-6 right-6 z-20 flex h-14 w-14 items-center justify-center rounded-full text-flour shadow-lg"
				style={{ boxShadow: "0 4px 16px rgba(212, 162, 78, 0.35)" }}
				initial={{ opacity: 0, scale: 0.5 }}
				animate={{
					opacity: 1,
					scale: 1,
					transition: { delay: 0.8, duration: 0.4, ease: [0.25, 1, 0.5, 1] },
				}}
				whileHover={{ scale: 1.05 }}
				whileTap={{ scale: 0.92 }}
			>
				<Plus size={24} />
			</motion.button>
		</motion.div>
	);
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Categories Step
 * ────────────────────────────────────────────────────────────────────────── */

function CategoriesStep({
	selectedCategories,
	toggleCategory,
	isPending,
	onComplete,
}: {
	selectedCategories: string[];
	toggleCategory: (name: string) => void;
	isPending: boolean;
	onComplete: () => void;
}) {
	return (
		<motion.div
			className="flex min-h-[100dvh] flex-col items-center justify-center px-6 py-12"
			initial={{ opacity: 0, x: 40 }}
			animate={{ opacity: 1, x: 0, transition: { duration: 0.35, ease: [0.25, 1, 0.5, 1] } }}
			exit={{ opacity: 0, x: -40, transition: { duration: 0.2 } }}
		>
			<div className="mx-auto w-full max-w-md">
				{/* Step indicator */}
				<div className="mb-8 flex items-center justify-center gap-2">
					<div className="h-1.5 w-6 rounded-full bg-brioche/40" />
					<div className="h-1.5 w-8 rounded-full bg-brioche" />
				</div>

				<div className="flex flex-col gap-6">
					<div className="text-center">
						<h1 className="font-display text-2xl text-espresso">What pastries do you love?</h1>
						<p className="mt-2 text-sm text-sesame">
							Pick at least 3 to personalize your experience
						</p>
					</div>

					<motion.div
						className="flex flex-wrap justify-center gap-2"
						variants={staggerContainer}
						initial="hidden"
						animate="visible"
					>
						{PASTRY_CATEGORIES.map((cat) => (
							<motion.div key={cat.name} variants={staggerItem}>
								<Chip
									selected={selectedCategories.includes(cat.name)}
									onToggle={() => toggleCategory(cat.name)}
								>
									{cat.name}
								</Chip>
							</motion.div>
						))}
					</motion.div>

					<div className="flex flex-col gap-2 pt-2">
						<Button
							size="lg"
							className="w-full"
							disabled={selectedCategories.length < 3 || isPending}
							onClick={onComplete}
						>
							{isPending ? (
								<>
									<Loader2 size={16} className="animate-spin" />
									Setting up…
								</>
							) : (
								<>
									Start Exploring ({selectedCategories.length} selected)
									<ChevronRight size={16} />
								</>
							)}
						</Button>
						<button
							type="button"
							onClick={onComplete}
							className="text-sm text-sesame transition-colors hover:text-espresso"
						>
							Skip this step
						</button>
					</div>
				</div>
			</div>
		</motion.div>
	);
}
