"use client";

import { useAuth } from "@/api/auth";
import { useFeed } from "@/api/check-ins";
import { useFeaturedPastries, useTrendingPastries } from "@/api/pastries";
import { useNearbyPlaces } from "@/api/places";
import { Avatar } from "@/components/ui/Avatar";
import { InlineRating } from "@/components/ui/InlineRating";
import { PageTransition, StaggerContainer, StaggerItem } from "@/components/ui/PageTransition";
import { PullToRefresh } from "@/components/ui/PullToRefresh";
import { Rating } from "@/components/ui/Rating";
import { FeedCardSkeleton, PastryCardSkeleton } from "@/components/ui/Skeleton";
import { useGeolocation } from "@/hooks/use-geolocation";
import { usePageView } from "@/hooks/use-page-view";
import { getGuestCheckInCount, isGuestAtLimit } from "@/lib/guest-storage";
import { timeAgo } from "@/lib/time-utils";
import { BookOpen, Croissant, MapPin, Navigation, Plus, Sparkles, UserPlus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

// ---------------------------------------------------------------------------
// Category emoji map
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Homepage
// ---------------------------------------------------------------------------

export default function HomePage() {
	usePageView("/");

	const { data: auth } = useAuth();
	const isAuthenticated = auth?.isAuthenticated ?? false;

	// Geolocation — request automatically so nearby section can populate
	const geo = useGeolocation({ auto: true });
	const {
		data: nearbyPlaces,
		isLoading: nearbyLoading,
		refetch: refetchNearby,
	} = useNearbyPlaces(geo.latitude, geo.longitude, 15);

	const {
		data: trending,
		isLoading: trendingLoading,
		refetch: refetchTrending,
	} = useTrendingPastries(6);
	const { data: featured, refetch: refetchFeatured } = useFeaturedPastries(6);
	const { data: feed, isLoading: feedLoading, refetch: refetchFeed } = useFeed();

	// Guest check-in count (read from localStorage)
	const [guestCount, setGuestCount] = useState(0);
	const [guestAtLimit, setGuestAtLimit] = useState(false);

	useEffect(() => {
		setGuestCount(getGuestCheckInCount());
		setGuestAtLimit(isGuestAtLimit());
	}, []);

	// Trending fallback: use featured when trending has < 3 results
	const trendingDisplay =
		trending && trending.length >= 3 ? trending : (featured ?? trending ?? []);

	const showNearby = geo.hasLocation && !geo.error && (nearbyPlaces ?? []).length > 0;

	const handleRefresh = async () => {
		await Promise.all([refetchTrending(), refetchFeatured(), refetchFeed(), refetchNearby()]);
	};

	return (
		<PullToRefresh onRefresh={handleRefresh}>
			<PageTransition className="mx-auto flex max-w-2xl flex-col gap-8 px-4 py-8 pb-8 lg:max-w-3xl">
				{/* --------------------------------------------------------- */}
				{/* Hero — guests only                                        */}
				{/* --------------------------------------------------------- */}
				{!isAuthenticated && (
					<section className="flex flex-col items-center rounded-card bg-parchment/60 px-6 py-12 text-center lg:py-16">
						<span className="mb-4 text-5xl">🥐</span>
						<h1 className="font-display text-3xl leading-tight text-espresso lg:text-4xl">
							Your pastry journal
						</h1>
						<p className="mt-2 max-w-md text-base leading-relaxed text-ganache">
							that connects you to people who taste like you.
						</p>
						<div className="mt-6 flex items-center gap-3">
							<Link
								href="/sign-up"
								className="inline-flex h-10 items-center gap-2 rounded-button bg-brioche px-5 text-sm font-medium text-flour transition-all duration-150 hover:bg-brioche/90 active:scale-[0.97]"
							>
								<UserPlus size={14} />
								Create free account
							</Link>
							<Link
								href="/discover"
								className="inline-flex h-10 items-center gap-2 rounded-button border border-brioche/30 bg-flour px-5 text-sm font-medium text-espresso transition-all duration-150 hover:bg-parchment active:scale-[0.97]"
							>
								Just browsing
							</Link>
						</div>
						{guestCount > 0 && !guestAtLimit && (
							<p className="mt-4 text-xs text-sesame">
								You already have {guestCount} guest check-in{guestCount > 1 ? "s" : ""} saved
								locally.
							</p>
						)}
					</section>
				)}

				{/* --------------------------------------------------------- */}
				{/* What's Good Near You                                      */}
				{/* --------------------------------------------------------- */}
				{showNearby ? (
					<section>
						<div className="mb-3 flex items-center gap-1.5">
							<Navigation size={12} className="text-brioche" />
							<p className="text-xs font-medium uppercase tracking-wide text-sesame">
								What&rsquo;s Good Near You
							</p>
						</div>
						<div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 no-scrollbar lg:mx-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:px-0">
							{nearbyLoading ? (
								<>
									{[1, 2, 3].map((i) => (
										<div key={i} className="w-44 shrink-0 lg:w-auto">
											<PastryCardSkeleton />
										</div>
									))}
								</>
							) : (
								nearbyPlaces?.slice(0, 6).map((place) => (
									<Link
										key={place.id}
										href={`/place/${place.slug}`}
										className="flex w-44 shrink-0 flex-col gap-2 rounded-card bg-flour p-3 shadow-sm transition-all duration-150 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] lg:w-auto"
									>
										<div className="relative aspect-[4/3] w-full overflow-hidden rounded-input bg-parchment">
											<div className="flex h-full items-center justify-center">
												<MapPin size={24} className="text-brioche/50" />
											</div>
										</div>
										<p className="truncate text-sm font-medium text-espresso">{place.name}</p>
										{place.city && <p className="truncate text-xs text-sesame">{place.city}</p>}
									</Link>
								))
							)}
						</div>
					</section>
				) : (
					// Fallback: show trending when no geolocation
					!geo.loading &&
					!showNearby && (
						<section>
							<div className="mb-3 flex items-center gap-1.5">
								<Sparkles size={12} className="text-brioche" />
								<p className="text-xs font-medium uppercase tracking-wide text-sesame">
									Popular Right Now
								</p>
							</div>
							<div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 no-scrollbar lg:mx-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:px-0">
								{trendingLoading ? (
									<>
										{[1, 2, 3].map((i) => (
											<div key={i} className="w-40 shrink-0 lg:w-auto">
												<PastryCardSkeleton />
											</div>
										))}
									</>
								) : (
									trendingDisplay?.slice(0, 3).map((pastry) => (
										<Link
											key={pastry.id}
											href={`/pastry/${pastry.slug}`}
											className="flex w-40 shrink-0 flex-col gap-2 rounded-card bg-flour p-3 shadow-sm transition-all duration-150 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] lg:w-auto"
										>
											<div className="relative aspect-square w-full overflow-hidden rounded-input bg-parchment">
												{pastry.photo_url ? (
													<Image
														src={pastry.photo_url}
														alt={pastry.name}
														fill
														sizes="(max-width: 768px) 160px, 33vw"
														className="object-cover"
													/>
												) : (
													<div className="flex h-full items-center justify-center">
														<span className="text-3xl">{getPastryEmoji(pastry.category)}</span>
													</div>
												)}
											</div>
											<p className="truncate text-sm font-medium text-espresso">{pastry.name}</p>
											<p className="truncate text-xs text-sesame">{pastry.place_name}</p>
											<InlineRating value={pastry.avg_rating} count={pastry.total_checkins} />
										</Link>
									))
								)}
							</div>
						</section>
					)
				)}

				{/* --------------------------------------------------------- */}
				{/* Trending                                                  */}
				{/* --------------------------------------------------------- */}
				<section>
					<p className="mb-3 text-xs font-medium uppercase tracking-wide text-sesame">
						Trending This Week
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
							trendingDisplay?.map((pastry) => (
								<Link
									key={pastry.id}
									href={`/pastry/${pastry.slug}`}
									className="flex w-40 shrink-0 flex-col gap-2 rounded-card bg-flour p-3 shadow-sm transition-all duration-150 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] lg:w-auto"
								>
									<div className="relative aspect-square w-full overflow-hidden rounded-input bg-parchment">
										{pastry.photo_url ? (
											<Image
												src={pastry.photo_url}
												alt={pastry.name}
												fill
												sizes="(max-width: 768px) 160px, 33vw"
												className="object-cover"
											/>
										) : (
											<div className="flex h-full items-center justify-center">
												<span className="text-3xl">{getPastryEmoji(pastry.category)}</span>
											</div>
										)}
									</div>
									<p className="truncate text-sm font-medium text-espresso">{pastry.name}</p>
									<p className="truncate text-xs text-sesame">{pastry.place_name}</p>
									<InlineRating value={pastry.avg_rating} count={pastry.total_checkins} />

									{/* Flavor tags & notes snippet */}
									{pastry.description && (
										<p className="line-clamp-2 text-xs italic leading-relaxed text-ganache">
											&ldquo;{pastry.description}&rdquo;
										</p>
									)}
								</Link>
							))
						)}
					</div>
				</section>

				{/* --------------------------------------------------------- */}
				{/* Soft CTA — context-aware                                  */}
				{/* --------------------------------------------------------- */}
				{!isAuthenticated && guestAtLimit ? (
					// Guest at limit: nudge to create account
					<section className="flex flex-col items-center rounded-card border border-brioche/20 bg-parchment/40 px-6 py-8 text-center">
						<BookOpen size={24} className="mb-3 text-brioche" />
						<p className="font-display text-lg text-espresso">Your journal is ready</p>
						<p className="mt-1 max-w-sm text-sm leading-relaxed text-ganache">
							You&rsquo;ve logged {guestCount} pastries as a guest. Create a free account to keep
							your journal, follow friends, and unlock badges.
						</p>
						<Link
							href="/sign-up"
							className="mt-5 inline-flex h-10 items-center gap-2 rounded-button bg-brioche px-5 text-sm font-medium text-flour transition-all duration-150 hover:bg-brioche/90 active:scale-[0.97]"
						>
							<UserPlus size={14} />
							Save my journal
						</Link>
					</section>
				) : !isAuthenticated ? (
					// Guest with room to log: gentle prompt
					<section className="flex flex-col items-center rounded-card border border-brioche/20 bg-parchment/40 px-6 py-8 text-center">
						<Croissant size={24} className="mb-3 text-brioche" />
						<p className="font-display text-lg text-espresso">Been here before?</p>
						<p className="mt-1 text-sm text-ganache">Tap to remember it.</p>
						<Link
							href="/log"
							className="mt-5 inline-flex h-10 items-center gap-2 rounded-button bg-brioche px-5 text-sm font-medium text-flour transition-all duration-150 hover:bg-brioche/90 active:scale-[0.97]"
						>
							<Plus size={14} />
							Log a pastry
						</Link>
					</section>
				) : null}

				{/* --------------------------------------------------------- */}
				{/* Community Feed                                            */}
				{/* --------------------------------------------------------- */}
				<section className="flex flex-col gap-4">
					<div>
						<h2 className="font-display text-2xl text-espresso lg:text-3xl">
							{isAuthenticated ? "Discovery Feed" : "Community Feed"}
						</h2>
						<p className="mt-0.5 text-xs text-sesame">
							{isAuthenticated
								? "The latest pastry finds from you and the community"
								: "See what pastry lovers are discovering"}
						</p>
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
							<p className="font-display text-lg text-espresso">
								What&rsquo;s the last pastry you had?
							</p>
							<Link
								href="/log"
								className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-button bg-brioche px-5 text-sm font-medium text-flour transition-all duration-150 hover:bg-brioche/90 active:scale-[0.97]"
							>
								<Croissant size={14} />
								Log your first pastry &rarr;
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
										{/* Header */}
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
										</div>

										{/* Pastry info */}
										<div className="flex items-start gap-3">
											<div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-input bg-parchment">
												{checkin.pastry_photo_url ? (
													<Image
														src={checkin.pastry_photo_url}
														alt={checkin.pastry_name ?? ""}
														fill
														sizes="48px"
														className="object-cover"
													/>
												) : (
													<div className="flex h-full items-center justify-center">
														<span className="text-2xl">
															{getPastryEmoji(checkin.pastry_category)}
														</span>
													</div>
												)}
											</div>
											<div className="flex-1">
												<p className="font-display text-lg text-espresso">{checkin.pastry_name}</p>
												<div className="mt-0.5 flex items-center gap-1 text-xs text-sesame">
													<MapPin size={12} />
													<span>{checkin.place_name}</span>
													{checkin.place_city && <span>· {checkin.place_city}</span>}
												</div>
											</div>
											<Rating value={checkin.rating} size="sm" readonly />
										</div>

										{/* Notes snippet */}
										{checkin.notes && (
											<p className="text-sm italic leading-relaxed text-ganache">
												&ldquo;{checkin.notes}&rdquo;
											</p>
										)}

										{/* Flavor tags */}
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
									</Link>
								</StaggerItem>
							))}
						</StaggerContainer>
					)}
				</section>

				{/* --------------------------------------------------------- */}
				{/* Golden FAB                                                */}
				{/* --------------------------------------------------------- */}
				<Link
					href="/log"
					className="fixed bottom-6 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-brioche text-flour shadow-lg transition-all duration-150 hover:bg-honey hover:shadow-xl active:scale-95 lg:bottom-8 lg:right-8"
					aria-label="Log a pastry"
				>
					<Plus size={24} strokeWidth={2.5} />
				</Link>
			</PageTransition>
		</PullToRefresh>
	);
}
