"use client";

import { useAuth } from "@/api/auth";
import { useBakeries } from "@/api/bakeries";
import { useFeed } from "@/api/check-ins";
import { useGettingStartedChecklist } from "@/api/onboarding";
import { useTrendingPastries } from "@/api/pastries";
import { usePersonalizedFeed } from "@/api/recommendations";
import { MiniLeaderboard } from "@/components/leaderboard/MiniLeaderboard";
import { GettingStartedCard } from "@/components/onboarding/GettingStartedCard";
import { LikeButton } from "@/components/social/LikeButton";
import { ShareButton } from "@/components/social/ShareButton";
import { Avatar } from "@/components/ui/Avatar";
import { InlineRating } from "@/components/ui/InlineRating";
import { PageTransition, StaggerContainer, StaggerItem } from "@/components/ui/PageTransition";
import { PullToRefresh } from "@/components/ui/PullToRefresh";
import { Rating } from "@/components/ui/Rating";
import { FeedCardSkeleton, PastryCardSkeleton } from "@/components/ui/Skeleton";
import { TasteMatchPill } from "@/components/ui/TasteMatchPill";
import { usePageView } from "@/hooks/use-page-view";
import { useTrackEvent } from "@/hooks/use-track-event";
import { timeAgo } from "@/lib/time-utils";
import { Compass, Croissant, MapPin, Plus, Sparkles, Users } from "lucide-react";
import Link from "next/link";
import { useCallback, useState } from "react";

const categoryEmoji: Record<string, string> = {
	croissant: "🥐",
	donut: "🍩",
	cake: "🍰",
	cookie: "🍪",
	bread: "🍞",
	pie: "🥧",
	cupcake: "🧁",
	muffin: "🧁",
	pastry: "🥐",
	tart: "🍰",
	eclair: "🥖",
	macaron: "🍬",
	waffle: "🧇",
	pancake: "🥞",
};

function getPastryEmoji(category?: string | null): string {
	if (!category) return "🥐";
	return categoryEmoji[category.toLowerCase()] ?? "🥐";
}

