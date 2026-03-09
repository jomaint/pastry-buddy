"use client";

import { useBakeries } from "@/api/bakeries";
import { useFeed } from "@/api/check-ins";
import { useTrendingPastries } from "@/api/pastries";
import { usePersonalizedFeed } from "@/api/recommendations";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { PageTransition, StaggerContainer, StaggerItem } from "@/components/ui/PageTransition";
import { Rating } from "@/components/ui/Rating";
import { FeedCardSkeleton, PastryCardSkeleton } from "@/components/ui/Skeleton";
import { TasteMatchPill } from "@/components/ui/TasteMatchPill";
import { useTrackEvent } from "@/hooks/use-track-event";
import { timeAgo } from "@/lib/time-utils";
import { Camera, Croissant, MapPin, Sparkles, Star } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

export default function FeedPage() {
	const { data: trending, isLoading: trendingLoading } = useTrendingPastries(6);
	const { data: feed, isLoading: feedLoading } = useFeed();
	const { data: allBakeries } = useBakeries();
	const { data: forYou } = usePersonalizedFeed(6);
	const trackEvent = useTrackEvent();

	useEffect(() => {
		trackEvent("page_view", { pagePath: "/" });
	}, [trackEvent]);

	const getBakeryName = (bakeryId: string) => {
		return allBakeries?.find((b) => b.id === bakeryId)?.name ?? "";
	};

	return (
		<PageTransition className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-6">
			{/* Trending row */}
			<section>
				<p className="mb-3 text-xs font-medium uppercase tracking-wide text-sesame">
					Trending in California
				</p>
				<div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 no-scrollbar">
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
								className="flex w-40 shrink-0 flex-col gap-2 rounded-[16px] bg-flour p-3 shadow-sm transition-all duration-150 hover:shadow-md active:scale-[0.98]"
							>
								<div className="flex aspect-square w-full items-center justify-center rounded-[12px] bg-parchment">
									<Croissant size={28} className="text-brioche/30" />
								</div>
								<p className="truncate text-sm font-medium text-espresso">{pastry.name}</p>
								<p className="truncate text-xs text-sesame">{getBakeryName(pastry.bakery_id)}</p>
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-1">
										<Star size={12} className="fill-caramel text-caramel" />
										<span className="text-xs font-medium text-espresso tabular-nums">
											{pastry.avg_rating}
										</span>
										<span className="text-xs text-sesame tabular-nums">
											· {pastry.total_checkins}
										</span>
									</div>
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
					<div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 no-scrollbar">
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
								className="flex w-44 shrink-0 flex-col gap-2 rounded-[16px] bg-flour p-3 shadow-sm transition-all duration-150 hover:shadow-md active:scale-[0.98]"
							>
								<div className="flex aspect-square w-full items-center justify-center rounded-[12px] bg-parchment">
									<Croissant size={28} className="text-brioche/30" />
								</div>
								<p className="truncate text-sm font-medium text-espresso">{rec.pastry_name}</p>
								<p className="truncate text-xs text-sesame">{rec.bakery_name}</p>
								<p className="text-[11px] text-brioche/70 truncate">{rec.reason}</p>
								<div className="flex items-center justify-between">
									{rec.avg_rating && (
										<div className="flex items-center gap-1">
											<Star size={12} className="fill-caramel text-caramel" />
											<span className="text-xs font-medium text-espresso tabular-nums">
												{rec.avg_rating}
											</span>
										</div>
									)}
									<TasteMatchPill category={rec.pastry_category} />
								</div>
							</Link>
						))}
					</div>
				</section>
			)}

			{/* Feed */}
			<section className="flex flex-col gap-4">
				<h1 className="font-display text-2xl text-espresso">Your Feed</h1>
				{feedLoading ? (
					<div className="flex flex-col gap-4">
						{[1, 2, 3].map((i) => (
							<FeedCardSkeleton key={i} />
						))}
					</div>
				) : !feed || feed.length === 0 ? (
					<div className="flex flex-col items-center justify-center rounded-[16px] bg-parchment/50 py-16 text-center">
						<span className="text-4xl mb-3">🥐</span>
						<p className="font-display text-lg text-espresso">Your feed is hungry</p>
						<p className="mt-1 max-w-[240px] text-sm text-sesame">
							Log your first pastry and follow friends to fill up your feed
						</p>
						<Link
							href="/log"
							className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-[14px] bg-brioche px-5 text-sm font-medium text-flour transition-all duration-150 hover:bg-brioche/90 active:scale-[0.97]"
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
									className="flex flex-col gap-3 rounded-[16px] bg-flour p-4 shadow-sm transition-all duration-150 hover:shadow-md active:scale-[0.99]"
								>
									{/* User row */}
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
										<Rating value={checkin.rating} size="sm" readonly />
									</div>

									{/* Photo placeholder */}
									<div className="flex aspect-[4/5] w-full items-center justify-center rounded-[12px] bg-parchment">
										<Camera size={32} className="text-brioche/25" />
									</div>

									{/* Content */}
									<div>
										<p className="font-display text-lg text-espresso">{checkin.pastry_name}</p>
										<div className="mt-0.5 flex items-center gap-1 text-xs text-sesame">
											<MapPin size={12} />
											<span>{checkin.bakery_name}</span>
											<span>· {checkin.bakery_city}</span>
										</div>
									</div>

									{checkin.notes && (
										<p className="text-sm italic leading-relaxed text-ganache">
											&ldquo;{checkin.notes}&rdquo;
										</p>
									)}

									{/* Tags */}
									{checkin.flavor_tags && checkin.flavor_tags.length > 0 && (
										<div className="flex flex-wrap gap-1.5">
											{checkin.flavor_tags.map((tag) => (
												<Badge key={tag} variant="brioche">
													{tag}
												</Badge>
											))}
										</div>
									)}
								</Link>
							</StaggerItem>
						))}
					</StaggerContainer>
				)}
			</section>
		</PageTransition>
	);
}
