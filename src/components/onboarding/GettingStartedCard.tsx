"use client";

import type { GettingStartedChecklist } from "@/api/onboarding";
import { Check, Croissant, List, Trophy, UserPlus, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface GettingStartedCardProps {
	checklist: GettingStartedChecklist;
}

const STEPS = [
	{
		key: "has_first_checkin" as const,
		label: "Check in your first pastry",
		href: "/add",
		icon: Croissant,
	},
	{
		key: "has_followed_someone" as const,
		label: "Follow a friend",
		href: "/discover",
		icon: UserPlus,
	},
	{
		key: "has_created_list" as const,
		label: "Create a pastry list",
		href: "/lists",
		icon: List,
	},
	{
		key: "has_five_checkins" as const,
		label: "Reach 5 check-ins",
		href: "/add",
		icon: Trophy,
	},
];

export function GettingStartedCard({ checklist }: GettingStartedCardProps) {
	const [dismissed, setDismissed] = useState(false);

	const completedCount = STEPS.filter((s) => checklist[s.key]).length;
	const allDone = completedCount === STEPS.length;

	if (dismissed || allDone) return null;

	return (
		<div className="rounded-[16px] bg-flour p-4 shadow-sm">
			<div className="mb-3 flex items-center justify-between">
				<div>
					<p className="font-display text-base text-espresso">Getting Started</p>
					<p className="text-xs text-sesame">
						{completedCount}/{STEPS.length} completed
					</p>
				</div>
				<button
					type="button"
					onClick={() => setDismissed(true)}
					className="flex h-7 w-7 items-center justify-center rounded-full text-sesame transition-colors hover:bg-parchment hover:text-espresso"
					aria-label="Dismiss"
				>
					<X size={14} />
				</button>
			</div>

			{/* Progress bar */}
			<div className="mb-4 h-1.5 rounded-full bg-parchment">
				<div
					className="h-full rounded-full bg-brioche transition-all duration-500"
					style={{ width: `${(completedCount / STEPS.length) * 100}%` }}
				/>
			</div>

			<div className="flex flex-col gap-1.5">
				{STEPS.map((step) => {
					const done = checklist[step.key];
					const Icon = step.icon;
					return (
						<Link
							key={step.key}
							href={done ? "#" : step.href}
							className={`flex items-center gap-3 rounded-[12px] px-3 py-2.5 transition-colors ${
								done ? "bg-parchment/40" : "bg-parchment/60 hover:bg-parchment"
							}`}
						>
							<div
								className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
									done ? "bg-brioche" : "border border-sesame/30"
								}`}
							>
								{done ? (
									<Check size={12} className="text-flour" />
								) : (
									<Icon size={12} className="text-sesame" />
								)}
							</div>
							<span
								className={`text-sm ${
									done ? "text-sesame line-through" : "font-medium text-espresso"
								}`}
							>
								{step.label}
							</span>
						</Link>
					);
				})}
			</div>
		</div>
	);
}
