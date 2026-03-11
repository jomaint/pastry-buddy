"use client";

import { useAuth } from "@/api/auth";
import { useIsBookmarked, useToggleBookmark } from "@/api/bookmarks";
import { usePastryCheckInsAtPlace } from "@/api/check-ins";
import { Avatar } from "@/components/ui/Avatar";
import { Rating } from "@/components/ui/Rating";
import { useToast } from "@/components/ui/Toast";
import { timeAgo } from "@/lib/time-utils";
import type { Pastry } from "@/types/database";
import type { VerdictLabel } from "@/types/database";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { Bookmark, BookmarkCheck, ChevronDown, Loader2, Star } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

// ---------------------------------------------------------------------------
// Verdict badge config
// ---------------------------------------------------------------------------

const VERDICT_DISPLAY: Record<string, { label: string; color: string }> = {
	go_to: { label: "Local Favorite", color: "bg-brioche/15 text-brioche" },
	hidden_gem: { label: "Hidden Gem", color: "bg-pistachio/15 text-pistachio" },
	worth_the_detour: { label: "Worth the Detour", color: "bg-blueberry/15 text-blueberry" },
	one_and_done: { label: "One & Done", color: "bg-sesame/15 text-sesame" },
	overrated: { label: "Overrated", color: "bg-raspberry/15 text-raspberry" },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface PlaceMenuRowProps {
	pastry: Pastry;
	placeId: string;
	friendVerdicts?: { username: string; verdict: VerdictLabel }[];
	defaultExpanded?: boolean;
}

export function PlaceMenuRow({
	pastry,
	placeId,
	friendVerdicts,
	defaultExpanded = false,
}: PlaceMenuRowProps) {
	const [expanded, setExpanded] = useState(defaultExpanded);
	const [optimisticBookmarked, setOptimisticBookmarked] = useState<boolean | null>(null);

	const { data: auth } = useAuth();
	const isAuthenticated = auth?.isAuthenticated ?? false;
	const router = useRouter();
	const toast = useToast();

	const { data: checkIns, isLoading: checkInsLoading } = usePastryCheckInsAtPlace(
		pastry.id,
		placeId,
		{ enabled: expanded },
	);

	const { data: isBookmarked } = useIsBookmarked(pastry.id);
	const toggleBookmark = useToggleBookmark();

	const bookmarked = optimisticBookmarked ?? isBookmarked ?? false;

	const handleBookmark = (e: React.MouseEvent) => {
		e.stopPropagation();

		if (!isAuthenticated) {
			router.push("/sign-in");
			return;
		}

		const willBookmark = !bookmarked;
		setOptimisticBookmarked(willBookmark);

		toggleBookmark.mutate(
			{ pastryId: pastry.id, placeId },
			{
				onSuccess: (result) => {
					setOptimisticBookmarked(null);
					toast.show({
						type: "success",
						title: result.action === "saved" ? "Saved to Want to Try" : "Removed from Want to Try",
					});
				},
				onError: () => {
					setOptimisticBookmarked(null);
					toast.show({ type: "error", title: "Something went wrong" });
				},
			},
		);
	};

	// Collect flavor tags from check-ins
	const flavorTags = expanded
		? [...new Set((checkIns ?? []).flatMap((ci) => (ci.flavor_tags as string[] | null) ?? []))]
		: [];

	return (
		<div className="rounded-card bg-flour shadow-sm">
			{/* Row header — always visible */}
			<button
				type="button"
				onClick={() => setExpanded(!expanded)}
				className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-parchment/20"
			>
				<div className="min-w-0 flex-1">
					<div className="flex items-center gap-2">
						<p className="truncate text-sm font-medium text-espresso">{pastry.name}</p>
						<span className="shrink-0 rounded-chip bg-parchment/60 px-2 py-0.5 text-[11px] font-medium text-sesame">
							{pastry.category}
						</span>
					</div>
					{/* Verdict pills */}
					{friendVerdicts && friendVerdicts.length > 0 && (
						<div className="mt-1 flex flex-wrap gap-1">
							{friendVerdicts.map((v) => {
								const display = VERDICT_DISPLAY[v.verdict];
								if (!display) return null;
								return (
									<span
										key={`${v.username}-${v.verdict}`}
										className={clsx(
											"rounded-chip px-2 py-0.5 text-[11px] font-medium",
											display.color,
										)}
									>
										{display.label}
									</span>
								);
							})}
						</div>
					)}
				</div>

				{/* Rating + count */}
				<div className="flex shrink-0 items-center gap-2">
					{pastry.avg_rating != null && pastry.avg_rating > 0 && (
						<div className="flex items-center gap-1">
							<Star size={12} className="fill-brioche text-brioche" />
							<span className="text-xs font-medium tabular-nums text-espresso">
								{pastry.avg_rating.toFixed(1)}
							</span>
						</div>
					)}
					{pastry.total_checkins != null && pastry.total_checkins > 0 && (
						<span className="text-xs tabular-nums text-sesame">
							{pastry.total_checkins} check-in{pastry.total_checkins !== 1 ? "s" : ""}
						</span>
					)}
					<ChevronDown
						size={14}
						className={clsx(
							"text-sesame transition-transform duration-200",
							expanded && "rotate-180",
						)}
					/>
				</div>
			</button>

			{/* Expanded detail */}
			<AnimatePresence>
				{expanded && (
					<motion.div
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: "auto", opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						transition={{ duration: 0.2 }}
						className="overflow-hidden"
					>
						<div className="border-t border-parchment/60 px-4 pb-4 pt-3">
							{/* Actions */}
							<div className="mb-3 flex gap-2">
								<Link
									href={`/add?pastry=${pastry.id}&place=${placeId}`}
									className="inline-flex h-8 items-center gap-1.5 rounded-button bg-brioche px-3 text-xs font-medium text-flour transition-colors hover:bg-brioche/90"
								>
									I&rsquo;ve had this
								</Link>
								<button
									type="button"
									onClick={handleBookmark}
									disabled={toggleBookmark.isPending}
									className="inline-flex h-8 items-center gap-1.5 rounded-button border border-parchment bg-flour px-3 text-xs font-medium text-espresso transition-colors hover:bg-parchment/40"
								>
									{bookmarked ? (
										<BookmarkCheck size={13} className="text-brioche" />
									) : (
										<Bookmark size={13} />
									)}
									Want to try
								</button>
							</div>

							{/* Flavor tags */}
							{flavorTags.length > 0 && (
								<div className="mb-3 flex flex-wrap gap-1">
									{flavorTags.map((tag) => (
										<span
											key={tag}
											className="rounded-chip bg-parchment/60 px-2 py-0.5 text-[11px] text-sesame"
										>
											#{tag}
										</span>
									))}
								</div>
							)}

							{/* Recent check-ins for this pastry at this place */}
							{checkInsLoading ? (
								<div className="flex justify-center py-4">
									<Loader2 size={16} className="animate-spin text-sesame" />
								</div>
							) : checkIns && checkIns.length > 0 ? (
								<div className="flex flex-col gap-2">
									{checkIns.slice(0, 3).map((ci) => (
										<div key={ci.id} className="flex items-start gap-2">
											<Avatar name={ci.user_display_name || "User"} size="sm" className="mt-0.5" />
											<div className="min-w-0 flex-1">
												<div className="flex items-center gap-1.5">
													<span className="text-xs font-medium text-espresso">
														@{ci.user_username}
													</span>
													<Rating value={ci.rating} size="sm" readonly />
													<span className="text-[11px] text-sesame">{timeAgo(ci.created_at)}</span>
												</div>
												{ci.notes && (
													<p className="mt-0.5 text-xs italic text-ganache line-clamp-2">
														{ci.notes}
													</p>
												)}
											</div>
										</div>
									))}
								</div>
							) : (
								<p className="text-xs text-sesame">No reviews yet for this item.</p>
							)}
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
