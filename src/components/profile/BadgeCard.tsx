"use client";

import type { BadgeDefinition } from "@/config/badges";
import clsx from "clsx";
import {
	Award,
	CakeSlice,
	Cherry,
	Cookie,
	Croissant,
	Flame,
	Globe,
	ListOrdered,
	type LucideIcon,
	MapPin,
	Package,
	Palette,
	Sparkles,
	Star,
	Sunrise,
	Users,
	Zap,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
	Cookie,
	Package,
	Award,
	MapPin,
	Globe,
	Croissant,
	CakeSlice,
	Cherry,
	Users,
	Star,
	ListOrdered,
	Flame,
	Zap,
	Palette,
	Sunrise,
	Sparkles,
};

const CATEGORY_COLORS: Record<string, { bg: string; text: string; glow: string }> = {
	explorer: { bg: "bg-brioche/15", text: "text-brioche", glow: "shadow-brioche/20" },
	category: { bg: "bg-pistachio/15", text: "text-pistachio", glow: "shadow-pistachio/20" },
	social: { bg: "bg-blueberry/15", text: "text-blueberry", glow: "shadow-blueberry/20" },
	streak: { bg: "bg-raspberry/15", text: "text-raspberry", glow: "shadow-raspberry/20" },
	special: { bg: "bg-caramel/15", text: "text-caramel", glow: "shadow-caramel/20" },
};

interface BadgeCardProps {
	badge: BadgeDefinition;
	unlocked: boolean;
	progress?: { current: number; target: number };
}

export function BadgeCard({ badge, unlocked, progress }: BadgeCardProps) {
	const Icon = ICON_MAP[badge.icon] ?? Award;
	const colors = CATEGORY_COLORS[badge.category] ?? CATEGORY_COLORS.explorer;

	return (
		<div
			className={clsx(
				"flex flex-col items-center gap-2 rounded-[16px] p-4 text-center transition-all duration-200",
				unlocked ? `bg-flour shadow-sm ${colors.glow} shadow-lg` : "bg-parchment/40 opacity-50",
			)}
		>
			<div
				className={clsx(
					"flex h-12 w-12 items-center justify-center rounded-full transition-colors",
					unlocked ? colors.bg : "bg-parchment/60",
				)}
			>
				<Icon size={22} className={clsx(unlocked ? colors.text : "text-sesame")} />
			</div>
			<div>
				<p className={clsx("text-xs font-medium", unlocked ? "text-espresso" : "text-sesame")}>
					{badge.name}
				</p>
				<p className="text-[11px] text-sesame mt-0.5">{badge.description}</p>
			</div>
			{!unlocked && progress && progress.target > 0 && (
				<div className="w-full mt-1">
					<div className="h-1 w-full rounded-full bg-parchment">
						<div
							className="h-1 rounded-full bg-brioche/40 transition-all duration-500"
							style={{
								width: `${Math.min(100, (progress.current / progress.target) * 100)}%`,
							}}
						/>
					</div>
					<p className="text-[10px] text-sesame mt-0.5 tabular-nums">
						{progress.current}/{progress.target}
					</p>
				</div>
			)}
		</div>
	);
}
