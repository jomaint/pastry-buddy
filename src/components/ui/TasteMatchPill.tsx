"use client";

import { useAuth } from "@/api/auth";
import { useUserFlavorTags } from "@/api/check-ins";
import { usePastryMatchScore } from "@/api/social";
import { CATEGORY_FLAVOR_PRIORITY } from "@/config/contextual-flavors";
import clsx from "clsx";

/**
 * Client-side fallback: calculate taste match from flavor tag overlap.
 */
function calculateMatch(userTags: Record<string, number>, pastryTags: string[]): number {
	if (!pastryTags.length || !Object.keys(userTags).length) return 0;

	const userTagSet = Object.keys(userTags);
	const overlap = pastryTags.filter((tag) => userTagSet.includes(tag)).length;

	let weightedScore = 0;
	let maxWeight = 0;
	const totalUserUses = Object.values(userTags).reduce((a, b) => a + b, 0);

	for (const tag of pastryTags) {
		const userCount = userTags[tag] ?? 0;
		const weight = userCount / totalUserUses;
		weightedScore += weight;
		maxWeight += 1 / pastryTags.length;
	}

	const overlapRatio = overlap / pastryTags.length;
	const blended = overlapRatio * 0.4 + Math.min(weightedScore / maxWeight, 1) * 0.6;

	return Math.round(blended * 100);
}

export function TasteMatchPill({
	pastryId,
	flavorTags,
	category,
}: { pastryId?: string; flavorTags?: string[]; category?: string }) {
	const { data: auth } = useAuth();

	// Use server-side RPC when pastry ID is available
	const { data: rpcScore } = usePastryMatchScore(auth?.user?.id, pastryId);

	// Client-side fallback for category-based matching
	const { data: userTags } = useUserFlavorTags(auth?.user?.id);
	const fallbackTags = flavorTags?.length
		? flavorTags
		: category
			? (CATEGORY_FLAVOR_PRIORITY[category] ?? [])
			: [];

	// Prefer RPC score when available
	const match =
		pastryId && rpcScore != null
			? rpcScore
			: userTags && fallbackTags.length > 0
				? calculateMatch(userTags, fallbackTags)
				: null;

	if (match === null || match < 30) return null;

	return (
		<span
			className={clsx(
				"inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium tabular-nums",
				match >= 80
					? "bg-pistachio/15 text-pistachio"
					: match >= 60
						? "bg-brioche/15 text-brioche"
						: "bg-parchment text-sesame",
			)}
		>
			{match}% match
		</span>
	);
}