export default function FeedPage() {
	const { data: auth } = useAuth();
	const {
		data: trending,
		isLoading: trendingLoading,
		refetch: refetchTrending,
	} = useTrendingPastries(6);
	const { data: feed, isLoading: feedLoading, refetch: refetchFeed } = useFeed();
	const { data: allBakeries } = useBakeries();
	const { data: forYou, refetch: refetchForYou } = usePersonalizedFeed(6);
	const { data: checklist } = useGettingStartedChecklist(auth?.user?.id);
	const trackEvent = useTrackEvent();
	usePageView("/");

	const [feedTab, setFeedTab] = useState<"all" | "friends">("all");

	const handleRefresh = useCallback(async () => {
		await Promise.all([refetchTrending(), refetchFeed(), refetchForYou()]);
	}, [refetchTrending, refetchFeed, refetchForYou]);

	const getBakeryName = (bakeryId: string) => {
		return allBakeries?.find((b) => b.id === bakeryId)?.name ?? "";
	};

	return (
		<PullToRefresh onRefresh={handleRefresh}>
			<PageTransition className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-6 pb-24 lg:max-w-3xl lg:gap-8 lg:py-8">
				{/* Getting Started checklist for new users */}
				{auth?.user &&
					checklist &&
					!checklist.onboarding_completed &&
					checklist.checkin_count < 5 && <GettingStartedCard checklist={checklist} />}

				{/* Mini leaderboard widget */}
				{auth?.user && <MiniLeaderboard userId={auth.user.id} />}

				{/* Pastry Map section */}
				<section>
					<div className="mb-3 flex items-center gap-2">
						<MapPin size={16} className="text-brioche" />
						<div>
							<h2 className="font-display text-lg text-espresso">Pastry Map</h2>
							<p className="text-xs text-sesame">
								Tap a pin to see the details — your sweet spots across the city
							</p>
						</div>
					</div>
					<div className="relative flex h-44 items-center justify-center overflow-hidden rounded-card bg-parchment/60 lg:h-56">
						{/* Decorative circles */}
						<div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-brioche/8" />
						<div className="absolute -bottom-4 -left-4 h-20 w-20 rounded-full bg-brioche/6" />
						<div className="absolute right-1/4 bottom-1/4 h-12 w-12 rounded-full bg-brioche/10" />
						{/* Pin markers */}
						<div className="absolute left-[20%] top-[35%] flex h-7 w-7 items-center justify-center rounded-full bg-brioche text-flour shadow-sm">
							<MapPin size={14} />
						</div>
						<div className="absolute left-[55%] top-[25%] flex h-7 w-7 items-center justify-center rounded-full bg-raspberry text-flour shadow-sm">
							<MapPin size={14} />
						</div>
						<div className="absolute left-[70%] top-[55%] flex h-7 w-7 items-center justify-center rounded-full bg-brioche text-flour shadow-sm">
							<MapPin size={14} />
						</div>
						<p className="z-10 text-xs font-medium text-sesame">Map coming soon</p>
					</div>
				</section>

				{/* Trending row */}
				<section>
					<p className="mb-3 text-xs font-medium uppercase tracking-wide text-sesame">
						Trending in California
					</p>
					<div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 no-scrollbar lg:mx-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:px-0">
						{trendingLoading ? (
							<div className="flex gap-3">
								{[1, 2, 3].map((i) => (
									<div key={i} className="w-40 shrink-0">
										<PastryCardSkeleton />
									</div>
								))}
							</div>
						) : (
							trending?.map((pastry) => (
								<Link
									key={pastry.id}
									href={`/pastry/${pastry.id}`}
									className="flex w-40 shrink-0 flex-col gap-2 rounded-card bg-flour p-3 shadow-sm transition-all duration-150 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] lg:w-auto"
								>
									<div className="flex aspect-square w-full items-center justify-center rounded-input bg-parchment">
										<span className="text-3xl">{getPastryEmoji(pastry.category)}</span>
									</div>
									<p className="truncate text-sm font-medium text-espresso">{pastry.name}</p>
									<p className="truncate text-xs text-sesame">{getBakeryName(pastry.bakery_id)}</p>
									<div className="flex items-center justify-between">
										<InlineRating value={pastry.avg_rating} count={pastry.total_checkins} />
										<TasteMatchPill category={pastry.category} />
									</div>
								</Link>
							))
						)}
					</div>
				</section>

				{/* For You — personalized recommendations */}
				{forYou && forYou.length > 0 && (
					<section>
						<div className="mb-3 flex items-center gap-1.5">
							<Sparkles size={14} className="text-brioche" />
							<p className="text-xs font-medium uppercase tracking-wide text-sesame">For You</p>
						</div>
						<div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 no-scrollbar lg:mx-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:px-0">
							{forYou.map((rec) => (
								<Link
									key={rec.pastry_id}
									href={`/pastry/${rec.pastry_id}`}
									onClick={() =>
										trackEvent("recommendation_clicked", {
											properties: {
												pastry_id: rec.pastry_id,
												reason: rec.reason,
												source: "home_for_you",
											},
										})
									}
									className="flex w-44 shrink-0 flex-col gap-2 rounded-card bg-flour p-3 shadow-sm transition-all duration-150 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] lg:w-auto"
								>
									<div className="flex aspect-square w-full items-center justify-center rounded-input bg-parchment">
										<span className="text-3xl">{getPastryEmoji(rec.pastry_category)}</span>
									</div>
									<p className="truncate text-sm font-medium text-espresso">{rec.pastry_name}</p>
									<p className="truncate text-xs text-sesame">{rec.bakery_name}</p>
									<p className="truncate text-[11px] text-brioche/70">{rec.reason}</p>
									<div className="flex items-center justify-between">
										<InlineRating value={rec.avg_rating} />
										<TasteMatchPill category={rec.pastry_category} />
									</div>
								</Link>
							))}
						</div>
					</section>
				)}

				{/* Discovery Feed */}
				<section className="flex flex-col gap-4">
					<div>
						<h1 className="font-display text-2xl text-espresso lg:text-3xl">🏙️ Discovery Feed</h1>
						<p className="mt-0.5 text-xs text-sesame">
							The latest pastry treasures from you and your friends
						</p>
					</div>

					{/* Tab switcher */}
					<div className="flex gap-1 rounded-card bg-parchment/60 p-1">
						<button
							type="button"
							onClick={() => setFeedTab("all")}
							className={`flex flex-1 items-center justify-center gap-1.5 rounded-button px-3 py-2 text-sm font-medium transition-all duration-150 ${
								feedTab === "all"
									? "bg-flour text-espresso shadow-sm"
									: "text-sesame hover:text-ganache"
							}`}
						>
							<Compass size={14} />
							All Finds
						</button>
						<button
							type="button"
							onClick={() => setFeedTab("friends")}
							className={`flex flex-1 items-center justify-center gap-1.5 rounded-button px-3 py-2 text-sm font-medium transition-all duration-150 ${
								feedTab === "friends"
									? "bg-flour text-espresso shadow-sm"
									: "text-sesame hover:text-ganache"
							}`}
						>
							<Users size={14} />
							Friends
						</button>
					</div>

					{feedLoading ? (
						<div className="flex flex-col gap-4">
							{[1, 2, 3].map((i) => (
								<FeedCardSkeleton key={i} />
							))}
						</div>
					) : !feed || feed.length === 0 ? (
						<div className="flex flex-col items-center justify-center rounded-card bg-parchment/50 py-16 text-center">
							<span className="mb-3 text-4xl">🥐</span>
							<p className="font-display text-lg text-espresso">Your feed is hungry</p>
							<p className="mt-1 max-w-[240px] text-sm text-sesame">
								Log your first pastry and follow friends to fill up your feed
							</p>
							<Link
								href="/log"
								className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-button bg-brioche px-5 text-sm font-medium text-flour transition-all duration-150 hover:bg-brioche/90 active:scale-[0.97]"
							>
								<Croissant size={14} />
								Log your first pastry
							</Link>
						</div>
					) : (
						<StaggerContainer className="flex flex-col gap-4">
							{feed.map((checkin) => (
								<StaggerItem key={checkin.id}>
									<Link
										href={`/check-in/${checkin.id}`}
										className="golden-border-left flex flex-col gap-3 rounded-card bg-flour p-4 pl-5 shadow-sm transition-all duration-150 hover:shadow-md active:scale-[0.99]"
									>
										{/* Header: user + XP badge */}
										<div className="flex items-center gap-3">
											<Avatar name={checkin.user_display_name || "User"} size="sm" />
											<div className="flex-1">
												<p className="text-sm font-semibold text-espresso">
													{checkin.user_display_name}
												</p>
												<p className="text-xs text-sesame">
													@{checkin.user_username} · {timeAgo(checkin.created_at)}
												</p>
											</div>
											<div className="flex items-center gap-1 text-brioche">
												<Sparkles size={14} />
												<span className="text-xs font-semibold">
													+{Math.round(checkin.rating * 7)}
												</span>
											</div>
										</div>

										{/* Pastry info with emoji */}
										<div className="flex items-start gap-3">
											<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-input bg-parchment">
												<span className="text-2xl">{getPastryEmoji(checkin.pastry_category)}</span>
											</div>
											<div className="flex-1">
												<p className="font-display text-lg text-espresso">{checkin.pastry_name}</p>
												<div className="mt-0.5 flex items-center gap-1 text-xs text-sesame">
													<MapPin size={12} />
													<span>{checkin.bakery_name}</span>
													{checkin.bakery_city && <span>· {checkin.bakery_city}</span>}
												</div>
											</div>
											<Rating value={checkin.rating} size="sm" readonly />
										</div>

										{checkin.notes && (
											<p className="text-sm italic leading-relaxed text-ganache">
												&ldquo;{checkin.notes}&rdquo;
											</p>
										)}

										{/* Tags as small chips */}
										{checkin.flavor_tags && checkin.flavor_tags.length > 0 && (
											<div className="flex flex-wrap gap-1.5">
												{checkin.flavor_tags.map((tag) => (
													<span
														key={tag}
														className="rounded-chip bg-parchment px-2 py-0.5 text-[11px] font-medium text-sesame"
													>
														#{tag}
													</span>
												))}
											</div>
										)}

										{/* Footer: shared by + actions */}
										<div className="flex items-center justify-between border-t border-parchment pt-2">
											<p className="text-xs text-sesame">
												Shared by{" "}
												<span className="font-medium text-ganache">
													{checkin.user_display_name}
												</span>
											</p>
											<div className="flex items-center gap-2">
												<LikeButton checkInId={checkin.id} compact />
												<ShareButton
													checkInId={checkin.id}
													pastryName={checkin.pastry_name}
													compact
												/>
											</div>
										</div>
									</Link>
								</StaggerItem>
							))}
						</StaggerContainer>
					)}
				</section>
			</PageTransition>

			{/* Golden FAB */}
			<Link
				href="/log"
				className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-brioche text-flour shadow-lg transition-all duration-150 hover:bg-honey hover:shadow-xl active:scale-95 lg:bottom-8 lg:right-8"
				aria-label="Log a pastry"
			>
				<Plus size={24} strokeWidth={2.5} />
			</Link>
		</PullToRefresh>
	);
}
